/**
 * auth related feature
 */

import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'
import {
  sendMsgToRCIframe
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
import {
  getUserId,
  APIKEYLS
} from './common'

let currentUserId = getUserId()

export let lsKeys = {
  apiKeyLSKey: APIKEYLS
}
window.rc = {
  local: {
    apiKey: null
  },
  postMessage: sendMsgToRCIframe,
  currentUserId,
  cacheKey: 'contacts' + '_' + currentUserId
}

export async function updateToken (newToken, type = 'apiKey') {
  window.rc.local[type] = newToken
  let key = lsKeys[`${type}LSKey`]
  await ls.set(key, newToken)
}

/**
 * when user click contacts in ringcentral widgets or
 * try to get third party contacts,
 * need show auth button to user
 */
export function showAuthBtn () {
  window.postMessage({
    type: 'rc-show-auth-panel'
  }, '*')
}

export function doAuth () {
  if (window.rc.local.apiKey) {
    return
  }
  updateToken('true')
  notifyRCAuthed()
}

export function notifyRCAuthed (authorized = true) {
  window.rc.postMessage({
    type: 'rc-adapter-update-authorization-status',
    authorized
  })
}

export async function unAuth () {
  await updateToken('')
  notifyRCAuthed(false)
}
