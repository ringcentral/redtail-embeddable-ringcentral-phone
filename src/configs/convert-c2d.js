/**
 * content config file
 * with proper config,
 * insert `call with ringcentral` button
 * or hover some elemet show call button tooltip
 * or convert phone number text to click-to-call link
 *
 */

// modify phone number text to click-to-call link
// modify phone number text to click-to-call link
export const phoneNumberSelectors = [
  /// *
  {
    shouldAct: (href) => {
      return /\/contacts\/\d+/.test(href)
    },
    selector: 'tbody.contact-phones .number'
  }
  //* /
]
