
import fetch from 'ringcentral-embeddable-extension-common/src/common/fetch'
import {
  host
} from 'ringcentral-embeddable-extension-common/src/common/helpers'
import {
  getXid,
  getCSRF
} from './common'
/**
 * add contacts for test
 */
/*

Request URL: https://smf.crm3.redtailtechnology.com/contacts/individuals

Accept: q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Referer: https://smf.crm3.redtailtechnology.com/contacts/individuals/new
Sec-Fetch-Mode: cors
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36
X-CSRF-Token: ivtBzZQkQZ+GAUvSGCsWq5tmq/EDWLfyGI3CU+AOY6/DE6DfIEyHSUqcvorFzMQopEFEdSykfuYIY+xo6ru/Nw==
X-NewRelic-ID: VgUPUFFXGwYAVFdUBQY=
X-Requested-With: XMLHttpRequest

formdata:

utf8: %E2%9C%93
crm_contact_individual%5Bsalutation_id%5D:
crm_contact_individual%5Bfirst_name%5D: Test
crm_contact_individual%5Bmiddle_name%5D:
crm_contact_individual%5Blast_name%5D: Z
crm_contact_individual%5Bsuffix%5D:
crm_contact_individual%5Bnickname%5D:
crm_contact_individual%5Bdesignation%5D:
crm_contact_individual%5Bjob_title%5D:
crm_contact_individual%5Bbusiness_attributes%5D%5Bcompany_name%5D:
crm_contact_individual_company_id:
crm_contact_individual%5Bfamily_member_attributes%5D%5Bfamily_attributes%5D%5Bname%5D:
crm_contact_individual%5Badd_spouse%5D%5Bsalutation_id%5D:
crm_contact_individual%5Badd_spouse%5D%5Bfirst_name%5D:
crm_contact_individual%5Badd_spouse%5D%5Bmiddle_name%5D:
crm_contact_individual%5Badd_spouse%5D%5Blast_name%5D:
crm_contact_individual%5Badd_spouse%5D%5Bsuffix%5D:
crm_contact_individual%5Badd_spouse%5D%5Bnickname%5D:
crm_contact_individual%5Badd_spouse%5D%5Bdesignation%5D:
crm_contact_individual%5Badd_spouse%5D%5Bjob_title%5D:
crm_contact_individual%5Badd_spouse%5D%5Bbusiness%5D%5Bcompany_name%5D:
crm_contact_individual_add_spouse_company_id:
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Baddress_type%5D:
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bcountry%5D: US
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bis_primary%5D: 0
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bis_primary%5D: 1
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bis_preferred%5D: 0
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bstreet_address%5D:
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bsecondary_address%5D:
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bcity%5D:
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bstate%5D:
crm_contact_individual%5Baddresses_attributes%5D%5B0%5D%5Bzip%5D:
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bphone_type%5D: 6
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bnumber%5D: +(205)+409-7375
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bcountry_code%5D: 1
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bnumber%5D: 2054097375
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bis_primary%5D: 0
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bis_primary%5D: 1
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bextension%5D:
crm_contact_individual%5Bphones_attributes%5D%5B0%5D%5Bspeed_dial%5D:
crm_contact_individual%5Bemails_attributes%5D%5B0%5D%5Bemail_type%5D: 2
crm_contact_individual%5Bemails_attributes%5D%5B0%5D%5Baddress%5D: z1%40z1.com
crm_contact_individual%5Bemails_attributes%5D%5B0%5D%5Bis_primary%5D: 0
crm_contact_individual%5Bemails_attributes%5D%5B0%5D%5Bis_primary%5D: 1
crm_contact_individual%5Burls_attributes%5D%5B0%5D%5Burl_type%5D:
crm_contact_individual%5Burls_attributes%5D%5B0%5D%5Baddress%5D:
crm_contact_individual%5Bstatus_id%5D: 1
crm_contact_individual%5Bcategory_id%5D:
crm_contact_individual%5Bsource_id%5D:
crm_contact_individual%5Breferred_by%5D:
crm_contact_individual%5Bservicing_advisor_id%5D:
crm_contact_individual%5Bwriting_advisor_id%5D:
crm_contact_individual%5Bgender%5D:
crm_contact_individual%5Btax_id%5D:
crm_contact_individual%5Bdob%5D:
crm_contact_individual%5Bdob_reminder%5D: 0
crm_contact_individual%5Bdob_reminder%5D: 1
crm_contact_individual%5Bmarital_status%5D:
crm_contact_individual%5Bmarital_date%5D:
crm_contact_individual%5Bclient_since%5D:
crm_contact_individual%5Bclient_termination_date%5D:
crm_contact_individual%5Bdeath_date%5D:
who_can_manage: 0
_destroy%5B%7B%3Avalue%3D%3E1%2C+%3Aid%3D%3E%22permission-destroy%22%7D%5D:
crm_contact_individual%5Broles%5D%5Badvisor%5D:
crm_contact_individual%5Broles%5D%5Bassociate_advisor%5D:
crm_contact_individual%5Broles%5D%5Bcsa%5D:
commit: Save+Contact
*/

