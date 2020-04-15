/**
 * third party activies related feature
 */

import extLinkSvg from 'ringcentral-embeddable-extension-common/src/common/link-external.svg'
import _ from 'lodash'
import moment from 'moment'
import $ from 'jquery'
import {
  notify,
  host
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import {
  getContactInfo
} from './common'

export function showActivityDetail (body) {
  let { activity = {} } = body
  let {
    subject,
    id
  } = activity
  const [uid, aid] = id.split('_')
  const url = `${host}/contacts/${uid}/activities/${aid}`
  let msg = `
    <div>
      <div class="rc-pd1b">
        <a href="${url}" target="_blank">
          <b>
            subject: ${subject}
            <img width=16 height=16 src="${extLinkSvg}" />
          </b>
        </a>
      </div>
    </div>
  `
  notify(msg, 'info', 8000)
}

export async function getActivities (body) {
  let uid = _.get(body, 'contact.id')
  if (!uid) {
    return []
  }
  console.log('body', body)
  let html = await getContactInfo({
    vid: uid
  })
  let re = $(html)
  let res = []
  let list = re.find('#contact-timeline2-content tr')
  list.each(function () {
    let t = $(this)
    let id = t.data('id').toString()
    let time = t.children()
      .eq(1).text().trim()
      .replace(/ +/, ' ')
    const allday = 'All Day'
    const today = 'Today'
    if (time.endsWith(allday)) {
      time = time.replace(allday, ' 0:00 AM')
    } else if (time.startsWith(today)) {
      const pre = moment().format('MMM DD ')
      time = time.replace(today, pre)
    }
    time = moment(time, 'MMM DD h:mm A').valueOf()
    let titleNode = t.children().eq(2).find('a')
    let subject = titleNode.text()
    // let url = titleNode.prop('href')
    res.push({
      id: `${uid}_${id}`,
      time,
      subject
    })
  })
  console.log('res', res)
  return res
}
