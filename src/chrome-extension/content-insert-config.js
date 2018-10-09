/**
 * config content config file
 * with proper config, insert `call with ringcentral` button or hover some elemet show call button tooltip can be easily done
 * but it is not a required, you can just write your own code, ignore this
 */
import {RCBTNCLS2, checkPhoneNumber} from './helpers'
import _ from 'lodash'

export const insertClickToCallButton = [
  {
    // must match page url
    urlCheck: href => {
      return /\/contacts\/\d+/.test(href)
    },

    // define in the page how to get phone number,
    // if can not get phone number, will not insert the call button
    getContactPhoneNumber: async () => {

    },

    // parent dom to insert call button
    // can be multiple condition
    // the first one matches, rest the array will be ignored
    parentsToInsertButton: [
      {
        getElem: () => {
          return document.querySelector('.masthead-buttons')
        },
        insertMethod: 'insertBefore',
        shouldInsert: () => {
          return !document.querySelector('.' + RCBTNCLS2)
        }
      }
    ]
  }
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
  ///*
  {
    urlCheck: (href) => {
      return /\/contacts\/\d+/.test(href)
    },
    selector: 'tbody.contact-phones .number div'
  }
  //*/
]
