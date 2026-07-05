import dayjs from 'dayjs'
import type { CheckIn, Plan } from '../../../shared/types'

export const DATE_FORMAT = 'YYYY-MM-DD'

/** streakCalculator 的连续天数计算最多向前回溯这么多天；拉取 check-in 数据的调用方要覆盖到同样的长度，
 * 这个常量是三处（streakCalculator/reactionCoordinator/historyService）共用的唯一定义 */
export const STREAK_LOOKBACK_DAYS = 60

export function weekdayOfDate(date: string): number {
  return dayjs(date).day()
}

export function offsetDate(date: string, dayOffset: number): string {
  return dayjs(date).add(dayOffset, 'day').format(DATE_FORMAT)
}

/** daily 每天都到期；weekly 只在勾选的星期几到期；countdown/one_off 不走这条打卡路径 */
export function isRecurringPlanApplicable(plan: Plan, weekday: number): boolean {
  if (plan.type === 'daily') return true
  if (plan.type === 'weekly') return plan.weekdays?.includes(weekday) ?? false
  return false
}

/** 把打卡记录按日期分组成 planId 集合，reactionCoordinator/historyService 都要这份索引来避免逐天查库 */
export function buildCheckInIndex(checkIns: CheckIn[]): (date: string) => Set<number> {
  const byDate = new Map<string, Set<number>>()
  for (const c of checkIns) {
    if (!byDate.has(c.date)) byDate.set(c.date, new Set())
    byDate.get(c.date)!.add(c.planId)
  }
  return (date: string): Set<number> => byDate.get(date) ?? new Set()
}
