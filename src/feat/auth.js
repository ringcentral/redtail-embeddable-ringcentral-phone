/**
 * auth related feature
 */

import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'
import logo from 'ringcentral-embeddable-extension-common/src/common/rc-logo'
import {
  createElementFromHTML,
  findParentBySel,
  sendMsgToBackground
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
import {
  getUserId,
  APIKEYLS
} from './common'

let currentUserId = getUserId()
let {
  serviceName
} = thirdPartyConfigs

export let lsKeys = {
  apiKeyLSKey: APIKEYLS
}
window.rc = {
  local: {
    apiKey: null
  },
  postMessage: data => {
    sendMsgToBackground({
      to: 'standalone',
      data
    })
  },
  currentUserId,
  cacheKey: 'contacts' + '_' + currentUserId
}

export async function updateToken (newToken, type = 'apiKey') {
  window.rc.local[type] = newToken
  let key = lsKeys[`${type}LSKey`]
  await ls.set(key, newToken)
}

function hideAuthBtn () {
  let dom = document.querySelector('.rc-auth-button-wrap')
  dom && dom.classList.add('rc-hide-to-side')
}

export function showAuthBtn () {
  let dom = document.querySelector('.rc-auth-button-wrap')
  dom && dom.classList.remove('rc-hide-to-side')
}

function handleAuthClick (e) {
  let { target } = e
  let { classList } = target
  if (findParentBySel(target, '.rc-auth-btn')) {
    doAuth()
  } else if (classList.contains('rc-dismiss-auth')) {
    hideAuthBtn()
  }
}

function doAuth () {
  if (window.rc.local.apiKey) {
    return
  }
  updateToken('true')
  notifyRCAuthed()
  hideAuthBtn()
}

export function notifyRCAuthed (authorized = true) {
  window.rc.postMessage({
    type: 'rc-adapter-update-authorization-status',
    authorized
  }, '*')
}

export async function unAuth () {
  await updateToken('')
  notifyRCAuthed(false)
}

export function renderAuthButton () {
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
