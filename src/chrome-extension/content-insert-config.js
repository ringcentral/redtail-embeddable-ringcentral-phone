/**
 * config content config file
 * with proper config, insert `call with ringcentral` button or hover some elemet show call button tooltip can be easily done
 * but it is not a required, you can just write your own code, ignore this
 */
import {RCBTNCLS2, checkPhoneNumber} from './helpers'
export const insertClickToCallButton = [
  /* // config example
  {
    // must match page url
    urlCheck: href => {
      return href.includes('?interaction=call')
    },

    // define in the page how to get phone number,
    // if can not get phone number, will not insert the call button
    getContactPhoneNumber: () => {
      let phoneWrap = document.querySelector('[data-profile-property=\'phone\']')
      if (!phoneWrap) {
        return false
      }
      let phoneInput = phoneWrap.querySelector('input')
      if (!phoneInput) {
        return false
      }
      let {value} = phoneInput
      let isNumber = checkPhoneNumber(value)
      return isNumber ? value : false
    },

    // parent dom to insert call button
    // can be multiple condition
    // the first one matches, rest the array will be ignored
    parentsToInsertButton: [
      {
        getElem: () => {
          return document.querySelector('.start-call').parentNode
        },
        insertMethod: 'insertBefore',
        shouldInsert: () => {
          return !document.querySelector('.' + RCBTNCLS2)
        }
      },
      {
        getElem: () => {
          return document
            .querySelector('.panel-is-call button [data-key="twilio.notEnabled.skipOnboarding"]')
            .parentNode.parentNode
        },
        insertMethod: 'insertBefore',
        shouldInsert: () => {
          return !document.querySelector('.' + RCBTNCLS2)
        }
      }
    ]
  }
  */
]

//hover contact node to show click to dial tooltip
export const hoverShowClickToCallButton = [
  /* //config example
  {
    // must match url
    urlCheck: href => {
      return href.includes('contacts/list/view/all/')
    },

    //elemment selector
    selector: 'table.table tbody tr',

    // element should inclues phone number element
    getPhoneElemFromElem: elem => {
      return elem.querySelector('.column-phone span span')
    }
  }
  */
]

// modify phone number text to click-to-call link
export const phoneNumberSelectors = [
  /*
  {
    urlCheck: (href) => {
      return href.includes('?blade=/details/contact')
    },
    selector: '#modal-details-body .metadata-span-phone'
  }
  */
]
