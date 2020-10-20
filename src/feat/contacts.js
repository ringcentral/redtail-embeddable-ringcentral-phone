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
// import { createAll } from './add-contacts'
// createAll()

let {
  serviceName
} = thirdPartyConfigs
let isFetchingAllContacts = false
// let syncHanlder = null
const lastSyncPage = 'last-sync-page'
let upsert = true
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
  let { target } = e
  let { classList } = target
  if (classList.contains('rc-close-contact')) {
    document
      .querySelector('.rc-contact-panel')
      .classList.add('rc-hide-to-side')
  }
}

function onloadIframe () {
  let dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-contact-panel-loaded')
}

async function getContactDetail (id, name, page) {
  let html = await getContactInfo({
    vid: id
  })
  let count = 0
  while (!html && count < 5) {
    count++
    html = await getContactInfo({
      vid: id
    })
  }
  let re = $(html)
  let trs = re.find('.contact-phones tr, .contact-emails tr')
  let res = {
    id,
    name,
    type: serviceName,
    phoneNumbers: [],
    emails: []
  }
  trs.each(function () {
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
  res.phoneNumbersForSearch = res.phoneNumbers.map(
    d => formatPhone(d.phoneNumber)
  ).join(',')
  await insert(res, upsert)
}

/**
 * getContactsDetails
 */
async function getContactsDetails (html, page) {
  let re = $(html)
  let list = []
  re.find('#contact-list tr').each(function () {
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
  console.log('contact page list for page', page, list)
  for (let item of list) {
    let { id } = item
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
  let res = await fetch.get(url, {
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
  let url = `${host}/contacts` +
    (getRecent ? '/recently_added' : '')
  let res = await fetch.get(url, {
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
  notify(
    'Fetching contacts list, may take minutes, please stay in this page until it is done.',
    'info',
    1000 * 60 * 60
  )
}

function stopLoadingContacts () {
  notify('Contacts data synced', 2000)
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
  let cached = await getByPage(page).catch(e => console.log(e.stack))
  if (cached && cached.result && cached.result.length) {
    console.debug('use cache')
    return cached
  }
  fetchAllContacts()
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
  let pages = await getPages(getRecent)
  console.log('last fetching page:', page)
  console.log('pages:', pages)
  const len = pages.length
  const lastPage = pages[len - 1]
  let start = 1
  console.log('up1', typeof page)
  if ((page > 1 && page <= lastPage) || getRecent) {
    start = page
  }
  for (;start <= lastPage; start++) {
    console.log('fetching page:', start)
    await getContact(start, getRecent)
  }
  stopLoadingContacts()
  isFetchingAllContacts = false
  notifyReSyncContacts()
  if (!getRecent) {
    await setCache(lastSync, 0, 'never')
  }
  notify('Syncing contacts done', 'info', 3000)
}

export function hideContactInfoPanel () {
  let dom = document
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
  let contacts = await match([phone])
  let contact = _.get(contacts, `${phone}[0]`)
  if (!contact) {
    return
  }
  // let contactTrLinkElem = canShowNativeContact(contact)
  // if (contactTrLinkElem) {
  //   return showNativeContact(contact, contactTrLinkElem)
  // }
  let { host, protocol } = window.location
  let url = `${protocol}//${host}/contacts/${contact.id}`
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
  let old = document
    .querySelector('.rc-contact-panel')
  old && old.remove()

  document.body.appendChild(elem)
  popup()
}
