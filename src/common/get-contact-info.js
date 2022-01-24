import {
  host
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'

export async function getContactInfo (ids) {
  if (!ids) {
    return []
  }
  const {
    vid
  } = ids
  // https://smf.crm3.redtailtechnology.com/contacts/10
  const url = `${host}/contacts/${vid}`
  return fetch.get(url, {
    headers: {
      Accept: 'text/html'
    }
  })
}