export async function addContact ({
  email,
  name,
  phoneNationalFormatted,
  phoneNational,
  countryCode
}) {
  let data = `
  utf8: ✓
  crm_contact_individual[salutation_id]:
  crm_contact_individual[first_name]: ${name}
  crm_contact_individual[middle_name]:
  crm_contact_individual[last_name]: Zz
  crm_contact_individual[suffix]:
  crm_contact_individual[nickname]:
  crm_contact_individual[designation]:
  crm_contact_individual[job_title]:
  crm_contact_individual[business_attributes][company_name]:
  crm_contact_individual_company_id:
  crm_contact_individual[family_member_attributes][family_attributes][name]:
  crm_contact_individual[add_spouse][salutation_id]:
  crm_contact_individual[add_spouse][first_name]:
  crm_contact_individual[add_spouse][middle_name]:
  crm_contact_individual[add_spouse][last_name]:
  crm_contact_individual[add_spouse][suffix]:
  crm_contact_individual[add_spouse][nickname]:
  crm_contact_individual[add_spouse][designation]:
  crm_contact_individual[add_spouse][job_title]:
  crm_contact_individual[add_spouse][business][company_name]:
  crm_contact_individual_add_spouse_company_id:
  crm_contact_individual[addresses_attributes][0][address_type]:
  crm_contact_individual[addresses_attributes][0][country]: US
  crm_contact_individual[addresses_attributes][0][is_primary]: 0
  crm_contact_individual[addresses_attributes][0][is_primary]: 1
  crm_contact_individual[addresses_attributes][0][is_preferred]: 0
  crm_contact_individual[addresses_attributes][0][street_address]:
  crm_contact_individual[addresses_attributes][0][secondary_address]:
  crm_contact_individual[addresses_attributes][0][city]:
  crm_contact_individual[addresses_attributes][0][state]:
  crm_contact_individual[addresses_attributes][0][zip]:
  crm_contact_individual[phones_attributes][0][phone_type]: 6
  crm_contact_individual[phones_attributes][0][number]: ${phoneNationalFormatted}
  crm_contact_individual[phones_attributes][0][country_code]: ${countryCode}
  crm_contact_individual[phones_attributes][0][number]: ${phoneNational}
  crm_contact_individual[phones_attributes][0][is_primary]: 0
  crm_contact_individual[phones_attributes][0][is_primary]: 1
  crm_contact_individual[phones_attributes][0][extension]:
  crm_contact_individual[phones_attributes][0][speed_dial]:
  crm_contact_individual[emails_attributes][0][email_type]: 2
  crm_contact_individual[emails_attributes][0][address]: ${email}
  crm_contact_individual[emails_attributes][0][is_primary]: 0
  crm_contact_individual[emails_attributes][0][is_primary]: 1
  crm_contact_individual[urls_attributes][0][url_type]:
  crm_contact_individual[urls_attributes][0][address]:
  crm_contact_individual[status_id]: 1
  crm_contact_individual[category_id]:
  crm_contact_individual[source_id]:
  crm_contact_individual[referred_by]:
  crm_contact_individual[servicing_advisor_id]:
  crm_contact_individual[writing_advisor_id]:
  crm_contact_individual[gender]:
  crm_contact_individual[tax_id]:
  crm_contact_individual[dob]:
  crm_contact_individual[dob_reminder]: 0
  crm_contact_individual[dob_reminder]: 1
  crm_contact_individual[marital_status]:
  crm_contact_individual[marital_date]:
  crm_contact_individual[client_since]:
  crm_contact_individual[client_termination_date]:
  crm_contact_individual[death_date]:
  who_can_manage: 0
  _destroy[{:value=>1, :id=>"permission-destroy"}]:
  crm_contact_individual[roles][advisor]:
  crm_contact_individual[roles][associate_advisor]:
  crm_contact_individual[roles][csa]:
  commit: Save Contact`
  data = data.split('\n')
    .map(d => d.trim())
    .filter(d => d)
    .map(s => {
      let arr = s.split(':')
      let len = arr.length
      let name = arr.slice(0, len - 1).join(':')
      let value = arr[len - 1].trim()
      return {
        name,
        value
      }
    })
    .reduce((prev, obj, i) => {
      let f = i ? '&' : ''
      return `${prev}${f}${encodeURIComponent(obj.name)}=${encodeURIComponent(obj.value)}`
    }, '')
  const url = `${host}/contacts/individuals`
  let res = await fetch.post(url, {}, {
    headers: {
      Accept: '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-Token': getCSRF(),
      'X-NewRelic-ID': getXid(),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: data
  })
  console.log(res, 'iiii')
}

export async function createAll () {
  const all = 200
  const start = 0
  for (let i = start; i < all + start; i++) {
    console.log(i)
    const c = {
      email: `zzz${i + 1}@zz.com`,
      name: `Testt${i}`,
      phoneNationalFormatted: `(205) 409-${7376 + i}`,
      phoneNational: `205409${7376 + i}`,
      countryCode: '1'
    }
    const res = await addContact(c)
    console.log(res, 'contact created')
  }
}
