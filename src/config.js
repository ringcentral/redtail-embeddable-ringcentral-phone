/**
 * content config file
 * with proper config,
 * insert `call with ringcentral` button
 * or hover some elemet show call button tooltip
 * or convert phone number text to click-to-call link
 *
 */

import _ from 'lodash'
import {
  showActivityDetail,
  getActivities
} from './feat/activities.js'
import {
  showAuthBtn,
  notifyRCAuthed,
  unAuth,
  renderAuthButton,
  lsKeys
} from './feat/auth.js'
import { upgrade } from 'ringcentral-embeddable-extension-common/src/feat/upgrade-notification'
import {
  syncCallLogToRedtail
} from './feat/call-log-sync'
import {
  getContacts,
  fetchAllContacts,
  hideContactInfoPanel,
  showContactInfoPanel,
  renderConfirmGetContactsButton
} from './feat/contacts.js'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
import {
  getNumbers
} from './feat/common'
import {
  search,
  match
} from 'ringcentral-embeddable-extension-common/src/common/db'
import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'

let {
  pageSize
} = thirdPartyConfigs

// createAll()
setTimeout(upgrade, 999)

function getIds (href) {
  let reg = /\/contacts\/(\d+)/
  let arr = href.match(reg) || []
  let vid = arr[1]
  if (!vid) {
    return null
  }
  return {
    vid
  }
}

export const insertClickToCallButton = [

]

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
      let linkElem = elem.querySelector('td.Name a')
      let href = linkElem
        ? linkElem.getAttribute('href')
        : ''
      let ids = getIds(href)
      return getNumbers(ids)
    }
  }
]

// modify phone number text to click-to-call link
export const phoneNumberSelectors = [
  /// *
  {
    shouldAct: (href) => {
      return /\/contacts\/\d+/.test(href)
    },
    selector: 'tbody.contact-phones .number'
  }
  //* /
]

/**
 * thirdPartyService config
 * @param {*} serviceName
 */
export function thirdPartyServiceConfig (serviceName) {
  console.log(serviceName)

  let services = {
    name: serviceName,
    // show contacts in ringcentral widgets
    contactsPath: '/contacts',
    contactIcon: 'https://github.com/ringcentral/redtail-embeddable-ringcentral-phone/blob/master/src/redtail.png?raw=true',
    contactSearchPath: '/contacts/search',
    contactMatchPath: '/contacts/match',

    // show auth/auauth button in ringcentral widgets
    authorizationPath: '/authorize',
    authorizedTitle: 'Unauthorize',
    unauthorizedTitle: 'Authorize',
    authorized: false,

    // Enable call log sync feature
    callLoggerPath: '/callLogger',
    callLoggerTitle: `Log to ${serviceName}`,

    // show contact activities in ringcentral widgets
    activitiesPath: '/activities',
    activityPath: '/activity'
  }

  // handle ringcentral event
  // check https://github.com/zxdong262/pipedrive-embeddable-ringcentral-phone-nospa/blob/master/src/config.js
  // as example
  // read our document about third party features https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/third-party-service-in-widget.md
  let handleRCEvents = async e => {
    let { data } = e
    console.debug(data)
    if (!data) {
      return
    }
    let { type, loggedIn, path, call } = data
    if (type === 'rc-login-status-notify') {
      console.log(loggedIn, 'loggedIn')
    }
    if (
      type === 'rc-route-changed-notify' &&
      path === '/contacts' &&
      !window.rc.local.apiKey
    ) {
      showAuthBtn()
    } else if (
      type === 'rc-active-call-notify'
    ) {
      showContactInfoPanel(call)
    } else if (type === 'rc-call-end-notify') {
      hideContactInfoPanel()
    } else if (type === 'rc-region-settings-notify') {
      const prevCountryCode = window.rc.countryCode || 'US'
      console.log('prev country code:', prevCountryCode)
      const newCountryCode = data.countryCode
      console.log('new country code:', newCountryCode)
      if (prevCountryCode !== newCountryCode) {
        fetchAllContacts()
      }
      window.rc.countryCode = newCountryCode
      ls.set('rc-country-code', newCountryCode)
    }
    if (type !== 'rc-post-message-request') {
      return
    }

    if (data.path === '/authorize') {
      if (window.rc.local.apiKey) {
        unAuth()
      } else {
        showAuthBtn()
      }
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' }
      }, '*')
    } else if (path === '/contacts') {
      let isMannulSync = _.get(data, 'body.type') === 'manual'
      if (isMannulSync) {
        fetchAllContacts()
        window.rc.postMessage({
          type: 'rc-post-message-response',
          responseId: data.requestId,
          response: {
            data: []
          }
        })
        return
      }
      let page = _.get(data, 'body.page') || 1
      let contacts = await getContacts(page)
      let nextPage = ((contacts.count || 0) - page * pageSize > 0) || contacts.hasMore
        ? page + 1
        : null
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: contacts.result,
          nextPage
        }
      })
    } else if (path === '/contacts/search') {
      if (!window.rc.local.apiKey) {
        return showAuthBtn()
      }
      let contacts = []
      let keyword = _.get(data, 'body.searchString')
      if (keyword) {
        contacts = await search(keyword)
      }
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: contacts
        }
      })
    } else if (path === '/contacts/match') {
      if (!window.rc.local.apiKey) {
        return showAuthBtn()
      }
      let phoneNumbers = _.get(data, 'body.phoneNumbers') || []
      let res = await match(phoneNumbers)
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: res
        }
      })
    } else if (path === '/callLogger') {
      // add your codes here to log call to your service
      syncCallLogToRedtail(data.body)
      // response to widget
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' }
      }, '*')
    } else if (path === '/activities') {
      const activities = await getActivities(data.body)
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: activities }
      }, '*')
    } else if (path === '/activity') {
      // response to widget
      showActivityDetail(data.body)
      window.rc.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' }
      }, '*')
    }
  }
  return {
    services,
    handleRCEvents
  }
}

/**
 * init third party
 * could init dom insert etc here
 */
export async function initThirdParty () {
  window.rc.countryCode = await ls.get('rc-country-code') || undefined
  console.log('rc.countryCode:', window.rc.countryCode)
  let apiKey = await ls.get(lsKeys.apiKeyLSKey) || ''
  window.rc.local = {
    apiKey
  }
  // get the html ready
  renderAuthButton()
  renderConfirmGetContactsButton()
  if (window.rc.local.apiKey) {
    notifyRCAuthed()
  }
}

// init call with ringcenntral button at page bottom
// enbaled by default, change to false to disable it
export const initCallButton = true
