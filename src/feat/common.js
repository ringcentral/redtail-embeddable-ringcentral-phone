import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import $ from 'jquery'
import _ from 'lodash'
import {
  host,
  checkPhoneNumber,
  formatPhone
} from 'ringcentral-embeddable-extension-common/src/common/helpers'

export const APIKEYLS = 'rcapikey'

export async function getContactInfo (ids) {
  if (!ids) {
    return []
  }
  const {
    vid
  } = ids
  // https://smf.crm3.redtailtechnology.com/contacts/10
  const url = `${host}/contacts/${vid}`
  return fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
}

export function getIdfromHref (href) {
  return _.get(
    href.match(/\/contacts\/(\d+)/),
    [1]
  )
}

export function getXid () {
  return _.get(
    document.head.textContent.match(/xpid:"([^"]+)"/),
    '[1]'
  )
}

export function getCSRF () {
  const dom = document.querySelector('meta[name="csrf-token"]')
  return dom
    ? dom.getAttribute('content')
    : ''
}

/**
 * wait ms
 * @param {number} ms
 */
export function wait (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function formatNumbers (res) {
  const re = $(res)
  const final = []
  re.find('.contact-phones .number').each(function (i) {
    const t = $(this)
    const number = t.text().trim()
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

export async function getNumbers (ids) {
  const res = await getContactInfo(ids)
  return res ? formatNumbers(res) : []
}

export function getUserId () {
  const reg = /currentUserId: (\d+),/
  const arr = document.documentElement.outerHTML.match(reg) || []
  const id = arr[1]
  return id || ''
}

export function formatPhoneLocal (number) {
  return formatPhone(number, undefined, 'formatNational')
}

export const autoLogPrefix = 'rc-auto-log-id:'

export function buildFormData (data) {
  return Object.keys(data)
    .reduce((prev, k, i) => {
      const v = data[k]
      return prev +
        (i ? '&' : '') +
        encodeURIComponent(k) +
        '=' +
        encodeURIComponent(v)
    }, '')
}

export function getFullNumber (numberObj) {
  if (!numberObj) {
    return ''
  } else if (_.isString(numberObj)) {
    return numberObj
  }
  const {
    extensionNumber,
    phoneNumber = ''
  } = numberObj
  return phoneNumber +
    (extensionNumber ? '#' + extensionNumber : '')
}
