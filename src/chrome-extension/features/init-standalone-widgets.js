/**
 * since it is not a single page app,
 * so we do not want to init widgets every time when url change
 * instead we add a button to wake the standalone widgets in single page
 * hide the button when widget window active
 */

import {
  createElementFromHTML,
  sendMsgToBackground,
  createCallBtnHtml,
  addRuntimeEventListener,
  popup
} from '../common/helpers'

function onClickInitExt() {
  popup()
}

function toggleInitButton(btn, widgetsOpened) {
  if (widgetsOpened) {
    btn.classList.remove('rc-show-init')
  } else {
    btn.classList.add('rc-show-init')
  }
}

export default async () => {
  let {widgetsOpened} = await sendMsgToBackground({
    action: 'check-window-opened'
  }) || {}
  let dom = createElementFromHTML(
    `<div class="rc-init-ext-wrap animate" id="rc-init-ext-wrap">
      ${createCallBtnHtml('rc-init-ext')}
     </div>
    `
  )
  dom.onclick = onClickInitExt
  let btn = document.getElementById('rc-init-ext-wrap')
  if (!btn) {
    document.body.appendChild(dom)
    btn = dom
  }
  toggleInitButton(btn, widgetsOpened)
  addRuntimeEventListener(
    function(request, sender, sendResponse) {
      if (request.action === 'widgets-window-state-notify') {
        toggleInitButton(btn, request.widgetsOpened)
      } else {
        console.log('get msg now', request)
        window.postMessage(request, '*')
      }
      sendResponse()
    }
  )
}
