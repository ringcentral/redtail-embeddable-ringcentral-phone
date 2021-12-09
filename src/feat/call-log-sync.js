/**
 * call log sync feature
 */

import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'
import { createForm, getContactInfo } from './call-log-sync-form'
import moment from 'moment'
import extLinkSvg from 'ringcentral-embeddable-extension-common/src/common/link-external.svg'
import {
  showAuthBtn
} from './auth'
import _ from 'lodash'
import prettyMs from 'pretty-ms'
import {
  notify,
  host,
  formatPhone
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import {
  match
} from 'ringcentral-embeddable-extension-common/src/common/db'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
import { logNote, logActivity } from './log-call'
import { getFullNumber } from './common'
const {
  showCallLogSyncForm,
  serviceName
} = thirdPartyConfigs

function buildKey (id, cid) {
  return `rc-log-${window.rc.currentUserId}-${id}-${cid}`
}

async function saveLog (id, engageId, cid) {
  const key = buildKey(id, cid)
  await ls.set(key, engageId)
}

async function getSyncContacts (body) {
  // let objs = _.filter(
  //   [
  //     ..._.get(body, 'call.toMatches') || [],
  //     ..._.get(body, 'call.fromMatches') || [],
  //     ...(_.get(body, 'correspondentEntity') ? [_.get(body, 'correspondentEntity')] : [])
  //   ],
  //   m => m.type === serviceName
  // )
  // if (objs.length) {
  //   return objs
  // }
  let all = []
  if (body.call) {
    const nf = getFullNumber(_.get(body, 'to')) ||
      getFullNumber(_.get(body, 'call.to'))
    const nt = getFullNumber(_.get(body, 'from')) ||
      getFullNumber(_.get(body.call, 'from'))
    all = [nt, nf]
  } else {
    all = [
      getFullNumber(_.get(body, 'conversation.self')),
      ...body.conversation.correspondents.map(d => getFullNumber(d))
    ]
  }
  all = all.map(s => formatPhone(s))
  const contacts = await match(all)
  const arr = Object.keys(contacts).reduce((p, k) => {
    return [
      ...p,
      ...contacts[k]
    ]
  }, [])
  return _.uniqBy(arr, d => d.id)
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
  if (!window.rc.local.apiKey) {
    return isManuallySync ? showAuthBtn() : null
  }
  if (showCallLogSyncForm && isManuallySync) {
    const contactRelated = await getContactInfo(body, serviceName)
    if (
      !contactRelated ||
      (!contactRelated.froms && !contactRelated.tos)
    ) {
      return notify('No related contact')
    }
    return createForm(
      body,
      serviceName,
      (formData) => doSync(body, formData, isManuallySync)
    )
  } else {
    doSync(body, {})
  }
}

/**
 * sync call log action
 * todo: need you find out how to do the sync
 * you may check the CRM site to find the right api to do it
 * @param {*} body
 * @param {*} formData
 */
async function doSync (body, formData, isManuallySync) {
  const contacts = await getSyncContacts(body)
  if (!contacts.length) {
    return notify('No related contacts')
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
  const key = buildKey(sid, contactId)
  const ig = await ls.get(key)
  if (ig && !isManuallySync) {
    return null
  }
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
