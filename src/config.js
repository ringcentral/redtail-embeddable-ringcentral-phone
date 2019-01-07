/**
 * content config file
 * with proper config,
 * insert `call with ringcentral` button
 * or hover some elemet show call button tooltip
 * or convert phone number text to click-to-call link
 *
 */

/*
import {
  RCBTNCLS2,
  checkPhoneNumber
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
*/

// config insert click to call button
export const insertClickToCallButton = [
  /*
  {
    // before insert check pre condition like page url or something else
    shouldAct: href => {
      return href.includes('xxxx')
    },

    // define in the page how to get phone number,
    // if can not get phone number, will not insert the call button
    // support async
    getContactPhoneNumbers: async () => {
      let phones = document.querySelectorAll('.contact [data-display-type="PHONE"]')
      return [{
        id: 'xxx',
        title: 'yyy',
        number: 'xx-xxx-xxx'
      }]
    },

    // parent dom to insert call button
    // can be multiple condition
    // the first one matches, rest the array will be ignored
    parentsToInsertButton: [
      {
        getElem: () => {
          return document.querySelector('#modal-details-body header .btn-toolbar')
        },
        insertMethod: 'insertBefore',
        shouldInsert: () => {
          return !document.querySelector('#modal-details-body header .btn-toolbar .' + RCBTNCLS2)
        }
      }
    ]
  }
  */
]

// hover contact node to show click to dial tooltip
export const hoverShowClickToCallButton = [
  /*
  //config example
  {
    // before insert check pre condition like page url or something else
    shouldAct: href => {
      return href.includes('list/Contact/')
    },

    //elemment selector
    selector: '#entity-list table tbody tr',

    // function to get phone numbers, suport async function
    getContactPhoneNumbers: async elem => {
      let phoneNode = elem.querySelector('td.PHONE')
      ...
      let numbers = await getNumbers(ids)
      return [{
        id: 'xxx',
        title: 'yyy',
        number: 'xx-xxx-xxx'
      }]
    }
  }
  */
]

// modify phone number text to click-to-call link
export const phoneNumberSelectors = [
  /* example config
  {
    // before insert check pre condition like page url or something else
    shouldAct: (href) => {
      return href.includes('?blade=/details/contact')
    },
    selector: '#modal-details-body .metadata-span-phone'
  }
  */
]

/**
 * thirdPartyService config
 * @param {*} serviceName
 */
export function thirdPartyServiceConfig(serviceName) {

  console.log(serviceName)

  let services = {
    name: serviceName
    // // show contacts in ringcentral widgets
    // contactsPath: '/contacts',
    // contactSearchPath: '/contacts/search',
    // contactMatchPath: '/contacts/match',

    // // show auth/auauth button in ringcentral widgets
    // authorizationPath: '/authorize',
    // authorizedTitle: 'Unauthorize',
    // unauthorizedTitle: 'Authorize',
    // authorized: false,

    // // Enable call log sync feature
    // callLoggerPath: '/callLogger',
    // callLoggerTitle: `Log to ${serviceName}`,

    // // show contact activities in ringcentral widgets
    // activitiesPath: '/activities',
    // activityPath: '/activity'
  }

  // handle ringcentral event
  // check https://github.com/zxdong262/pipedrive-embeddable-ringcentral-phone-nospa/blob/master/src/config.js
  // as example
  // read our document about third party features https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/third-party-service-in-widget.md
  let handleRCEvents = async e => {
    console.log(e)
    // let {data} = e
    // // console.log('======data======')
    // // console.log(data, data.type, data.path)
    // // console.log('======data======')
    // if (!data) {
    //   return
    // }
    // let {type, loggedIn, path, call} = data
    // if (type ===  'rc-login-status-notify') {
    //   console.log(loggedIn, 'loggedIn')
    // }
    // if (
    //   type === 'rc-route-changed-notify' &&
    //   path === '/contacts' &&
    //   !window.rc.userAuthed
    // ) {
    //   showAuthBtn()
    // } else if (
    //   type === 'rc-active-call-notify' ||
    //   type === 'rc-call-start-notify'
    // ) {
    //   showContactInfoPanel(call)
    // } else if ('rc-call-end-notify' === type) {
    //   hideContactInfoPanel()
    // }
    // if (type !== 'rc-post-message-request') {
    //   return
    // }

    // if (data.path === '/authorize') {
    //   if (window.rc.local.apiKey) {
    //     unAuth()
    //   } else {
    //     showAuthBtn()
    //   }
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: { data: 'ok' }
    //   }, '*')
    // }
    // else if (path === '/contacts') {
    //   let contacts = await getContacts()
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: {
    //       data: contacts,
    //       nextPage: null
    //     }
    //   }, '*')
    // }
    // else if (path === '/contacts/search') {
    //   let contacts = await getContacts()
    //   let keyword = _.get(data, 'body.searchString')
    //   if (keyword) {
    //     contacts = searchContacts(contacts, keyword)
    //   }
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: {
    //       data: contacts
    //     }
    //   }, '*')
    // }
    // else if (path === '/contacts/match') {
    //   let contacts = await getContacts()
    //   let phoneNumbers = _.get(data, 'body.phoneNumbers') || []
    //   let res = findMatchContacts(contacts, phoneNumbers)
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: {
    //       data: res
    //     }
    //   }, '*')
    // }
    // else if (path === '/callLogger') {
    //   // add your codes here to log call to your service
    //   syncCallLogToThirdParty(data.body)
    //   // response to widget
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: { data: 'ok' }
    //   }, '*')
    // }
    // else if (path === '/activities') {
    //   const activities = await getActivities(data.body)
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: { data: activities }
    //   }, '*')
    // }
    // else if (path === '/activity') {
    //   // response to widget
    //   showActivityDetail(data.body)
    //   window.rc.postMessage({
    //     type: 'rc-post-message-response',
    //     responseId: data.requestId,
    //     response: { data: 'ok' }
    //   }, '*')
    // }
  }
  return {
    services,
    handleRCEvents
  }
}

/**
 * init third party
 * could init dom insert etc here
 */
export async function initThirdParty() {

}

// init call with ringcenntral button at page bottom
// enbaled by default, change to false to disable it
export const initCallButton = true
