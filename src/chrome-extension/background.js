
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
    return initStandaloneWindow()
  }
  chrome.windows.update(
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
      sendMsgToContent({
        action: 'widgets-window-state-notify',
        widgetsFocused: true
      })
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

function getTabFromId(id) {
  return new Promise((resolve) => {
    chrome.tabs.get(id, resolve)
  })
    .catch(() => {id})
}

async function onTabEvent(_tab, action) {
  let tab = _.isPlainObject(_tab)
    ? _tab
    : await getTabFromId(_tab)
  let {id} = tab
  if (
    checkTab(tab)
  ) {
    if (action !== 'remove') {
      chrome.pageAction.show(id)
    }
    if (action === 'add') {
      activeTabIds.add(id)
    } else if (action === 'remove') {
      activeTabIds.remove(id)
    } else if (action === 'update') {
      activeTabIds.add(id)
    }
    return
  } else if (
    action === 'update'
  ) {
    activeTabIds.delete(id)
  }
}

chrome.tabs.onCreated.addListener(tab => {
  onTabEvent(tab, 'add')
})
chrome.tabs.onUpdated.addListener((tab, changeInfo) => {
  onTabEvent(tab, 'update', changeInfo)
})
chrome.tabs.onRemoved.addListener(tab => {
  onTabEvent(tab, 'remove')
})

chrome.pageAction.onClicked.addListener(function (tab) {
  chrome.pageAction.show(tab.id)
  if (
    checkTab(tab)
  ) {
    // send message to content.js to to open app window.
    chrome.tabs.sendMessage(tab.id, { action: 'openAppWindow' }, function() {})
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
      widgetsFocused: !!standaloneWindow
    })
  } else if (action === 'check-window-focused') {
    console.log(standaloneWindow)
    sendResponse({
      widgetsFocused: standaloneWindow && standaloneWindow.focused
    })
  }
})

chrome.windows.onRemoved.addListener(function (id) {
  if (standaloneWindow && standaloneWindow.id === id) {
    standaloneWindow = null
  }
  sendMsgToContent({
    action: 'widgets-window-state-notify',
    widgetsFocused: false
  })
})

chrome.windows.onFocusChanged.addListener(function (id) {
  if (standaloneWindow && standaloneWindow.id !== id) {
    console.log(standaloneWindow)
    sendMsgToContent({
      action: 'widgets-window-state-notify',
      widgetsFocused: false
    })
  }
})


