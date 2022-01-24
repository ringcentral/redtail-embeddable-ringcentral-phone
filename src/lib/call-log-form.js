/**
 * form for create contact
 */

import { useEffect, useState, useRef } from 'react'
import { Input, Form, Button, Tooltip, Spin } from 'antd'
import { doSync } from '../feat/call-log-sync'
import CountDown from './countdown'

const FormItem = Form.Item

export default function CallLogForm (props) {
  const countdownRef = useRef()
  const [form] = Form.useForm()
  const [showCountdown, setCountDownShow] = useState(true)
  const {
    body,
    isManuallySync,
    relatedContacts,
    info,
    note
  } = props.form
  const isCall = !!body.call
  const timer = isCall ? 20000 : 100
  const cls = isCall || isManuallySync ? 'rc-add-call-log-form' : 'rc-hide'
  function renderList () {
    const txt = relatedContacts.map(c => {
      return `${c.name}(${c.emails[0] || ''})`
    }).join(', ')
    return (
      <div className='rc-pd1b'>
        <Tooltip
          title={txt}
          getPopupContainer={getBox}
        >
          <div className='rc-elli'>{txt}</div>
        </Tooltip>
      </div>
    )
  }
  function renderDetail () {
    return (
      <li>
        {info.detail}
      </li>
    )
  }
  function renderNote () {
    return isCall && props.form.isManuallySync
      ? (
        <FormItem
          name='description'
          label='Note'
        >
          <Input.TextArea rows={row} onClick={removeCountDown} />
        </FormItem>
        )
      : null
  }
  // const cls = 'rc-add-call-log-form'
  function onFinish (data) {
    clearTimeout(countdownRef.current)
    doSync(
      body,
      data || {},
      isManuallySync,
      relatedContacts,
      info
    )
    handleCancel()
  }
  function handleCancel () {
    props.remove(props.form.id)
  }
  function getBox () {
    return document.getElementById('Pipedrive-rc')
  }
  function onTimeout () {
    form.submit()
  }
  useEffect(() => {
    if (!isManuallySync) {
      countdownRef.current = setTimeout(onTimeout, timer)
    }
    return () => {
      clearTimeout(countdownRef.current)
    }
  }, [])
  function renderCountDown () {
    if (!showCountdown || props.form.isManuallySync) {
      return null
    }
    return (
      <span>(<CountDown time={25} />)</span>
    )
  }
  function renderTime () {
    return (
      <li>
        time: <b>{info.time}</b>
      </li>
    )
  }
  function removeCountDown () {
    setCountDownShow(false)
  }
  const name = isCall ? 'call' : 'message'
  const row = 2
  return (
    <div className={cls}>
      <Spin spinning={false}>
        <div className='rc-pd2'>
          <Form
            layout='vertical'
            form={form}
            name='rc-add-call-log-form'
            onFinish={onFinish}
            initialValues={{
              description: note
            }}
          >
            <h3 className='rc-sync-title rc-pd1b'>
              Sync {name} log to matched contacts:
            </h3>
            {
              renderList()
            }
            <ul className='rc-pd1b rc-wordbreak'>
              {renderDetail()}
              {renderTime()}
            </ul>
            {renderNote()}
            <Button
              type='primary'
              htmlType='submit'
            >
              Submit {renderCountDown()}
            </Button>
            <Button onClick={handleCancel} className='rc-mg1l'>
              Cancel
            </Button>
          </Form>
        </div>
      </Spin>
    </div>
  )
}
