/**
 * config content config file
 * with proper config, insert `call with ringcentral` button or hover some elemet show call button tooltip can be easily done
 * but it is not a required, you can just write your own code, ignore this
 */
import {
  RCBTNCLS2,
  checkPhoneNumber,
  getHost,
  getXid,
  getCSRF,
  createElementFromHTML
} from './helpers'
import _ from 'lodash'
import $ from 'jquery'
import fetch from '../common/fetch'

const host = getHost()

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

function formatNumbers(res) {
  let re = $(res)
  let final = []
  re.find('.contact-phones .number').each(function(i) {
    let t = $(this)
    let number = t.text().trim()
    if (checkPhoneNumber(number)) {
      final.push({
        id: i,
        title: t.prev().text().trim(),
        number: t.text().trim()
      })
    }
  })
  return final
}

async function getNumbers(ids = getIds()) {
  if (!ids) {
    return []
  }
  let {
    vid
  } = ids
  //https://smf.crm3.redtailtechnology.com/contacts/10
  let url = `${host}/contacts/${vid}`

  let res = await fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
  return res ? formatNumbers(res) : []
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
          let dom = document.querySelector('#contact-masthead2 #rc-btn-wrap')
          if (!dom) {
            let wrap = createElementFromHTML(`
              <div id="rc-btn-wrapper"></div>
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
