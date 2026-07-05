import { useEffect, useState } from 'react'
import { Card, Space, Statistic, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import type { HistoryOverview } from '../../../../shared/types'

const { Text, Title } = Typography

const DAYS_TO_SHOW = 42
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function cellColor(rate: number | null): string {
  if (rate === null) return 'transparent'
  // 森绿主题色随完成率插值：0% 接近背景色，100% 是完整的品牌绿
  const alpha = 0.12 + rate * 0.78
  return `rgba(63, 155, 84, ${alpha})`
}

export function HistoryPage(): React.JSX.Element {
  const [overview, setOverview] = useState<HistoryOverview | null>(null)

  useEffect(() => {
    let ignore = false
    window.api.history.getOverview(DAYS_TO_SHOW).then((result) => {
      if (ignore) return
      setOverview(result)
    })
    return () => {
      ignore = true
    }
  }, [])

  if (!overview) return <Text type="secondary">加载中...</Text>

  const { points, currentStreak } = overview
  const scheduledPoints = points.filter((p) => p.completionRate !== null)
  const averageRate =
    scheduledPoints.length === 0
      ? 0
      : scheduledPoints.reduce((sum, p) => sum + (p.completionRate ?? 0), 0) /
        scheduledPoints.length

  const leadingBlanks = Array(dayjs(points[0].date).day()).fill(null)

  return (
    <div>
      <Space size={16} style={{ marginBottom: 20 }}>
        <Card size="small">
          <Statistic title="当前连续达标天数" value={currentStreak} suffix="天" />
        </Card>
        <Card size="small">
          <Statistic
            title={`过去 ${DAYS_TO_SHOW} 天平均完成率`}
            value={Math.round(averageRate * 100)}
            suffix="%"
          />
        </Card>
      </Space>

      <Card title="打卡热力图" size="small" style={{ maxWidth: 420 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 8
          }}
        >
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
              {label}
            </Text>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {leadingBlanks.map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {points.map((point) => (
            <Tooltip
              key={point.date}
              title={
                point.completionRate === null
                  ? `${point.date}：当天没有安排`
                  : `${point.date}：完成率 ${Math.round(point.completionRate * 100)}%`
              }
            >
              <div
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 4,
                  background: cellColor(point.completionRate),
                  border: point.completionRate === null ? '1px dashed #dce6d9' : 'none'
                }}
              />
            </Tooltip>
          ))}
        </div>
      </Card>

      {scheduledPoints.length === 0 && (
        <Title level={5} type="secondary" style={{ marginTop: 16 }}>
          还没有可统计的每日/每周计划打卡记录，去&ldquo;计划管理&rdquo;添加一个试试吧
        </Title>
      )}
    </div>
  )
}
