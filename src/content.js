
/**
 * content.js for chrome extension
 */

import createApp from 'ringcentral-embeddable-extension-common/src/no-spa/init'
// import * as config from './config'
import 'ringcentral-embeddable-extension-common/src/no-spa/style.styl'
import './custom.styl'

let config = {
  // config for insert click to call button, check ./config.js insertClickToCallButton  for detail
  insertClickToCallButton: [],

  // config for hover contact node to show click to dial tooltip, check ./config.js hoverShowClickToCallButton for detail
  hoverShowClickToCallButton: [],

  // config for modify phone number text to click-to-call link, check ./config.js phoneNumberSelectors for detail
  phoneNumberSelectors: [],

  // third party feature config, check ./config.js thirdPartyServiceConfig function for detail
  // should return
  /*
  {
    services: object,
    handleRCEvents: function
  }
  */
  thirdPartyServiceConfig: (serviceName) => console.log(serviceName),

  // after init callback function, can do some extra init here
  initThirdParty: () => null,

  // init call with ringcenntral button at page bottom
  // enbaled by default, change to false to disable it
  initCallButton: true
}

window.addEventListener('load', createApp(config))

