import {parseNumber} from 'libphonenumber-js'
import _ from 'lodash'
import RCLOGOSVG from './rc-logo'
import $ from 'jquery'
import fetch from '../common/fetch'
import {formatNumber} from 'libphonenumber-js'

export const RCBTNCLS = 'call-with-ringccentral-btn'
export const RCBTNCLS2 = 'call-with-rc-btn'
export const RCTOOLTIPCLS = 'rc-tooltip'
export const RCLOADINGCLS = 'rc-loading-wrap'
export const serviceName = ''
export const host = getHost()

const phoneFormat = 'National'

function getHost() {
  let {host, protocol} = location
  return `${protocol}//${host}`
}

export function formatPhone(phone) {
  return formatNumber(phone, phoneFormat)
}

function formatNumbers(res) {
  let re = $(res)
  let final = []
  re.find('.contact-phones .number').each(function(i) {
    let t = $(this)
    let number = t.text().trim()
    if (checkPhoneNumber(number)) {
      final.push({
        id: i,
        title: t.prev().text().trim(),
        number: t.text().trim()
      })
    }
  })
  return final
}

export async function getContactInfo(ids) {
  if (!ids) {
    return []
  }
  let {
    vid
  } = ids
  //https://smf.crm3.redtailtechnology.com/contacts/10
  let url = `${host}/contacts/${vid}`
  return fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
}

export async function getNumbers(ids) {
  let res = await getContactInfo(ids)
  return res ? formatNumbers(res) : []
}

let msgHandler1
let msgHandler2
export function notify(msg, type = 'info', timer = 5000) {
  clearTimeout(msgHandler1)
  clearTimeout(msgHandler2)
  let wrap = document.getElementById('rc-msg-wrap')
  if (wrap) {
    wrap.remove()
  }
  wrap = createElementFromHTML(
    `
      <div class="rc-msg-wrap animate rc-msg-type-${type}" id="rc-msg-wrap">
        ${msg}
      </div>
    `
  )
  document.body.appendChild(wrap)
  msgHandler1 = setTimeout(() => {
    wrap.classList.add('rc-msg-enter')
  }, 200)
  msgHandler2 = setTimeout(() => {
    wrap.classList.remove('rc-msg-enter')
  }, timer)
}

export function getIdfromHref(href) {
  return _.get(
    href.match(/\/contacts\/(\d+)/),
    [1]
  )
}

export function getXid() {
  return _.get(
    document.head.textContent.match(/xpid:"([^"]+)"/),
    '[1]'
  )
}

export function getCSRF() {
  let dom = document.querySelector('meta[name="csrf-token"]')
  return dom
    ? dom.getAttribute('content')
    : ''
}

/**
 * wait ms
 * @param {number} ms
 */
export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * register event handler which will auto destroy after fisrt run
 */
export function once(requestId, callback) {
  let func = e => {
    if (
      e.data &&
      e.data.requestId &&
      e.data.requestId === requestId
    ) {
      window.removeEventListener('message', func)
      callback(e.data)
    }
  }
  window.addEventListener('message', func)
}

export function addRuntimeEventListener(cb) {
  chrome.runtime.onMessage.addListener(cb)
}

export async function sendMsgToBackground(msg) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(msg, resolve)
  })
}

export function checkPhoneNumber(phone, country = 'US') {
  return !_.isEqual(
    {},
    parseNumber(phone, country)
  )
}

export function createElementFromHTML(htmlString) {
  var div = document.createElement('div')
  div.innerHTML = htmlString.trim()
  return div.firstChild
}

export function popup() {
  return sendMsgToBackground({
    action: 'popup'
  })
}

export function callWithRingCentral(phoneNumber, callAtOnce = true) {
  popup()
  sendMsgToBackground({
    to: 'standalone',
    data: {
      type: 'rc-adapter-new-call',
      phoneNumber,
      toCall: callAtOnce
    }
  })
}

let events = []
setInterval(() => {
  events.forEach(ev => {
    if (ev.checker(window.location.href)) {
      ev.callback()
    }
  })
}, 1000)

export function dirtyLoop(checker, callback) {
  events.push({
    checker, callback
  })
}

/**
 * find the target parentNode
 * @param {Node} node
 * @param {String} className
 * @return {Boolean}
 */
export function findParentBySel(node, sel) {
  if (!node) {
    return false
  }
  let parent = node
  if (!parent || !parent.matches) {
    return false
  }
  if (parent.matches(sel)) {
    return parent
  }
  let res = false
  while (parent !== document.body) {
    parent = parent.parentNode
    if (!parent || !parent.matches) {
      break
    }
    if (parent.matches(sel)) {
      res = parent
      break
    }
  }
  return res
}

export function createPhoneList(phoneNumbers, cls = 'rc-call-dds') {
  if (!phoneNumbers || phoneNumbers.length < 2) {
    return ''
  }
  let dds = phoneNumbers.reduce((prev, obj) => {
    let {
      number,
      title
    } = obj
    return prev +
    `
    <div class="rc-call-dd">
      <span>${title}:</span>
      <b>${number}</b>
    </div>
    `
  }, '')
  return `
  <div class="${cls}">
    ${dds}
  </div>
  `
}

export const createCallBtnHtml = (cls = '', phoneNumbers) => {
  let cls2 = phoneNumbers && phoneNumbers.length > 1
    ? 'rc-has-dd'
    : ''
  return `
    <span class="${RCBTNCLS} rc-mg1r ${cls} ${cls2}">
      <span class="rc-iblock rc-mg1r">Call with</span>
      <img src="${RCLOGOSVG}" class="rc-iblock" />
      ${createPhoneList(phoneNumbers)}
    </span>
  `
}

export function onClickPhoneNumber(e) {
  let {target} = e
  let p = findParentBySel(target, '.rc-call-dd')
  if (!p) {
    return
  }
  let n = p.querySelector('b').textContent.trim()
  callWithRingCentral(n)
}
