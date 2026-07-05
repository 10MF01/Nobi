import { useEffect, useState } from 'react'
import { Card, Form, Slider, Switch, Typography, message } from 'antd'
import type { AppSettings } from '../../../../shared/types'

const { Text } = Typography

export function AppSettingsPage(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    let ignore = false
    window.api.settings.getApp().then((loaded) => {
      if (!ignore) setSettings(loaded)
    })
    return () => {
      ignore = true
    }
  }, [])

  async function update(patch: Partial<AppSettings>): Promise<void> {
    if (!settings) return
    const next = { ...settings, ...patch }
    setSettings(next)
    await window.api.settings.setApp(next)
  }

  if (!settings) return <Text type="secondary">加载中...</Text>

  return (
    <div>
      <Card title="开机自启动" style={{ marginBottom: 20, maxWidth: 480 }}>
        <Form layout="horizontal">
          <Form.Item label="开机时自动启动 Nobi" style={{ marginBottom: 0 }}>
            <Switch
              checked={settings.launchAtStartup}
              onChange={(checked) => {
                update({ launchAtStartup: checked })
                message.success(checked ? '已开启开机自启动' : '已关闭开机自启动')
              }}
            />
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          仅在安装后的正式版本中生效；开发模式下这个开关不会真正注册到系统启动项。
        </Text>
      </Card>

      <Card title="のびちゃん 外观" style={{ maxWidth: 480 }}>
        <Form layout="vertical">
          <Form.Item label={`形象大小（${Math.round(settings.petScale * 100)}%）`}>
            <Slider
              min={0.6}
              max={1.8}
              step={0.1}
              value={settings.petScale}
              onChange={(value) => update({ petScale: value })}
            />
          </Form.Item>
          <Form.Item
            label={`透明度（${Math.round(settings.petOpacity * 100)}%）`}
            style={{ marginBottom: 0 }}
          >
            <Slider
              min={0.3}
              max={1}
              step={0.05}
              value={settings.petOpacity}
              onChange={(value) => update({ petOpacity: value })}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
