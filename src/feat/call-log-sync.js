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

let {
  showCallLogSyncForm,
  serviceName
} = thirdPartyConfigs

function buildKey (id) {
  return `rc-log-${window.rc.currentUserId}-${id}`
}

async function saveLog (id, engageId) {
  const key = buildKey(id)
  await ls.set(key, engageId)
}

async function getSyncContacts (body) {
  let all = []
  if (body.call) {
    let nf = _.get(body, 'to.phoneNumber') ||
      _.get(body, 'call.to.phoneNumber')
    let nt = _.get(body, 'from.phoneNumber') ||
      _.get(body.call, 'from.phoneNumber')
    all = [nt, nf]
  } else {
    all = [
      _.get(body, 'conversation.self.phoneNumber'),
      ...body.conversation.correspondents.map(d => d.phoneNumber)
    ]
  }
  all = all.map(s => formatPhone(s))
  let contacts = await match(all)
  let arr = Object.keys(contacts).reduce((p, k) => {
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
  let type = 'success'
  let url = `${host}/contacts/${id}`
  let msg = `
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
  let isManuallySync = !body.triggerType || body.triggerType === 'manual'
  let isAutoSync = body.triggerType === 'callLogSync' || body.triggerType === 'auto'
  if (!isAutoSync && !isManuallySync) {
    return
  }
  if (!window.rc.local.apiKey) {
    return isManuallySync ? showAuthBtn() : null
  }
  if (showCallLogSyncForm && isManuallySync) {
    let contactRelated = await getContactInfo(body, serviceName)
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
  let contacts = await getSyncContacts(body)
  if (!contacts.length) {
    return notify('No related contacts')
  }
  for (let contact of contacts) {
    await doSyncOne(contact, body, formData, isManuallySync)
  }
}

async function doSyncOne (contact, body, formData, isManuallySync) {
  let { id: contactId, name: contactName } = contact
  if (!contactId) {
    return notify('no related contact', 'warn')
  }
  const isInbound = _.get(body, 'call.direction') === 'Inbound'
  if (window.rc.noLogInbound && isInbound && !isManuallySync) {
    return null
  }
  let recording = body.call.recording
    ? `Recording link: ${body.call.recording.link}`
    : ''
  let toNumber = _.get(body, 'call.to.phoneNumber')
  let fromNumber = _.get(body, 'call.from.phoneNumber')
  let { duration } = body.call
  let durationFormatted = prettyMs(duration * 1000)
  let details = `${formData.title || ''}:Call from ${fromNumber} to ${toNumber}, duration: ${durationFormatted}`
  let start = moment(body.call.startTime)
  let end = moment(body.call.startTime + duration * 1000)
  let sd = start.format('MM/DD/YYYY')
  let st = start.format('h:ma')
  let ed = end.format('MM/DD/YYYY')
  let et = end.format('h:ma')
  const sid = _.get(body, 'call.telephonySessionId')
  const key = buildKey(sid)
  const ig = await ls.get(key)
  if (ig && !isManuallySync) {
    return null
  }
  const res = window.rc.logType === 'NOTE'
    ? await logNote({
      contactId,
      formData,
      details,
      recording
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
      recording
    })
  if (res) {
    await saveLog(sid, 'true')
    notifySyncSuccess({ id: contactId })
  } else {
    notify('call log sync to redtailCRM failed', 'warn')
    console.log('post /Metadata/Create error')
    console.log(res)
  }
}
