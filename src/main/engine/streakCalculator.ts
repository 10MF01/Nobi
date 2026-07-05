import type { Plan } from '../../../shared/types'

export interface DailyStats {
  completionRate: number
  currentStreak: number
}

/** 达到这个完成率才算"这一天成功"，同时也是 streak 计数的门槛 */
const STREAK_SUCCESS_THRESHOLD = 0.8
const STREAK_LOOKBACK_DAYS = 60

function isApplicable(plan: Plan, weekday: number): boolean {
  if (plan.type === 'daily') return true
  if (plan.type === 'weekly') return plan.weekdays?.includes(weekday) ?? false
  return false
}

/**
 * 纯函数：给定当前 daily/weekly 计划集合 + 任意日期的打卡查询回调，
 * 算出某天的完成率，以及以该天为终点向前数的连续达标天数。
 * 不直接依赖数据库，方便单测；调用方（reactionCoordinator）负责把 sqlite 数据整理成回调形式。
 */
export function computeDailyStats(
  plans: Plan[],
  date: string,
  checkedPlanIdsOnDate: (date: string) => Set<number>,
  weekdayOfDate: (date: string) => number,
  offsetDate: (date: string, dayOffset: number) => string,
  lookbackDays = STREAK_LOOKBACK_DAYS
): DailyStats {
  const recurringPlans = plans.filter((p) => p.type === 'daily' || p.type === 'weekly')

  function rateForDate(d: string): number | null {
    const applicable = recurringPlans.filter((p) => isApplicable(p, weekdayOfDate(d)))
    if (applicable.length === 0) return null
    const checked = checkedPlanIdsOnDate(d)
    const done = applicable.filter((p) => checked.has(p.id)).length
    return done / applicable.length
  }

  const completionRate = rateForDate(date) ?? 0

  let currentStreak = 0
  for (let i = 0; i < lookbackDays; i++) {
    const d = offsetDate(date, -i)
    const rate = rateForDate(d)
    if (rate === null) continue
    if (rate >= STREAK_SUCCESS_THRESHOLD) {
      currentStreak++
    } else {
      break
    }
  }

  return { completionRate, currentStreak }
}
