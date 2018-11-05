/**
 * third party api
 * you can do things like:
 * 1. sync thirdparty contacts to ringcentral contact list
 * 2. when calling or call inbound, show caller/callee info panel
 * 3. sync call log to third party system
 *
 * example script: https://github.com/zxdong262/hubspot-embeddable-ringcentral-phone/blob/master/src/chrome-extension/third-party-api.js
 */

import moment from 'moment'
import {formatNumber} from 'libphonenumber-js'
import {thirdPartyConfigs} from './app-config'
import {createForm} from './call-log-sync-form'
import * as ls from './ls'
import $ from 'jquery'
import {
  createElementFromHTML,
  findParentBySel,
  popup,
  APIKEYLS,
  checkPhoneNumber,
  callWithRingCentral,
  notify,
  host,
  getIdfromHref,
  sendMsgToBackground,
  getContactInfo
} from './helpers'
import {
  getUserId
} from './content-insert-config'
import fetch, {jsonHeader} from '../common/fetch'
import _ from 'lodash'
import {setCache, getCache} from './cache'
import logo from './rc-logo'
import extLinkSvg from './link-external.svg'
import {findMatchContacts, searchContacts} from './contacts'
import {showActivityDetail, getActivities} from './activities'

let formatDate = 'DD-MMM-YYYY hh:mm A'
let {
  showCallLogSyncForm,
  serviceName
} = thirdPartyConfigs

let lsKeys = {
  apiKeyLSKey: APIKEYLS
}
let local = {
  apiKey: null
}
let rc = {
  postMessage: data => {
    sendMsgToBackground({
      to: 'standalone',
      data
    })
  }
}
let authEventInited = false
let cacheKey = 'contacts'
let isFetchingContacts = false
const phoneFormat = 'National'

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

async function getContactId(body) {
  if (body.call) {
    let obj = _.find(
      [
        ...body.call.toMatches,
        ...body.call.fromMatches
      ],
      m => m.type === serviceName
    )
    return obj ? obj.id : null
  }
}


