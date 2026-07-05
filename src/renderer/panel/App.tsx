import { useState } from 'react'
import type { EmotionState } from '../../../shared/types'
import { PlansPage } from './pages/PlansPage'

const TEST_EMOTIONS: { emotion: EmotionState; label: string }[] = [
  { emotion: 'idle', label: '😌 idle 日常' },
  { emotion: 'happy', label: '🎉 happy 鼓励/庆祝' },
  { emotion: 'comfort', label: '🩹 comfort 治愈' },
  { emotion: 'stern', label: '😤 stern 批评' }
]

const TABS = [
  { key: 'plans', label: '计划管理' },
  { key: 'test', label: '测试反应' }
] as const

type TabKey = (typeof TABS)[number]['key']

function App(): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>('plans')

  const trigger = (emotion: EmotionState): void => {
    window.api.panel.testReaction({ emotion, durationMs: 4000 })
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, color: '#333' }}>
      <h1>Nobi 设置面板</h1>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #ddd', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #4fa955' : '2px solid transparent',
              background: 'transparent',
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#4fa955' : '#666',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' && <PlansPage />}

      {tab === 'test' && (
        <section>
          <h2 style={{ fontSize: 16 }}>手动触发のびちゃん的情绪反应</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TEST_EMOTIONS.map(({ emotion, label }) => (
              <button
                key={emotion}
                onClick={() => trigger(emotion)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App
