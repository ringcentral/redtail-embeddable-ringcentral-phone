
/**
 * content.js for chrome extension
 */

import createApp from 'ringcentral-embeddable-extension-common/src/no-spa/init'
import * as config from './config'
import 'ringcentral-embeddable-extension-common/src/no-spa/style.styl'
import './custom.styl'

window.addEventListener('load', createApp(config))