function notifySyncSuccess({
  id
}) {
  let type = 'success'
  let url = `${host}/details/Event/${id}`
  let msg = `
    <div>
      <div class="rc-pd1b">
        Call log synced to insightly!
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

async function syncCallLogToRedtail(body) {
  let isManuallySync = !body.triggerType
  let isAutoSync = body.triggerType === 'callLogSync'
  if (!isAutoSync && !isManuallySync) {
    return
  }
  if (!local.apiKey) {
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
  let contactId = await getContactId(body)
  if (!contactId) {
    return notify('no related contact', 'warn')
  }
  let toNumber = _.get(body, 'call.to.phoneNumber')
  let fromNumber = _.get(body, 'call.from.phoneNumber')
  let {duration} = body.call
  let details = `
    Call from ${fromNumber} to ${toNumber}, duration: ${duration} seconds.
    ${formData.description || ''}
  `
  let start = moment(body.call.startTime).format(formatDate)
  let end = moment(body.call.startTime + duration * 1000).format(formatDate)
  let token = await getVerifyToken(contactId)
  let data = {
    EntityType: 'Event',
    'Fields[LookupField_10393]': formData.title || 'Call Log',
    'Fields[LookupField_10394]': '',
    'Fields[LookupField_10395]': start,
    'Fields[LookupField_10396]': end,
    'Fields[LookupField_10439]': false,
    'Fields[LookupField_10440]': details,
    'Fields[LookupField_10446]': true,
    EntityId: '',
    RelatedEntityType: 'Contact',
    RelatedEntityId: contactId,
    InModal: true,
    bulkCommand: '',
    isBulkCommand: false,
    __RequestVerificationToken: token
  }
  /*
EntityType: Event
Fields[LookupField_10393]: TA
Fields[LookupField_10394]:
Fields[LookupField_10395]: 14-Oct-2018 08:00 PM
Fields[LookupField_10396]: 14-Oct-2018 09:00 PM
Fields[LookupField_10439]: false
Fields[LookupField_10440]: WHAT
Fields[LookupField_10446]: true
EntityId:
RelatedEntityType: Contact
RelatedEntityId: 273196913
InModal: true
bulkCommand:
isBulkCommand: false
__RequestVerificationToken: h480cvYO_JTDnFF4KR2fczcDH1x2QdqhpjFRXOs12Abv265WhHNhT7Whamn4zNYSUmbJh-133di9qqBHgPy1aTP93n2KXCf6WhaGscBY84D9RbFlG298UtHSaZNEDHU6lG2dpQ2
RedirectType: ActivityReload
  */
  //https://crm.na1.insightly.com/Metadata/Create
  let url = `${host}/Metadata/Create`
  let res = await fetch.post(url, {}, {
    headers: {
      ...jsonHeader,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: buildFormData(data)
  })
  if (res && res.id) {
    notifySyncSuccess({id: res.id})
  } else {
    notify('call log sync to insightly failed', 'warn')
    console.log('post /Metadata/Create error')
    console.log(res)
  }
}

async function updateToken(newToken, type = 'apiKey') {
  if (!newToken){
    await ls.clear()
    local = {
      refreshToken: null,
      accessToken: null,
      expireTime: null
    }
  } else if (_.isString(newToken)) {
    local[type] = newToken
    let key = lsKeys[`${type}LSKey`]
    await ls.set(key, newToken)
  } else {
    Object.assign(local, newToken)
    let ext = Object.keys(newToken)
      .reduce((prev, key) => {
        prev[lsKeys[`${key}LSKey`]] = newToken[key]
        return prev
      }, {})
    await ls.set(ext)
  }
}

function formatPhone(phone) {
  return formatNumber(phone, phoneFormat)
}

/**
 * click contact info panel event handler
 * @param {Event} e
 */
function onClickContactPanel (e) {
  let {target} = e
  let {classList} = target
  if (classList.contains('rc-close-contact')) {
    document
      .querySelector('.rc-contact-panel')
      .classList.add('rc-hide-to-side')
  } else if (
    classList.contains('rc-phone-span')
  ) {
    callWithRingCentral(
      (target.textContent || '').trim()
    )
  }
}

function hideContactInfoPanel() {
  let dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-hide-to-side')
}

function onloadIframe () {
  let dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-contact-panel-loaded')
}

/**
 * show caller/callee info
 * @param {Object} call
 */
async function showContactInfoPanel(call) {
  if (
    !call.telephonyStatus ||
    call.telephonyStatus === 'CallConnected'
  ) {
    return
  }
  if (call.telephonyStatus === 'NoCall') {
    return hideContactInfoPanel()
  }
  let isInbound = call.direction === 'Inbound'
  let phone = isInbound
    ? _.get(
      call,
      'from.phoneNumber'
    )
    : _.get(call, 'to.phoneNumber')
  if (!phone) {
    return
  }
  phone = formatPhone(phone)
  let contacts = await getContacts()
  let contact = _.find(contacts, c => {
    return _.find(c.phoneNumbers, p => {
      return formatPhone(p.phoneNumber) === phone
    })
  })
  if (!contact) {
    return
  }
  // let contactTrLinkElem = canShowNativeContact(contact)
  // if (contactTrLinkElem) {
  //   return showNativeContact(contact, contactTrLinkElem)
  // }
  let {host, protocol} = location
  let url = `${protocol}//${host}/details/contact/${contact.id}`
  let elem = createElementFromHTML(
    `
    <div class="animate rc-contact-panel" draggable="false">
      <div class="rc-close-box">
        <div class="rc-fix rc-pd2x">
          <span class="rc-fleft">Contact</span>
          <span class="rc-fright">
            <span class="rc-close-contact">&times;</span>
          </span>
        </div>
      </div>
      <div class="rc-insightly-contact-frame-box">
        <iframe class="rc-insightly-contact-frame" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" allow="microphone" src="${url}" id="rc-insightly-contact-frame">
        </iframe>
      </div>
      <div class="rc-loading">loading...</div>
    </div>
    `
  )
  elem.onclick = onClickContactPanel
  elem.querySelector('iframe').onload = onloadIframe
  let old = document
    .querySelector('.rc-contact-panel')
  old && old.remove()

  document.body.appendChild(elem)
  popup()
}

async function getContactDetail(id) {
  let html = await getContactInfo({
    vid: id
  })
  let re = $(html)
  let trs = re.find('.contact-phones tr, .contact-emails tr')
  let res = {
    type: serviceName,
    phoneNumbers: [],
    emails: []
  }
  trs.each(function() {
    let t = $(this)
    let id = t.prop('id')
    let isPhone = id.includes('phone')
    let isEmail = id.includes('email')
    if (isPhone) {
      let n = t.find('.number')
      let txt = n.text().trim()
      if (checkPhoneNumber(txt)) {
        res.phoneNumbers.push({
          phoneNumber: txt,
          phoneType: 'directPhone'
        })
      }
    } else if (isEmail) {
      let n = t.find('.email-address')
      let txt = n.text().trim()
      if (txt) {
        res.emails.push(txt)
      }
    }
  })
  return res
}

