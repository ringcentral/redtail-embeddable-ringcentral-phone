import initBackground from 'ringcentral-embeddable-extension-common/src/no-spa/background'
/**
 * for background.js, check current tab is extension target tab or not
 * @param {object} tab
 */
function checkTab(tab) {
  return tab &&
    tab.url &&
    tab.url.includes('redtailtechnology.com')
}
initBackground(checkTab)
