/**
 * third party contacts related feature
 */

import _ from 'lodash'
import {setCache, getCache} from 'ringcentral-embeddable-extension-common/src/common/cache'
import {
  showAuthBtn,
  notifyRCAuthed
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
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import {thirdPartyConfigs} from 'ringcentral-embeddable-extension-common/src/common/app-config'

let {
  serviceName
} = thirdPartyConfigs
let isFetchingContacts = false
let syncHanlder = null


function hideSyncTip() {
  document
    .querySelector('.rc-sync-contact-button-wrap')
    .classList.add('rc-hide-to-side')
}

const showSyncTip = _.debounce(function() {
  document
    .querySelector('.rc-sync-contact-button-wrap')
    .classList.remove('rc-hide-to-side')
  clearTimeout(syncHanlder)
  syncHanlder = setTimeout(hideSyncTip, 15000)
}, 10000, {
  leading: true
})

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
  }
}

function onloadIframe () {
  let dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-contact-panel-loaded')
}

/**
 * search contacts by number match
 * @param {array} contacts
 * @param {string} keyword
 */
export function findMatchContacts(contacts = [], numbers) {
  let {formatedNumbers, formatNumbersMap} = numbers.reduce((prev, n) => {
    let nn = formatPhone(n)
    prev.formatedNumbers.push(nn)
    prev.formatNumbersMap[nn] = n
    return prev
  }, {
    formatedNumbers: [],
    formatNumbersMap: {}
  })
  let res = contacts.filter(contact => {
    let {
      phoneNumbers
    } = contact
    return phoneNumbers.filter(n => {
      let f = formatPhone(n.phoneNumber)
      return formatedNumbers
        .includes(
          f
        )
    }).length
  })
  return res.reduce((prev, it) => {
    let phone = _.find(it.phoneNumbers, n => {
      return formatedNumbers.includes(
        formatPhone(n.phoneNumber)
      )
    })
    let num = phone.phoneNumber
    let key = formatNumbersMap[
      formatPhone(num)
    ]
    if (!prev[key]) {
      prev[key] = []
    }
    let res = {
      id: it.id, // id to identify third party contact
      type: serviceName, // need to same as service name
      name: it.name,
      phoneNumbers: it.phoneNumbers
    }
    prev[key].push(res)
    return prev
  }, {})
}


/**
 * search contacts by keyword
 * @param {array} contacts
 * @param {string} keyword
 */
export function searchContacts(contacts = [], keyword) {
  return contacts.filter(contact => {
    let {
      name,
      phoneNumbers
    } = contact
    return name.includes(keyword) ||
      _.find(phoneNumbers, n => {
        return n.phoneNumber.includes(keyword)
      })
  })
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

/**
 * get contact lists
 */
export const getContacts = _.debounce(async function (forceUpdate) {
  if (!window.rc.local.apiKey) {
    showAuthBtn()
    return []
  }
  let cached = forceUpdate
    ? false
    : await getCache(window.rc.cacheKey)
  if (cached) {
    console.log('use cache')
    if (!isFetchingContacts) {
      showSyncTip()
    }
    return cached
  }
  if (isFetchingContacts) {
    return []
  }
  let url =`${host}/contacts`
  notify(
    'Fetching contacts list, may take minutes, please stay in this page until it is done.',
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
  await setCache(window.rc.cacheKey, final, 'never')
  notify(
    'Fetching contacts list done',
    'success'
  )
  popup()
  notifyRCAuthed(false)
  notifyRCAuthed(true)
  return final
}, 100, {
  leading: true
})


export function hideContactInfoPanel() {
  let dom = document
    .querySelector('.rc-contact-panel')
  dom && dom.classList.add('rc-hide-to-side')
}

/**
 * show caller/callee info
 * @param {Object} call
 */
export async function showContactInfoPanel(call) {
  if (
    !call ||
    !call.telephonyStatus ||
    call.direction === 'Outbound' ||
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

function onClickSyncPanel(e) {
  let {target} = e
  let {classList}= target
  if (target.classList.contains('rc-do-sync-contact')) {
    getContacts(true)
    hideSyncTip()
  } else if (classList.contains('rc-no-sync-contact')) {
    hideSyncTip()
  }
}

/**
 * get contacts may take a while,
 * user can decide sync or not
 */
export function renderConfirmGetContactsButton() {
  let btn = createElementFromHTML(
    `
      <div
        class="rc-sync-contact-button-wrap animate rc-hide-to-side"
        title=""
      >
        <div class="rc-sync-tip animate">
        After sync, you can access lastest ${serviceName} contacts from RingCentral phone's contacts list. you can skip this by click close button.
        </div>
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