/**
 * getContactsDetails
 */
async function getContactsDetails(html) {
  let re = $(html)
  let list = []
  re.find('#contact-list tr').each(function() {
    let t = $(this)
    let nameWrap = t.find('.Name a')
    let name = nameWrap.text().trim()
    let href = nameWrap.prop('href')
    let id = getIdfromHref(href)
    list.push({
      name,
      id
    })
  })
  let final = []
  for (let item of list) {
    let {id} = item
    let info = await getContactDetail(id)
    final.push({
      ...item,
      ...info
    })
  }
  return final
}

function showSyncTip() {
  document
    .querySelector('.rc-sync-contact-button-wrap')
    .classList.remove('rc-hide-to-side')
}

function hideSyncTip() {
  document
    .querySelector('.rc-sync-contact-button-wrap')
    .classList.add('rc-hide-to-side')
}

/**
 * get contact lists
 */
const getContacts = _.debounce(async function (forceUpdate) {
  if (isFetchingContacts) {
    return []
  }
  if (!local.apiKey) {
    showAuthBtn()
    return []
  }
  let cached = forceUpdate
    ? false
    : getCache(cacheKey)
  if (cached) {
    console.log('use cache')
    showSyncTip()
    return cached
  }
  //https://api.insightly.com/v3.0/Help#!/Contacts/GetEntities
  let url =`${host}/contacts`
  notify(
    'Fetching contacts list, may take a while',
    'info',
    1000 * 60 * 60
  )
  isFetchingContacts = true
  let res = await fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
  if (!res) {
    isFetchingContacts = false
    console.log('fetch contacts error')
    notify(
      'Fetching contacts list error',
      'warn'
    )
    return []
  }
  let final = await getContactsDetails(res)
  isFetchingContacts = false
  setCache(cacheKey, final, 'never')
  notify(
    'Fetching contacts list done',
    'success'
  )
  popup()
  return final
}, 500)

function notifyRCAuthed(authorized = true) {
  rc.postMessage({
    type: 'rc-adapter-update-authorization-status',
    authorized
  }, '*')
}

async function unAuth() {
  await updateToken(null)
  notifyRCAuthed(false)
}

function hideAuthBtn() {
  let dom = document.querySelector('.rc-auth-button-wrap')
  dom && dom.classList.add('rc-hide-to-side')
}

function showAuthBtn() {
  let dom = document.querySelector('.rc-auth-button-wrap')
  dom && dom.classList.remove('rc-hide-to-side')
}

function doAuth() {
  if (local.apiKey) {
    return
  }
  updateToken('true')
  notifyRCAuthed()
  hideAuthBtn()
}

function handleAuthClick(e) {
  let {target} = e
  let {classList}= target
  if (findParentBySel(target, '.rc-auth-btn')) {
    doAuth()
  } else if (classList.contains('rc-dismiss-auth')) {
    hideAuthBtn()
  }
}

function onClickSyncPanel(e) {
  let {target} = e
  let {classList}= target
  if (target.classList.contains('rc-do-sync-contact')) {
    getContacts(true)
  } else if (classList.contains('rc-no-sync-contact')) {
    hideSyncTip()
  }
}

function renderAuthButton() {
  let btn = createElementFromHTML(
    `
      <div class="rc-auth-button-wrap animate rc-hide-to-side">
        <span class="rc-auth-btn">
          <span class="rc-iblock">Auth</span>
          <img class="rc-iblock" src="${logo}" />
          <span class="rc-iblock">access ${serviceName} data</span>
        </span>
        <div class="rc-auth-desc rc-pd1t">
          After auth, you can access ${serviceName} contacts from RingCentral phone's contacts list. You can revoke access from RingCentral phone's setting.
        </div>
        <div class="rc-pd1t">
          <span class="rc-dismiss-auth" title="dismiss">&times;</span>
        </div>
      </div>
    `
  )
  btn.onclick = handleAuthClick
  if (
    !document.querySelector('.rc-auth-button-wrap')
  ) {
    document.body.appendChild(btn)
  }
}

