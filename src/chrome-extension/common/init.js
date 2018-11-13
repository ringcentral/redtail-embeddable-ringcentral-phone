

import initThirdPartyApi from '../features/third-party-api'
import insertClickToCall from '../features/insert-click-to-call-button'
import addHoverEvent from '../features/hover-to-show-call-button'
import initStandaloneWidgets from '../features/init-standalone-widgets'
import convertPhoneLink from '../features/make-phone-number-clickable'
import {
  addRuntimeEventListener,
  once
} from './helpers'
import './style.styl'
import './custom.styl'

function registerService() {

  // handle contacts sync feature
  initThirdPartyApi()

  // insert click-to-call button
  insertClickToCall()

  // add event handler to developer configed element, show click-to-dial tooltip to the elements
  addHoverEvent()

  // convert phonenumber text to click-to-dial link
  convertPhoneLink()

  // initStandaloneWidgets button
  initStandaloneWidgets()
}

export default () => {
  addRuntimeEventListener(
    function(request, sender, sendResponse) {
      if (request.to === 'content') {
        window.postMessage(request.data, '*')
        let {requestId} = request.data
        if (requestId) {
          once(requestId, sendResponse)
        } else {
          sendResponse()
        }
      }
    }
  )
  registerService()
}
