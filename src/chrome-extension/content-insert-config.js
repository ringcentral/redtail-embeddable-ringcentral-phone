/**
 * config content config file
 * with proper config, insert `call with ringcentral` button or hover some elemet show call button tooltip can be easily done
 * but it is not a required, you can just write your own code, ignore this
 */
import {
  RCBTNCLS2,
  checkPhoneNumber,
  createElementFromHTML,
  getNumbers
} from './helpers'

function getIds(href) {
  let reg = /\/contacts\/(\d+)/
  let arr = href.match(reg) || []
  let vid = arr[1]
  if (!vid) {
    return null
  }
  return {
    vid
  }
}

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
          let dom = document.querySelector('#contact-masthead2 .rc-btn-wrapper')
          if (!dom) {
            let wrap = createElementFromHTML(`
              <div class="rc-btn-wrapper"></div>
            `)
            let parent = document.querySelector('#contact-masthead2')
            parent.parentNode.classList.add('rc-wrapped')
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
  {
    // must match url
    urlCheck: href => {
      return /\/contacts(?!\/)/.test(href)
    },

    //elemment selector
    selector: '#contact-list tr',

    getContactPhoneNumbers: async elem => {
      let linkElem = elem.querySelector('td.Name a')
      let href = linkElem
        ? linkElem.getAttribute('href')
        : ''
      let ids = getIds(href)
      return await getNumbers(ids)
    }
  }
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