/**
 * get contacts may take a while,
 * user can decide sync or not
 */
function renderConfirmGetContactsButton() {
  let btn = createElementFromHTML(
    `
      <div
        class="rc-sync-contact-button-wrap animate rc-hide-to-side"
        title="After sync, you can access lastest ${serviceName} contacts from RingCentral phone's contacts list. But if you do not want to update ${serviceName} contact list in RingCentral phone, you can skip this by click close button"
      >
        <span class="rc-iblock">Sync contacts?</span>
        </span>
        <span class="rc-do-sync-contact rc-iblock pointer">Yes</span>
        <span class="rc-no-sync-contact rc-iblock pointer">No</span>
      </div>
    `
  )
  btn.onclick = onClickSyncPanel
  if (
    !document.querySelector('.rc-sync-contact-button-wrap')
  ) {
    document.body.appendChild(btn)
  }
}

/**
 * handle ringcentral widgets contacts list events
 * @param {Event} e
 */
async function handleRCEvents(e) {
  let {data} = e
  console.log('======data======')
  console.log(data, data.type, data.path)
  console.log('======data======')
  if (!data) {
    return
  }
  let {type, loggedIn, path, call} = data
  if (type === 'rc-adapter-pushAdapterState') {
    return initRCEvent()
  }
  if (type ===  'rc-login-status-notify') {
    console.log('rc logined', loggedIn)
  }
  if (
    type === 'rc-route-changed-notify' &&
    path === '/contacts' &&
    !local.apiKey
  ) {
    showAuthBtn()
  } else if (
    type === 'rc-active-call-notify' ||
    type === 'rc-call-start-notify'
  ) {
    showContactInfoPanel(call)
  } else if ('rc-call-end-notify' === type) {
    hideContactInfoPanel()
  }
  if (type !== 'rc-post-message-request') {
    return
  }

  if (data.path === '/authorize') {
    if (local.apiKey) {
      unAuth()
    } else {
      doAuth()
    }
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: 'ok' }
    }, '*')
  }
  else if (path === '/contacts') {
    let contacts = await getContacts()
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: {
        data: contacts,
        nextPage: null
      }
    }, '*')
  }
  else if (path === '/contacts/search') {
    let contacts = await getContacts()
    let keyword = _.get(data, 'body.searchString')
    if (keyword) {
      contacts = searchContacts(contacts, keyword)
    }
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: {
        data: contacts
      }
    }, '*')
  }
  else if (path === '/contacts/match') {
    let contacts = await getContacts()
    let phoneNumbers = _.get(data, 'body.phoneNumbers') || []
    let res = findMatchContacts(contacts, phoneNumbers)
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: {
        data: res
      }
    }, '*')
  }
  else if (path === '/callLogger') {
    // add your codes here to log call to your service
    syncCallLogToRedtail(data.body)
    // response to widget
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: 'ok' }
    }, '*')
  }
  else if (path === '/activities') {
    const activities = await getActivities(data.body)
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: activities }
    }, '*')
  }
  else if (path === '/activity') {
    // response to widget
    showActivityDetail(data.body)
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: 'ok' }
    }, '*')
  }
}

function initRCEvent() {
  //register service to rc-widgets
  let data = {
    type: 'rc-adapter-register-third-party-service',
    service: {
      name: serviceName,
      contactsPath: '/contacts',
      contactSearchPath: '/contacts/search',
      contactMatchPath: '/contacts/match',
      authorizationPath: '/authorize',
      authorizedTitle: 'Unauthorize',
      unauthorizedTitle: 'Authorize',
      callLoggerPath: '/callLogger',
      callLoggerTitle: `Log to ${serviceName}`,
      activitiesPath: '/activities',
      activityPath: '/activity',
      authorized: false
    }
  }
  rc.postMessage(data)
  if (local.apiKey) {
    notifyRCAuthed()
  }
}

export default async function initThirdPartyApi () {
  if (authEventInited) {
    return
  }
  authEventInited = true
  cacheKey = cacheKey + getUserId()
  console.log(cacheKey, 'cacheKey')
  window.addEventListener('message', handleRCEvents)

  //hanlde contacts events
  let apiKey = await ls.get(lsKeys.apiKeyLSKey) || null
  local = {
    apiKey
  }

  //get the html ready
  renderAuthButton()
  renderConfirmGetContactsButton()

}
