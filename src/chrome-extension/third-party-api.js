/**
 * third party api
 * you can do things like:
 * 1. sync thirdparty contacts to ringcentral contact list
 * 2. when calling or call inbound, show caller/callee info panel
 * 3. sync call log to third party system
 *
 * example script: https://github.com/zxdong262/hubspot-embeddable-ringcentral-phone/blob/master/src/chrome-extension/third-party-api.js
 */

import {formatNumber} from 'libphonenumber-js'
import {thirdPartyConfigs} from './app-config'
import * as ls from './ls'
import {
  createElementFromHTML,
  findParentBySel,
  callWithRingCentral
} from './helpers'
import fetch, {jsonHeader, handleErr} from '../common/fetch'
import _ from 'lodash'

let serviceName = 'redtail embeddable ringcentral phone'
let inited = false
let rcLogined = false

/**
 * Notify ringcentral widgets auth state
 * @param {Bool} authorized
 */
function notifyRCAuthed(authorized = true) {
  document
    .querySelector('#rc-widget-adapter-frame')
    .contentWindow
    .postMessage({
      type: 'rc-adapter-update-authorization-status',
      authorized
    }, '*')
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

  // hanlde ringcentral widgets logined event
  if (type ===  'rc-login-status-notify') {
    console.log('rc logined', loggedIn)
    rcLogined = loggedIn
  }

  //handle route change event
  if (
    type === 'rc-route-changed-notify'
  ) {
    console.log('rc route changed')
  } else if (
    type === 'rc-active-call-notify' ||
    type === 'rc-call-start-notify'
  ) {
    console.log('rc-active-call-notify, rc-call-start-notify')
  } else if ('rc-call-end-notify' === type) {
    console.log('rc-call-end-notify')
  }
  if (type !== 'rc-post-message-request') {
    return
  }
  let rc = document.querySelector('#rc-widget-adapter-frame').contentWindow

  // user click auth button in ringcentral widgets setting page
  if (data.path === '/authorize') {
    //do some auth process
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: 'ok' }
    }, '*')
  }

  // rc widgets request contacts
  else if (path === '/contacts') {
    let contacts = []
    // todo get contacts list
    // read more about it: https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/third-party-service-in-widget.md
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: {
        data: contacts,
        nextPage: null
      }
    }, '*')
  }

  //
  else if (path === '/contacts/search') {
    let contacts = []
    //todo
    rc.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: {
        data: contacts
      }
    }, '*')
  }
  else if (path === '/contacts/match') {

    const matchedContacts = {
      '+12165325078': [
        /*
        {
          entityType: 'TestService',
          name: 'TestService 1',
          phoneNumbers: [{
            phoneNumber: '+12165325078',
            phoneType: 'directPhone',
          }]
        }
        */
      ]
    }
    document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: {
        data: matchedContacts
      },
    }, '*')
  } else if (data.path === '/callLogger') {
    // add your codes here to log call to your service
    // response to widget
    document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: 'ok' },
    }, '*');
  }
  else if (data.path === '/activities') {
    const contact = data
    console.log(contact)
    const activities = [
      /*
      {
        id: '123',
        subject: 'Title',
        time: 1528854702472
      }
      */
    ]
    // response to widget
    document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: activities },
    }, '*')
  }
  else if (data.path === '/activity') {
    const activity = data
    // handle activity here
    console.log(activity)
    // response to widget
    document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
      type: 'rc-post-message-response',
      responseId: data.requestId,
      response: { data: 'ok' },
    }, '*')
  }
}

export default async function initThirdPartyApi () {
  if (inited) {
    return
  }
  inited = true

  //hanlde contacts events
  window.addEventListener('message', handleRCEvents)

  let rcFrame = document.querySelector('#rc-widget-adapter-frame')
  if (!rcFrame || !rcFrame.contentWindow) {
    return
  }

  //wait for auth 2.0 token example
  /*
  window.addEventListener('message', function (e) {
    const data = e.data
    if (data && data.hsAuthCode) {
      getAuthToken({
        code: data.hsAuthCode
      })
      hideAuthPanel()
      hideAuthBtn()
    }
  })
  */

  //register service to rc-widgets example
  rcFrame
    .contentWindow.postMessage({
      type: 'rc-adapter-register-third-party-service',
      service: {
        name: serviceName,
        contactsPath: '/contacts',
        contactSearchPath: '/contacts/search',
        contactMatchPath: '/contacts/match',
        authorizationPath: '/authorize',
        authorizedTitle: 'Unauthorize',
        unauthorizedTitle: 'Authorize',
        activitiesPath: '/activities',
        activityPath: '/activity',
        callLoggerPath: '/callLogger',
        callLoggerTitle: 'Log to TestService',
        authorized: false
      }
    }, '*')

}
