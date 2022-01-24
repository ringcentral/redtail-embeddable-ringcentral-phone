/**
 * content config file
 * with proper config,
 * insert `call with ringcentral` button
 * or hover some elemet show call button tooltip
 * or convert phone number text to click-to-call link
 *
 */

/// *
// import {
//   // RCBTNCLS2,
//   checkPhoneNumber
// } from 'ringcentral-embeddable-extension-common/src/common/helpers'

import { getContactInfo } from '../common/get-contact-info'
import {
  checkPhoneNumber
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import $ from 'jquery'

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

async function getNumbers (ids) {
  const res = await getContactInfo(ids)
  return res ? formatNumbers(res) : []
}

function getIds (href) {
  const reg = /\/contacts\/(\d+)/
  const arr = href.match(reg) || []
  const vid = arr[1]
  if (!vid) {
    return null
  }
  return {
    vid
  }
}

// hover contact node to show click to dial tooltip
export const hoverShowClickToCallButton = [
  {
    // must match url
    shouldAct: href => {
      return /\/contacts(?!\/)/.test(href)
    },

    // elemment selector
    selector: '#contact-list tr',

    getContactPhoneNumbers: async elem => {
      const linkElem = elem.querySelector('td.Name a')
      const href = linkElem
        ? linkElem.getAttribute('href')
        : ''
      const ids = getIds(href)
      return getNumbers(ids)
    }
  }
]
