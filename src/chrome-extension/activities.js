/**
 * third party activies related feature
 */

import extLinkSvg from './link-external.svg'
import _ from 'lodash'
import moment from 'moment'
import $ from 'jquery'
import {
  notify,
  getContactInfo
} from './helpers'

export function showActivityDetail(body) {
  let {activity = {}} = body
  let {
    subject,
    url
  } = activity
  let msg = `
    <div>
      <div class="rc-pd1b">
        <a href="${url}">
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

export async function getActivities(body) {
  let id = _.get(body, 'contact.id')
  if (!id) {
    return []
  }
  let html = await getContactInfo({
    vid: id
  })
  let re = $(html)
  let res = []
  let list = re.find('#contact-timeline2-content tr')
  list.each(function() {
    let t = $(this)
    let id = t.prop('data-id')
    let time = t.children()
      .eq(1).text().trim()
      .replace(/ +/, ' ')
    time = moment(time, 'MMM DD h:mm A').valueOf()
    let titleNode = t.children().eq(2).find('a')
    let subject = titleNode.text()
    let url = titleNode.prop('href')
    res.push({
      id,
      time,
      subject,
      url
    })
  })
  return res
}
