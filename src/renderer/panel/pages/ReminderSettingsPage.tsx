import { useEffect, useState } from 'react'
import { Button, Card, Form, Space, Switch, TimePicker, Typography, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { ReminderSettings } from '../../../../shared/types'

const { Text, Title } = Typography
const TIME_FORMAT = 'HH:mm'

interface FormValues {
  noonEnabled: boolean
  noonTime: Dayjs
  eveningEnabled: boolean
  eveningTime: Dayjs
  summaryEnabled: boolean
  summaryTime: Dayjs
}

function toFormValues(settings: ReminderSettings): FormValues {
  return {
    noonEnabled: settings.noonEnabled,
    noonTime: dayjs(settings.noonTime, TIME_FORMAT),
    eveningEnabled: settings.eveningEnabled,
    eveningTime: dayjs(settings.eveningTime, TIME_FORMAT),
    summaryEnabled: settings.summaryEnabled,
    summaryTime: dayjs(settings.summaryTime, TIME_FORMAT)
  }
}

export function ReminderSettingsPage(): React.JSX.Element {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    window.api.reminders.getSettings().then((settings) => {
      if (ignore) return
      form.setFieldsValue(toFormValues(settings))
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [form])

  async function handleSave(values: FormValues): Promise<void> {
    const settings: ReminderSettings = {
      noonEnabled: values.noonEnabled,
      noonTime: values.noonTime.format(TIME_FORMAT),
      eveningEnabled: values.eveningEnabled,
      eveningTime: values.eveningTime.format(TIME_FORMAT),
      summaryEnabled: values.summaryEnabled,
      summaryTime: values.summaryTime.format(TIME_FORMAT)
    }
    await window.api.reminders.setSettings(settings)
    message.success('提醒设置已保存')
  }

  if (loading) return <Text type="secondary">加载中...</Text>

  return (
    <div>
      <Card title="提醒时间" style={{ marginBottom: 20, maxWidth: 480 }}>
        <Form<FormValues> form={form} layout="horizontal" onFinish={handleSave}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <Form.Item name="noonEnabled" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Text style={{ width: 96 }}>中午提醒</Text>
            <Form.Item name="noonTime" style={{ marginBottom: 0 }}>
              <TimePicker format={TIME_FORMAT} />
            </Form.Item>
          </Space>

          <Space align="center" style={{ marginBottom: 16, display: 'flex' }}>
            <Form.Item name="eveningEnabled" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Text style={{ width: 96 }}>晚间提醒</Text>
            <Form.Item name="eveningTime" style={{ marginBottom: 0 }}>
              <TimePicker format={TIME_FORMAT} />
            </Form.Item>
          </Space>

          <Space align="center" style={{ marginBottom: 20, display: 'flex' }}>
            <Form.Item name="summaryEnabled" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Text style={{ width: 96 }}>日终总结</Text>
            <Form.Item name="summaryTime" style={{ marginBottom: 0 }}>
              <TimePicker format={TIME_FORMAT} />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="立即测试" style={{ maxWidth: 480 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          不用等到设定时间，手动跑一次真实的提醒/总结逻辑
        </Title>
        <Space>
          <Button onClick={() => window.api.reminders.testNudge()}>测试：打卡提醒</Button>
          <Button onClick={() => window.api.reminders.testSummary()}>测试：日终总结</Button>
        </Space>
      </Card>
    </div>
  )
}
