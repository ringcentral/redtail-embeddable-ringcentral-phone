import initBackground from 'ringcentral-embeddable-extension-common/src/no-spa/background'
import { thirdPartyConfigs } from 'ringcentral-embeddable-extension-common/src/common/app-config'
/**
 * for background.js, check current tab is extension target tab or not
 * @param {object} tab
 */
function checkTab (tab) {
  return tab &&
    tab.url &&
    /^https:\/\/.+\.redtailtechnology.com/.test(tab.url)
}
let list = []
if (thirdPartyConfigs.upgradeServer) {
  list.push(
    new RegExp(
      '^' +
      thirdPartyConfigs.upgradeServer.replace(/\//g, '\\/').replace(/\./g, '\\.')
    )
  )
}
initBackground(checkTab, list)
