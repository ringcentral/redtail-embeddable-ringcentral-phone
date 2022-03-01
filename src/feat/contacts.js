/**
 * third party contacts related feature
 */

import _ from 'lodash'
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import { setCache, getCache } from 'ringcentral-embeddable-extension-common/src/common/cache'
import {
  showAuthBtn
} from './auth'
import {
  popup,
  createElementFromHTML,
  checkPhoneNumber,
  notify,
  host,
  formatPhone
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import {
  getIdfromHref,
  getContactInfo
} from './common'
import $ from 'jquery'
import {
  insert,
  getByPage,
  match
} from 'ringcentral-embeddable-extension-common/src/common/db'
import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
import { notification, Modal } from 'antd'
// import { createAll } from './add-contacts'
// createAll()

const {
  serviceName
} = thirdPartyConfigs
let isFetchingAllContacts = false
// let syncHanlder = null
const lastSyncPage = 'last-sync-page'
const upsert = true
const final = {
  result: [],
  hasMore: false
}

function notifyReSyncContacts () {
  window.rc.postMessage({
    type: 'rc-adapter-sync-third-party-contacts'
  })
}

// const showSyncTip = _.debounce(function () {
//   document
//     .querySelector('.rc-sync-contact-button-wrap')
//     .classList.remove('rc-hide-to-side')
//   clearTimeout(syncHanlder)
//   syncHanlder = setTimeout(hideSyncTip, 15000)
// }, 10000, {
//   leading: true
// })

/**
 * click contact info panel event handler
 * @param {Event} e
 */
function onClickContactPanel (e) {
  const { target } = e
  const { classList } = target
  if (classList.contains('rc-close-contact')) {
    document
      .querySelector('.rc-contact-panel')
      .classList.add('rc-hide-to-side')
  }
}

function onloadIframe () {
  const dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-contact-panel-loaded')
}

async function getContactDetail (id, name, page) {
  let html = await getContactInfo({
    vid: id
  })
  let count = 0
  while (!html && count < 10) {
    count++
    html = await getContactInfo({
      vid: id
    })
  }
  const re = $(html)
  const trs = re.find('.contact-phones tr, .contact-emails tr')
  const res = {
    id,
    name,
    type: serviceName,
    phoneNumbers: [],
    emails: []
  }
  trs.each(function () {
    const t = $(this)
    const id = t.prop('id')
    const isPhone = id.includes('phone')
    const isEmail = id.includes('email')
    if (isPhone) {
      const n = t.find('.number')
      const txt = n.text().trim()
      if (checkPhoneNumber(txt)) {
        res.phoneNumbers.push({
          phoneNumber: txt,
          phoneType: 'directPhone'
        })
      }
    } else if (isEmail) {
      const n = t.find('.email-address')
      const txt = n.text().trim()
      if (txt) {
        res.emails.push(txt)
      }
    }
  })
  res.phoneNumbersForSearch = res.phoneNumbers.map(
    d => formatPhone(d.phoneNumber)
  ).join(',')
  if (res.phoneNumbers.length) {
    await insert(res, upsert)
    await updateTimeStamp()
    notifyReSyncContacts()
  }
}

/**
 * getContactsDetails
 */
async function getContactsDetails (html, page) {
  const re = $(html)
  const list = []
  re.find('#contact-list tr').each(function () {
    const t = $(this)
    const nameWrap = t.find('.Name a')
    const name = nameWrap.text().trim()
    const href = nameWrap.prop('href')
    const id = getIdfromHref(href)
    list.push({
      name,
      id
    })
  })
  console.log('contact page list for page', page, list)
  for (const item of list) {
    const { id } = item
    await getContactDetail(id, item.name, page).catch(console.log)
  }
}

/**
 * get contact lists pager
 */
async function getContact (page = 1, getRecent) {
  if (!getRecent) {
    await setCache(lastSyncPage, page, 'never')
  }
  let url = `${host}/contacts` +
  (getRecent ? '/recently_added' : '')
  if (page) {
    url = `${url}?page=${page}`
  }
  const res = await fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
  if (!res) {
    console.log('fetch contacts error')
    notify(
      'Fetching contacts list error',
      'warn'
    )
    return []
  }
  await getContactsDetails(res, page)
}

async function getPages (getRecent) {
  const url = `${host}/contacts` +
    (getRecent ? '/recently_added' : '')
  const res = await fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
  if (!res) {
    return [1]
  }
  const reg = /page=(\d+)/
  let pages = Array.from($(res).find('ul.pagination li a[href]'))
    .map(d => d.getAttribute('href'))
    .filter(d => d.includes('page='))
    .map(d => {
      const arr = d.match(reg)
      return arr ? parseInt(arr[1], 10) : 0
    })
    .sort((a, b) => a - b)
  if (!pages.length) {
    pages = [1]
  }
  const max = _.last(pages)
  return new Array(max).fill(0).map((n, i) => i + 1)
}

function loadingContacts () {
  notification.info({
    message: 'Fetching contacts list...',
    duration: 10,
    description: (
      <div>
        <p>
          This may take minutes, please keep this page open, until it is done, you open another browser tab to continue your work.
        </p>
        <p>
          * If not finished, it will start sync from last break point after reload.
        </p>
        <p>
          * The contacts data will only be stored in your current browser, and be used to matching phone number and contact so the Chrome extension could log calls to right contact.
        </p>
      </div>
    )
  })
}

function notifyFinished () {
  notification.success({
    message: 'Contacts data synced, Now call log could be logged to right contact.'
  })
}

/**
 * get contact lists
 */
export const getContacts = async function (
  page = 1
) {
  console.log('getContacts')
  if (!window.rc.local.apiKey) {
    showAuthBtn()
    return final
  }
  if (!window.rc.rcLogined) {
    return final
  }
  const cached = await getByPage(page).catch(e => console.log(e.stack))
  if (cached && cached.result && cached.result.length) {
    console.debug('use cache')
    return cached
  }
  if (!window.rc.syncTimeStamp) {
    fetchAllContacts()
  }
  return final
}

export async function fetchAllContacts (_getRecent) {
  console.log('fetchAllContacts')
  if (!window.rc.local.apiKey) {
    showAuthBtn()
    return final
  }
  if (isFetchingAllContacts) {
    return
  }
  isFetchingAllContacts = true
  loadingContacts()
  const lastSync = lastSyncPage
  let getRecent = !!_getRecent
  const page = await getCache(lastSync) || 1
  if (page > 1) {
    getRecent = false
  }
  const pages = await getPages(getRecent)
  console.log('last fetching page:', page)
  console.log('pages:', pages)
  const len = pages.length
  const lastPage = pages[len - 1]
  let start = 1
  if ((page > 1 && page <= lastPage) || getRecent) {
    start = page
  }
  for (;start <= lastPage; start++) {
    console.log('fetching page:', start)
    await getContact(start, getRecent)
  }
  isFetchingAllContacts = false
  if (!getRecent) {
    await setCache(lastSync, 0, 'never')
  }
  notifyReSyncContacts()
  notifyFinished()
}

async function updateTimeStamp () {
  const now = Date.now()
  window.rc.syncTimeStamp = now
  return ls.set('rc-sync-timestamp', now)
}
export function hideContactInfoPanel () {
  const dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-hide-to-side')
}

/**
 * show caller/callee info
 * @param {Object} call
 */
export async function showContactInfoPanel (call) {
  if (
    !call ||
    call.telephonyStatus !== 'Ringing' ||
    call.direction === 'Outbound'
  ) {
    return
  }
  popup()
  let phone = _.get(call, 'from.phoneNumber') || _.get(call, 'from')
  if (!phone) {
    return
  }
  phone = formatPhone(phone)
  const contacts = await match([phone])
  const contact = _.get(contacts, `${phone}[0]`)
  if (!contact) {
    return
  }
  // let contactTrLinkElem = canShowNativeContact(contact)
  // if (contactTrLinkElem) {
  //   return showNativeContact(contact, contactTrLinkElem)
  // }
  const { host, protocol } = window.location
  const url = `${protocol}//${host}/contacts/${contact.id}`
  const elem = createElementFromHTML(
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
      <div class="rc-third-party-contact-frame-box">
        <iframe class="rc-third-party-contact-frame" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" allow="microphone" src="${url}" id="rc-third-party-contact-frame">
        </iframe>
      </div>
      <div class="rc-loading">loading...</div>
    </div>
    `
  )
  elem.onclick = onClickContactPanel
  elem.querySelector('iframe').onload = onloadIframe
  const old = document
    .querySelector('.rc-contact-panel')
  old && old.remove()

  document.body.appendChild(elem)
  popup()
}

export async function showSyncCount () {
  const { count } = await getByPage(1, 1)
  notification.info({
    message: `${count} contacts synced`,
    placement: 'bottomLeft'
  })
}
