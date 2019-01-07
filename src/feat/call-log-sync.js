/**
 * call log sync feature
 */

import {thirdPartyConfigs} from 'ringcentral-embeddable-extension-common/src/common/app-config'
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import {createForm} from './call-log-sync-form'
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
  host
} from 'ringcentral-embeddable-extension-common/src/common/helpers'

let {
  showCallLogSyncForm,
  serviceName
} = thirdPartyConfigs

function buildFormData(data) {
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

async function getContact(body) {
  if (body.call) {
    let obj = _.find(
      [
        ...body.call.toMatches,
        ...body.call.fromMatches
      ],
      m => m.type === serviceName
    )
    return obj ? obj : {}
  }
}

function notifySyncSuccess({
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

export async function syncCallLogToRedtail(body) {
  let result = _.get(body, 'call.result')
  if (result !== 'Call connected') {
    return
  }
  let isManuallySync = !body.triggerType
  let isAutoSync = body.triggerType === 'callLogSync'
  if (!isAutoSync && !isManuallySync) {
    return
  }
  if (!window.rc.local.apiKey) {
    return isManuallySync ? showAuthBtn() : null
  }
  if (showCallLogSyncForm && isManuallySync) {
    return createForm(
      body.call,
      serviceName,
      (formData) => doSync(body, formData)
    )
  } else {
    doSync(body, {})
  }
}

async function doSync(body, formData) {
  let {id: contact_id, name: contact_name} = await getContact(body)
  if (!contact_id) {
    return notify('no related contact', 'warn')
  }
  let toNumber = _.get(body, 'call.to.phoneNumber')
  let fromNumber = _.get(body, 'call.from.phoneNumber')
  let {duration} = body.call
  let details = `${formData.title || ''}:Call from ${fromNumber} to ${toNumber}, duration: ${duration} seconds.`
  let start = moment(body.call.startTime)
  let end = moment(body.call.startTime + duration * 1000)
  let sd = start.format('DD/MM/YYYY')
  let st = start.format('H:ma')
  let ed = end.format('DD/MM/YYYY')
  let et = end.format('H:ma')
  let data = {
    utf8: '✓',
    contact_name,
    contact_id,
    'crm_activity[subject]': (formData.title || 'Autosync:') + details,
    'crm_activity[all_day]': 0,
    'crm_activity[start_date]': sd,
    'crm_activity[start_time]': st,
    'crm_activity[end_date]': ed,
    'crm_activity[end_time]': et,
    'crm_activity[description]': details,
    'crm_activity[activity_code_id]': 3,
    'crm_activity[category_id]': 2,
    attendee: window.rc.currentUserId,
    'crm_activity[importance]': 2,
    'crm_activity[priority]': '',
    commit: 'Create Activity'
  }

  let url = `${host}/activities`
  let res = await fetch.post(url, {}, {
    headers: {
      Accept: '*/*;q=0.5, text/javascript, application/javascript',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-Token': getCSRF(),
      'X-NewRelic-ID': getXid(),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: buildFormData(data)
  })
  if (res) {
    notifySyncSuccess({id: contact_id})
  } else {
    notify('call log sync to redtailCRM failed', 'warn')
    console.log('post /Metadata/Create error')
    console.log(res)
  }
}
