/**
 * react element in widget wrapper
 */

import { useEffect, useState } from 'react'
import { Tooltip, Input, notification } from 'antd'
import { EditOutlined, LeftCircleOutlined, SyncOutlined } from '@ant-design/icons'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'
// prefix telephonySessionId
import { autoLogPrefix } from '../feat/common'
import _ from 'lodash'
import './inner.styl'

notification.config({
  placement: 'bottomLeft',
  duration: 5
})

const { TextArea } = Input

export default () => {
  const [state, setStateOri] = useState({
    path: '',
    calling: false,
    note: '',
    hideForm: false,
    showAddContactForm: false,
    submitting: false,
    transferringData: false
  })
  const { note, hideForm, calling, path, transferringData } = state
  function setState (obj) {
    setStateOri(s => ({
      ...s,
      ...obj
    }))
  }
  function saveNote (id) {
    ls.set(id, note)
  }
  async function onEvent (e) {
    if (!e || !e.data || !e.data.type) {
      return
    }
    const { type, path, transferringData } = e.data
    if (type === 'rc-transferring-data') {
      setState({
        transferringData
      })
    } else if (type === 'rc-route-changed-notify') {
      setState({
        path
      })
    } else if (type === 'rc-call-start-notify') {
      setState({
        calling: true,
        note: '',
        hideForm: false
      })
    } else if (type === 'rc-call-end-notify') {
      // setState({
      //   hideForm: true
      // })
      const sid = _.get(e, 'data.call.partyData.sessionId')
      if (!sid) {
        return
      }
      const id = autoLogPrefix + sid
      saveNote(id)
    }
  }
  function handleChangeNote (e) {
    setState({
      note: e.target.value
    })
  }
  function onUnload (e) {
    if (window.rc.calling) {
      // Cancel the event
      e.preventDefault()
      e.returnValue = ''
      return 'Need confirm'
    }
  }
  useEffect(() => {
    window.addEventListener('beforeunload', onUnload)
    window.addEventListener('message', onEvent)
    return () => {
      window.removeEventListener('message', onEvent)
    }
  }, [note])
  const isCallPath = path.startsWith('/calls/') || path.startsWith('/dialer')
  if (path === '/contacts' && transferringData) {
    return (
      <Tooltip title='Rebuilding data...' overlayClassName='rc-toolt-tip-card'>
        <SyncOutlined
          spin
          className='rc-show-note-form'
        />
      </Tooltip>
    )
  }
  // if (showAddContactForm) {
  //   return (
  //     <ContactForm
  //       onFinish={onFinish}
  //       formData={data}
  //       loading={submitting}
  //       handleCancel={() => setState({
  //         showAddContactForm: false
  //       })}
  //     />
  //   )
  // }
  if (!calling) {
    return null
  }
  if (hideForm && isCallPath) {
    return (
      <Tooltip title='Show note edit form' overlayClassName='rc-toolt-tip-card'>
        <EditOutlined
          onClick={() => setState({
            hideForm: false
          })}
          className='pointer rc-show-note-form'
        />
      </Tooltip>
    )
  } else if (isCallPath) {
    return (
      <div className='rc-call-note-form'>
        <div className='pd1'>
          <Tooltip overlayClassName='rc-toolt-tip-card' title='Note will synced with call log when call end'>
            <TextArea
              value={note}
              style={{
                width: 'calc(100% - 24px)',
                marginLeft: '24px'
              }}
              rows={1}
              placeholder='Take some notes'
              onChange={handleChangeNote}
            />
          </Tooltip>
          <Tooltip title='Hide form' overlayClassName='rc-toolt-tip-card'>
            <LeftCircleOutlined
              onClick={() => setState({
                hideForm: true
              })}
              className='pointer rc-hide-note-form'
            />
          </Tooltip>
        </div>
      </div>
    )
  }
  return null
}
