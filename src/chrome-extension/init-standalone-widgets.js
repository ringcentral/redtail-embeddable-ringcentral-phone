/**
 * since it is not a single page app,
 * so we do not want to init widgets every time when url change
 * instead we add a button to wake the standalone widgets in single page
 * after the initial, hide the button
 */

import {
  createElementFromHTML
} from './helpers'

