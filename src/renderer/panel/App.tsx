import type { EmotionState } from '../../../shared/types'

const TEST_EMOTIONS: { emotion: EmotionState; label: string }[] = [
  { emotion: 'idle', label: '😌 idle 日常' },
  { emotion: 'happy', label: '🎉 happy 鼓励/庆祝' },
  { emotion: 'comfort', label: '🩹 comfort 治愈' },
  { emotion: 'stern', label: '😤 stern 批评' }
]

function App(): React.JSX.Element {
  const trigger = (emotion: EmotionState): void => {
    window.api.panel.testReaction({ emotion, durationMs: 4000 })
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, color: '#333' }}>
      <h1>Nobi 设置面板</h1>
      <p>计划管理、文案库、历史记录会在后续里程碑中加入这里。</p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>M2 测试：手动触发のびちゃん的情绪反应</h2>
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
    </div>
  )
}

export default App
