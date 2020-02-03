/**
 * call log sync feature
 */

import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import { createForm, getContactInfo } from './call-log-sync-form'
import moment from 'moment'
import extLinkSvg from 'ringcentral-embeddable-extension-common/src/common/link-external.svg'
import {
  showAuthBtn
} from './auth'
import _ from 'lodash'
import {
  getXid,
  getCSRF
} from './common'
import {
  notify,
  host,
  formatPhone
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import {
  match
} from 'ringcentral-embeddable-extension-common/src/common/db'

let {
  showCallLogSyncForm,
  serviceName
} = thirdPartyConfigs

function buildFormData (data) {
  return Object.keys(data)
    .reduce((prev, k, i) => {
      let v = data[k]
      return prev +
        (i ? '&' : '') +
        encodeURIComponent(k) +
        '=' +
        encodeURIComponent(v)
    }, '')
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
      (formData) => doSync(body, formData)
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
async function doSync (body, formData) {
  let contacts = await getSyncContacts(body)
  if (!contacts.length) {
    return notify('No related contacts')
  }
  for (let contact of contacts) {
    await doSyncOne(contact, body, formData)
  }
}

async function doSyncOne (contact, body, formData) {
  let { id: contactId, name: contactName } = contact
  if (!contactId) {
    return notify('no related contact', 'warn')
  }
  let recording = body.call.recording
    ? `Recording link: ${body.call.recording.link}`
    : ''
  let toNumber = _.get(body, 'call.to.phoneNumber')
  let fromNumber = _.get(body, 'call.from.phoneNumber')
  let { duration } = body.call
  let details = `${formData.title || ''}:Call from ${fromNumber} to ${toNumber}, duration: ${duration} seconds.`
  let start = moment(body.call.startTime)
  let end = moment(body.call.startTime + duration * 1000)
  let sd = start.format('MM/DD/YYYY')
  let st = start.format('h:ma')
  let ed = end.format('MM/DD/YYYY')
  let et = end.format('h:ma')

  let data = {
    utf8: '✓',
    contact_name: contactName,
    contact_id: contactId,
    'crm_activity[subject]': (formData.title || 'Autosync:') + details,
    'crm_activity[all_day]': 0,
    'crm_activity[start_date]': sd,
    'crm_activity[start_time]': st,
    'crm_activity[end_date]': ed,
    'crm_activity[end_time]': et,
    'crm_activity[description]': recording,
    'crm_activity[activity_code_id]': 3,
    'crm_activity[percentdone]': 0,
    'crm_activity[repeats]': 'never',
    'crm_activity[category_id]': 2,
    // 'crm_activity[attendees][]': '',
    'crm_activity[attendees][]': window.rc.currentUserId,
    // 'crm_activity[attendees_attributes][0][type]': 'Crm::Activity::Attendee::User',
    // 'crm_activity[attendees_attributes][0][user_id]': window.rc.currentUserId,
    'crm_activity[importance]': 2,
    'crm_activity[priority]': '',
    commit: 'Create Activity'
  }

  let url = `${host}/activities`
  let res = await fetch.post(url, {}, {
    headers: {
      Accept: '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-Token': getCSRF(),
      'X-NewRelic-ID': getXid(),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: buildFormData(data)
  })
  if (res) {
    notifySyncSuccess({ id: contactId })
  } else {
    notify('call log sync to redtailCRM failed', 'warn')
    console.log('post /Metadata/Create error')
    console.log(res)
  }
}
