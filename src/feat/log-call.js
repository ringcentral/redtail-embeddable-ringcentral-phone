/**
 * save call log as note
 */

/*
Request URL: https://smf.crm3.redtailtechnology.com/contacts/2657/notes
Referrer Policy: strict-origin-when-cross-origin
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Connection: close
Content-Encoding: gzip
Content-Security-Policy: frame-ancestors 'self' https://*.netx360.com/portal/login https://*.tdameritrade.com/ https://*.tdainstitutional.com/ https://*.emaplan.com https://*.circleblack.com
Content-Type: text/javascript; charset=utf-8
Date: Mon, 19 Oct 2020 02:11:45 GMT
Expires: Fri, 01 Jan 1990 00:00:00 GMT
P3P: CP="NOI ADM DEV PSAi NAV OUR STP IND DEM"
Pragma: no-cache
Server: nginx/1.16.0
Set-Cookie: ahoy_visit=bd481068-9cec-49c6-acc6-c1658c11ff6a; path=/; expires=Mon, 19 Oct 2020 06:11:45 -0000; Secure; SameSite=None
Strict-Transport-Security: max-age=31536000; includeSubDomains
Transfer-Encoding: chunked
Vary: Accept-Encoding
X-Content-Type-Options: nosniff
X-Request-Id: 8a4b8745-342b-4a03-884f-039835379bb1
X-Runtime: 0.187159
X-UA-Compatible: chrome=1
X-XSS-Protection: 1; mode=block
Accept-Encoding: gzip, deflate, br
Accept-Language: en,zh-CN;q=0.9,zh;q=0.8
Connection: keep-alive
Content-Length: 819
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Cookie: _ga=GA1.2.1103854689.1586853659; dashboard_activities_options=---%0A%3Acolumn%3A+%272%27%0A%3Adir%3A+asc%0A; ahoy_visitor=837b0fe5-e3de-43b1-b4b5-906ce6eee539; ahoy_visit=bd481068-9cec-49c6-acc6-c1658c11ff6a; _session_id=faa7eb9947421381188a7a94d811eb68; _gid=GA1.2.1456174525.1603068476
Host: smf.crm3.redtailtechnology.com
Origin: https://smf.crm3.redtailtechnology.com
Referer: https://smf.crm3.redtailtechnology.com/contacts/2657
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36
X-CSRF-Token: ZbUIX8N6IqMZbBrJQpAGH5UgZLlFjBfgb563FzrSAT3aZQFncvOoaukuAZMAmIJvJxjgcUgciwNJDNU7+lw2LA==
X-Requested-With: XMLHttpRequest
utf8: ✓
note_template:
crm_note[body]: hello
crm_note[category_id]: 2
crm_note[note_type]: 1
new_contact_name:
crm_note[note_associations_attributes][0][noteable_type]: Crm::Account
crm_note[note_associations_attributes][0][_destroy]: 1
notify_user_id:
notify_team_id:
crm_note[permissions_attributes][0][type]:
crm_note[permissions_attributes][0][team_id]:
crm_note[permissions_attributes][0][user_id]:
crm_note[permissions_attributes][0][_destroy]: 1
crm_note[permissions_attributes][0][ability]: can
crm_note[permissions_attributes][0][action]: manage
followup_activity_template:
note_doc_ids:
view_mode_uploader: on
uploader_count: 0
draft_edit_url:
draft_id:
crm_note[include_spouse]:
commit: Save Note
*/

import {
  host
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import {
  getXid,
  getCSRF,
  buildFormData
} from './common'

export async function logNote ({
  contactId,
  formData,
  details,
  recording
}) {
  const body = `<strong>${formData.description || ''}</strong><br />${details}<br />${recording}`
  const data = {
    utf8: '✓',
    note_template: '',
    'crm_note[body]': body,
    'crm_note[category_id]': 2,
    'crm_note[note_type]': 1,
    new_contact_name: '',
    'crm_note[note_associations_attributes][0][noteable_type]': 'Crm::Account',
    'crm_note[note_associations_attributes][0][_destroy]': 1,
    notify_user_id: '',
    notify_team_id: '',
    'crm_note[permissions_attributes][0][type]': '',
    'crm_note[permissions_attributes][0][team_id]': '',
    'crm_note[permissions_attributes][0][user_id]': '',
    'crm_note[permissions_attributes][0][_destroy]': 1,
    'crm_note[permissions_attributes][0][ability]': 'can',
    'crm_note[permissions_attributes][0][action]': 'manage',
    followup_activity_template: '',
    note_doc_ids: '',
    view_mode_uploader: 'on',
    uploader_count: 0,
    draft_edit_url: '',
    draft_id: '',
    'crm_note[include_spouse]': '',
    commit: 'Save Note'
  }

  const url = `${host}/contacts/${contactId}/notes`
  const res = await fetch.post(url, {}, {
    headers: {
      Accept: '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-Token': getCSRF(),
      'X-NewRelic-ID': getXid(),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: buildFormData(data)
  })
  return res
}

export async function logActivity ({
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
}) {
  const title = isManuallySync ? 'Call log' : 'Auto Call log'
  const data = {
    utf8: '✓',
    contact_name: contactName,
    contact_id: contactId,
    'crm_activity[subject]': title,
    'crm_activity[all_day]': 0,
    'crm_activity[start_date]': sd,
    'crm_activity[start_time]': st,
    'crm_activity[end_date]': ed,
    'crm_activity[end_time]': et,
    'crm_activity[description]': formData.description + ', ' + details + ', ' + recording,
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

  const url = `${host}/activities`
  const res = await fetch.post(url, {}, {
    headers: {
      Accept: '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-Token': getCSRF(),
      'X-NewRelic-ID': getXid(),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: buildFormData(data)
  })
  return res
}
