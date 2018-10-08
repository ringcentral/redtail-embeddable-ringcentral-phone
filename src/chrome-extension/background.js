
import _ from 'lodash'

let standaloneWindow
let activeTabIds = new Set()

function getDisplayInfo() {
  return new Promise(resolve => {
    chrome.system.display.getInfo(resolve)
  })
}

function popup() {
  if (!standaloneWindow) {
    initStandaloneWindow()
  }
  standaloneWindow.update(
    standaloneWindow.id,
    {
      focused: true,
      state: 'normal'
    }
  )
}

async function initStandaloneWindow() {
  // open standalong app window when click icon
  if (!standaloneWindow) {
    let arr = await getDisplayInfo()
    let {
      width,
      height
    } = _.get(arr, '[0].workArea') || {}
    chrome.windows.create({
      url: './standalone.html',
      type: 'popup',
      focused: true,
      width: 300,
      height: 536,
      left: parseInt(width, 10) - 300,
      top: parseInt(height, 10) - 536
    }, function (wind) {
      standaloneWindow = wind
    })
  } else {
    chrome.windows.update(standaloneWindow.id, {
      focused: true,
      state: 'normal'
    })
  }
}

function getStandaloneWindowTab() {
  return _.get(standaloneWindow, 'tabs[0]')
}

function sendMsgToTab(tab, data) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, data, function(response) {
      resolve(response)
    })
  })
}

async function sendMsgToStandAlone(data) {
  let tab = getStandaloneWindowTab()
  if (!tab) {
    return
  }
  return sendMsgToTab(tab, data)
}

async function sendMsgToContent(data) {
  let res = {}
  for (let id of activeTabIds) {
    let response = await sendMsgToTab({id}, data)
    res[id] = response
  }
  return res
}

function checkTab(tab) {
  return tab &&
    tab.url &&
    tab.url.includes('redtailtechnology.com')
}

async function onTabEvent(tabId, action, changeInfo) {
  let tab = await new Promise((resolve) => {
    chrome.tabs.get(tabId, resolve)
  })
  if (
    checkTab(tab)
  ) {
    if (action !== 'remove') {
      chrome.pageAction.show(tab.id)
    }
    if (action === 'add') {
      activeTabIds.add(tab.id)
    } else if (action === 'remove') {
      activeTabIds.remove(tab.id)
    }
    return
  } else if (
    action === 'update' && changeInfo.url
  ) {
    activeTabIds.remove(tab.id)
  }
}

chrome.tabs.onCreated.addListener(tabId => {
  onTabEvent(tabId, 'add')
})
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  onTabEvent(tabId, 'update', changeInfo)
})
chrome.tabs.onRemoved.addListener(tabId => {
  onTabEvent(tabId, 'remove')
})

chrome.pageAction.onClicked.addListener(function (tab) {
  chrome.pageAction.show(tab.id)
  if (
    checkTab(tab)
  ) {
    // send message to content.js to to open app window.
    chrome.tabs.sendMessage(tab.id, { action: 'openAppWindow' }, function(response) {
      console.log(response)
    })
    initStandaloneWindow()
    return
  }
})


chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  let {
    to,
    data,
    action
  } = request
  if (to === 'standalone') {
    let res = await sendMsgToStandAlone(data)
    sendResponse(res)
  } else if (to === 'content') {
    let res = await sendMsgToContent(data)
    sendResponse(res)
  } else if (action === 'popup') {
    popup()
  } else if (action === 'check-window-opened') {
    sendResponse({
      widgetsOpened: !!standaloneWindow
    })
  }
})

chrome.windows.onRemoved.addListener(function (id) {
  if (standaloneWindow && standaloneWindow.id === id) {
    standaloneWindow = null
  }
  sendMsgToContent({
    action: 'widgets-window-state-notify',
    widgetsOpened: false
  })
})

