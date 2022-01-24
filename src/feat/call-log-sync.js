/**
 * call log sync feature
 */

import moment from 'moment'
import extLinkSvg from 'ringcentral-embeddable-extension-common/src/common/link-external.svg'
import {
  showAuthBtn
} from './auth'
import _ from 'lodash'
import prettyMs from 'pretty-ms'
import {
  notify,
  host
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import {
  match
} from 'ringcentral-embeddable-extension-common/src/common/db'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
import { logNote, logActivity } from './log-call'
import { getFullNumber } from './common'
import { getContactInfo } from '../common/contact-info-parse'
import copy from 'json-deep-copy'

function buildId (body) {
  return body.id ||
  _.get(body, 'call.sessionId') ||
  _.get(body, 'conversation.conversationLogId')
}

function buildKey (id, cid) {
  return `rc-log-${window.rc.currentUserId}-${id}-${cid}`
}

async function saveLog (id, engageId, cid) {
  const key = buildKey(id, cid)
  await ls.set(key, engageId)
}

function notifySyncSuccess ({
  id
}) {
  const type = 'success'
  const url = `${host}/contacts/${id}`
  const msg = `
    <div>
      <div class="rc-pd1b">
        Call log synced to redtailCRM!
      </div>
      <div class="rc-pd1b">
        <a href="${url}" target="_blank">
          <img src="${extLinkSvg}" width=16 height=16 class="rc-iblock rc-mg1r" />
          <span class="rc-iblock">
            Check Event Detail
          </span>
        </a>
      </div>
    </div>
  `
  notify(msg, type, 9000)
}

export async function syncCallLogToRedtail (body) {
  // let result = _.get(body, 'call.result')
  // if (result !== 'Call connected') {
  //   return
  // }
  const isManuallySync = !body.triggerType || body.triggerType === 'manual'
  const isAutoSync = body.triggerType === 'callLogSync' || body.triggerType === 'auto'
  if (!isAutoSync && !isManuallySync) {
    return
  }
  if (_.get(body, 'sessionIds')) {
    return
  }
  if (!window.rc.local.apiKey) {
    return isManuallySync ? showAuthBtn() : null
  }
  const id = buildId(body)
  const info = await getContactInfo(body)
  let relatedContacts = await match(info.numbers)
  relatedContacts = _.flatten(
    Object.values(relatedContacts)
  )
  for (const c of relatedContacts) {
    const obj = {
      type: 'rc-init-call-log-form',
      isManuallySync,
      callLogProps: {
        relatedContacts: [c],
        info,
        id,
        isManuallySync,
        body
      }
    }
    if (isManuallySync) {
      if (
        !relatedContacts ||
        !relatedContacts.length
      ) {
        const b = copy(body)
        Object.assign(b, info)
        b.type = 'rc-show-add-contact-panel'
        return window.postMessage(b, '*')
      }
      window.postMessage(obj, '*')
    } else {
      window.postMessage(obj, '*')
    }
  }
}

/**
 * sync call log action
 * todo: need you find out how to do the sync
 * you may check the CRM site to find the right api to do it
 * @param {*} body
 * @param {*} formData
 */
export async function doSync (
  body,
  formData,
  isManuallySync,
  contacts,
  info
) {
  if (!contacts || !contacts.length) {
    return false
  }
  for (const contact of contacts) {
    await doSyncOne(contact, body, formData, isManuallySync)
  }
}

async function doSyncOne (contact, body, formData, isManuallySync) {
  const { id: contactId, name: contactName } = contact
  if (!contactId) {
    return notify('no related contact', 'warn')
  }
  const isInbound = _.get(body, 'call.direction') === 'Inbound'
  if (window.rc.noLogInbound && isInbound && !isManuallySync) {
    return null
  }
  const recording = body.call.recording
    ? `Recording link: ${body.call.recording.link}`
    : ''
  const toNumber = getFullNumber(_.get(body, 'call.to'))
  const fromNumber = getFullNumber(_.get(body, 'call.from'))
  const { duration } = body.call
  const durationFormatted = prettyMs(duration * 1000)
  const start = moment(body.call.startTime)
  const end = moment(body.call.startTime + duration * 1000)
  const typeDesc = isManuallySync ? '' : '[AutoCallLog]'
  const sd = start.format('MM/DD/YYYY')
  const st = start.format('h:ma')
  const details = `${typeDesc}Call from ${fromNumber} to ${toNumber}, duration: ${durationFormatted}, from ${sd} ${st}`
  const ed = end.format('MM/DD/YYYY')
  const et = end.format('h:ma')
  const sid = _.get(body, 'call.telephonySessionId')
  // const key = buildKey(sid, contactId)
  const res = window.rc.logType === 'NOTE'
    ? await logNote({
        contactId,
        formData,
        details,
        recording,
        isManuallySync
      })
    : await logActivity({
      contactName,
      contactId,
      formData,
      details,
      sd,
      st,
      ed,
      et,
      recording,
      isManuallySync
    })
  if (res) {
    await saveLog(sid, 'true', contactId)
    notifySyncSuccess({ id: contactId })
  } else {
    notify('call log sync to redtailCRM failed', 'warn')
    console.log('post /Metadata/Create error')
    console.log(res)
  }
}
