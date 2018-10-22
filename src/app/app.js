/**
 * send all window.postMessage to chrome extension background page, proxed to content.js
 */

import _ from 'lodash'

function sendMsg (data) {
  document
    .querySelector('#rc-widget-adapter-frame')
    .contentWindow
    .postMessage(data, '*')
}

function onMsg(e) {
  console.log('send msg to content.js from standalone.js')
  console.log(e.data)
  chrome.runtime.sendMessage({
    data: e.data,
    to: 'content'
  }, res => {
    console.log('send msg to content.js from standalone.js, get response')
    console.log(res)
    let arr = _.isArray(res)
      ? res
      : [res]
    for (let obj of arr) {
      if (obj) {
        sendMsg(obj)
      }
    }
  })
}

function init() {
  window.addEventListener('message', onMsg)
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.to === 'standalone') {
        console.log('get msg from content.js to standalone.js')
        console.log(request.data)
        sendMsg(request.data)
        sendResponse()
      }
    }
  )
  onMsg({
    data: {
      type: 'rc-standalone-init'
    }
  })
}

window.addEventListener('load', init)
