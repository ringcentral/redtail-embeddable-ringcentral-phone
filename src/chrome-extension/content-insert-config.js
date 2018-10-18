/**
 * config content config file
 * with proper config, insert `call with ringcentral` button or hover some elemet show call button tooltip can be easily done
 * but it is not a required, you can just write your own code, ignore this
 */
import {
  RCBTNCLS2,
  checkPhoneNumber,
  createElementFromHTML
} from './helpers'
import _ from 'lodash'

export const insertClickToCallButton = [
  {
    // must match page url
    urlCheck: href => {
      return /\/contacts\/\d+/.test(href)
    },

    // define in the page how to get phone number,
    // if can not get phone number, will not insert the call button
    getContactPhoneNumbers: async () => {
      let sel = '.contact-phones .number'
      let doms = Array.from(
        document.querySelectorAll(sel)
      )
      return doms.reduce((prev, dom, i) => {
        let txt = dom.textContent.trim().replace(':', '')
        if (!checkPhoneNumber(txt)) {
          return prev
        }
        let title = dom.previousElementSibling.textContent.trim()
        return [
          ...prev,
          {
            id: i + 'pn',
            title,
            number: txt
          }
        ]
      }, [])
    },

    // parent dom to insert call button
    // can be multiple condition
    // the first one matches, rest the array will be ignored
    parentsToInsertButton: [
      {
        getElem: () => {
          let dom = document.querySelector('#contact-masthead2 #rc-btn-wrap')
          if (!dom) {
            let wrap = createElementFromHTML(`
              <div id="rc-btn-wrap"></div>
            `)
            let parent = document.querySelector('#contact-masthead2')
            parent.classList.add('rc-wrapped')
            parent.insertBefore(wrap, document.querySelector('#contact-masthead2 > .col-sm-12'))
            return wrap
          }
          return dom
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
