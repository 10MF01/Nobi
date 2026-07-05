import { useState } from 'react'
import { Button, ConfigProvider, Layout, Space, Tabs, Typography } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { EmotionState } from '../../../shared/types'
import { PlansPage } from './pages/PlansPage'

const { Content } = Layout
const { Title } = Typography

const TEST_EMOTIONS: { emotion: EmotionState; label: string }[] = [
  { emotion: 'idle', label: '😌 idle 日常' },
  { emotion: 'happy', label: '🎉 happy 鼓励/庆祝' },
  { emotion: 'comfort', label: '🩹 comfort 治愈' },
  { emotion: 'stern', label: '😤 stern 批评' }
]

const PAGE_BG = '#f5f8f4'

function App(): React.JSX.Element {
  const [tab, setTab] = useState('plans')

  const trigger = (emotion: EmotionState): void => {
    window.api.panel.testReaction({ emotion, durationMs: 4000 })
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3f9b54',
          colorBgLayout: PAGE_BG,
          colorBorder: '#dce6d9',
          colorTextBase: '#202b22',
          colorWarning: '#c97a2e',
          borderRadius: 8,
          fontFamily:
            '-apple-system, "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", sans-serif'
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', background: PAGE_BG }}>
        <Content
          style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '40px 32px 64px' }}
        >
          <Title level={3} style={{ marginBottom: 20 }}>
            Nobi 设置面板
          </Title>

          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: 'plans', label: '计划管理', children: <PlansPage /> },
              {
                key: 'test',
                label: '测试反应',
                children: (
                  <Space wrap>
                    {TEST_EMOTIONS.map(({ emotion, label }) => (
                      <Button key={emotion} onClick={() => trigger(emotion)}>
                        {label}
                      </Button>
                    ))}
                  </Space>
                )
              }
            ]}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
