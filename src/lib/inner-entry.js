/**
 * react entry
 */

import { render } from 'react-dom'
import {
  createElementFromHTML
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import App from './inner-elem'

export default () => {
  const id = 'rc-react-entry-inner'
  let rootElement = document.getElementById(id)
  if (rootElement) {
    return
  }
  rootElement = createElementFromHTML(`<div id="${id}"></div>`)
  const home = document.getElementById('RedtailCRM-rc')
  home.appendChild(rootElement)
  render(
    <App />,
    rootElement
  )
}
