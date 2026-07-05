import dayjs from 'dayjs'
import type { HistoryOverview, Plan } from '../../../shared/types'
import { listPlans } from '../store/repositories/planRepo'
import { listCheckInsInRange } from '../store/repositories/checkinRepo'
import { computeDailyStats } from './streakCalculator'

const DATE_FORMAT = 'YYYY-MM-DD'
/** streak 计算本身要往回看的天数，给最早展示的那天留够缓冲 */
const STREAK_LOOKBACK_BUFFER_DAYS = 60

function weekdayOfDate(date: string): number {
  return dayjs(date).day()
}

function offsetDate(date: string, dayOffset: number): string {
  return dayjs(date).add(dayOffset, 'day').format(DATE_FORMAT)
}

function hasApplicablePlans(plans: Plan[], date: string): boolean {
  const weekday = weekdayOfDate(date)
  return plans.some(
    (p) => p.type === 'daily' || (p.type === 'weekly' && (p.weekdays?.includes(weekday) ?? false))
  )
}

/**
 * HistoryPage 用：现算最近 N 天的完成率，不依赖 daily_summaries 快照——
 * 那张表只在定时任务实际触发那天才有记录，应用没开着的日子会缺失，现算才能保证历史连续可信。
 */
export function getHistoryOverview(days: number): HistoryOverview {
  const today = dayjs().format(DATE_FORMAT)
  const plans = listPlans()
  const checkIns = listCheckInsInRange(
    offsetDate(today, -(days + STREAK_LOOKBACK_BUFFER_DAYS)),
    today
  )

  const checkInsByDate = new Map<string, Set<number>>()
  for (const c of checkIns) {
    if (!checkInsByDate.has(c.date)) checkInsByDate.set(c.date, new Set())
    checkInsByDate.get(c.date)!.add(c.planId)
  }
  const checkedPlanIdsOnDate = (d: string): Set<number> => checkInsByDate.get(d) ?? new Set()

  const points: HistoryOverview['points'] = []
  let currentStreak = 0
  for (let i = days - 1; i >= 0; i--) {
    const date = offsetDate(today, -i)
    const stats = computeDailyStats(plans, date, checkedPlanIdsOnDate, weekdayOfDate, offsetDate)
    const completionRate = hasApplicablePlans(plans, date) ? stats.completionRate : null
    points.push({ date, completionRate })
    if (date === today) currentStreak = stats.currentStreak
  }

  return { points, currentStreak }
}
