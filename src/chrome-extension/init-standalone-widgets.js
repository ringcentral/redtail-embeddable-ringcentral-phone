/**
 * since it is not a single page app,
 * so we do not want to init widgets every time when url change
 * instead we add a button to wake the standalone widgets in single page
 * after the initial, hide the button
 */

import {
  createElementFromHTML,
  sendMsgToBackground,
  createCallBtnHtml,
  addRuntimeEventListener,
  popup
} from './helpers'

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
    `<div class="rc-init-ext-wrap" id="rc-init-ext-wrap">
      ${createCallBtnHtml('rc-init-ext')}
     </div>
    `
  )
  let exist = document.getElementById('rc-init-ext-wrap')
  if (!exist) {
    dom.onclick = onClickInitExt()
    document.body.appendChild(dom)
    exist = dom
  }
  toggleInitButton(exist, widgetsOpened)
  addRuntimeEventListener(
    function(request, sender, sendResponse) {
      if (request.action === 'widgets-window-state-notify') {
        toggleInitButton(exist, request.widgetsOpened)
        exist.classList.remove('rc-show-init')
      }
      sendResponse()
    }
  )
}
