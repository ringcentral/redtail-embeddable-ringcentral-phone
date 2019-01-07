import initBackground from 'ringcentral-embeddable-extension-common/src/no-spa/background'
/**
 * for background.js, check current tab is extension target tab or not
 * @param {object} tab
 */
export function checkTab(tab) {
  return !!tab.url
  /** url check examples
   * return /https:\/\/.+\.pipedrive.com\/.+/.test(tab.url)
    tab.url.startsWith('https://app.hubspot.com') &&
    !tab.url.startsWith('https://app.hubspot.com/login') &&
    !tab.url.startsWith('https://app.hubspot.com/myaccounts-beta') &&
    !tab.url.startsWith('https://app.hubspot.com/developer')
   */
}

initBackground(checkTab)
