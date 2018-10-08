

import initThirdPartyApi from './third-party-api'
import insertClickToCall from './insert-click-to-call-button'
import addHoverEvent from './hover-to-show-call-button'
import initStandaloneWidgets from './init-standalone-widgets'
import convertPhoneLink from './make-phone-number-clickable'
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

let registered = false
export default () => {
  addRuntimeEventListener(
    function(request, sender, sendResponse) {
      if (request.to === 'content') {
        console.log('!1!!get msg from standalone.js to content.js')
        console.log(request.data)
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
  registered = true
  registerService()
  // window.addEventListener('message', function (e) {
  //   const data = e.data
  //   if (data && data.type === 'rc-adapter-pushAdapterState' && registered === false) {
  //     registered = true
  //     registerService()
  //   }
  // })
}
