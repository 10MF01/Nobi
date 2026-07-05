import { Notification } from 'electron'
import type { BrowserWindow } from 'electron'
import icon from '../../../resources/icon.png?asset'
import { IPC_CHANNELS } from '../../../shared/ipcChannels'
import type { PetReactionPayload, ReactionContext, ReactionResult } from '../../../shared/types'
import { listPlans } from '../store/repositories/planRepo'
import { listCheckInsForDate, listCheckInsInRange } from '../store/repositories/checkinRepo'
import { listActiveMessages, markMessageUsed } from '../store/repositories/messagePoolRepo'
import { upsertDailySummary } from '../store/repositories/dailySummaryRepo'
import { computeDailyStats, type DailyStats } from './streakCalculator'
import { reactionEngine, pickMessageForCategory } from './reactionEngine'
import {
  STREAK_LOOKBACK_DAYS,
  weekdayOfDate,
  offsetDate,
  isRecurringPlanApplicable,
  buildCheckInIndex
} from './dateUtils'

const REACTION_DURATION_MS = 4500
const NUDGE_DURATION_MS = 6000
const LOW_RATE_THRESHOLD = 0.4

function sendReaction(petWindow: BrowserWindow, result: ReactionResult): void {
  if (result.message) {
    markMessageUsed(result.message.id)
  }
  const payload: PetReactionPayload = {
    emotion: result.emotion,
    durationMs: REACTION_DURATION_MS,
    message: result.message?.text
  }
  petWindow.webContents.send(IPC_CHANNELS.PET_REACTION, payload)
}

function sendNotification(title: string, body: string): void {
  if (!Notification.isSupported()) return
  new Notification({ title, body, icon }).show()
}

/** 打卡/日终总结共用的完成率+连续天数计算，避免重复拼装 checkin 数据 */
function buildTodayContext(date: string): { ctx: ReactionContext; todayStats: DailyStats } {
  const plans = listPlans()
  const checkIns = listCheckInsInRange(offsetDate(date, -STREAK_LOOKBACK_DAYS), date)
  const checkedPlanIdsOnDate = buildCheckInIndex(checkIns)

  const todayStats = computeDailyStats(plans, date, checkedPlanIdsOnDate, weekdayOfDate, offsetDate)
  const yesterdayStats = computeDailyStats(
    plans,
    offsetDate(date, -1),
    checkedPlanIdsOnDate,
    weekdayOfDate,
    offsetDate
  )

  const ctx: ReactionContext = {
    completionRate: todayStats.completionRate,
    currentStreak: todayStats.currentStreak,
    justBrokeStreak:
      yesterdayStats.currentStreak > 0 && todayStats.completionRate < LOW_RATE_THRESHOLD,
    trigger: 'checkin',
    pool: listActiveMessages()
  }

  return { ctx, todayStats }
}

/** 打卡（daily/weekly）触发：真正算今天完成率 + 连续天数，交给 reactionEngine 决定情绪与文案 */
export function triggerCheckinReaction(petWindow: BrowserWindow, date: string): void {
  const { ctx } = buildTodayContext(date)
  sendReaction(petWindow, reactionEngine.react(ctx))
}

/** 完成 countdown/one_off 目标触发：不走完成率计算，直接给一次庆祝反应 */
export function triggerGoalDoneReaction(petWindow: BrowserWindow): void {
  const ctx: ReactionContext = {
    completionRate: 1,
    currentStreak: 0,
    justBrokeStreak: false,
    trigger: 'goal_done',
    pool: listActiveMessages()
  }

  sendReaction(petWindow, reactionEngine.react(ctx))
}

/** 中午/晚间提醒：今天还有 daily/weekly 计划没打卡时，才弹一次轻推（气泡 + 系统通知），已经全部打卡就安静 */
export function triggerNudgeReaction(petWindow: BrowserWindow, date: string): void {
  const plans = listPlans()
  const checkedIds = new Set(listCheckInsForDate(date).map((c) => c.planId))
  const todayWeekday = weekdayOfDate(date)
  const applicablePlans = plans.filter((p) => isRecurringPlanApplicable(p, todayWeekday))
  const allDone = applicablePlans.every((p) => checkedIds.has(p.id))
  if (applicablePlans.length === 0 || allDone) return

  const message = pickMessageForCategory(listActiveMessages(), 'neutral')
  if (!message) return
  markMessageUsed(message.id)

  const payload: PetReactionPayload = {
    emotion: 'idle',
    durationMs: NUDGE_DURATION_MS,
    message: message.text
  }
  petWindow.webContents.send(IPC_CHANNELS.PET_REACTION, payload)
  sendNotification('のびちゃん', message.text)
}

/** 日终总结：给一次真实反应 + 通知总结文案，并写入 daily_summaries 作为日志快照——
 * 这张表只是留痕，HistoryPage 不读它（现算，见 historyService.ts），别指望靠它补历史数据 */
export function triggerDailySummary(petWindow: BrowserWindow, date: string): void {
  const { ctx, todayStats } = buildTodayContext(date)
  upsertDailySummary(date, todayStats.completionRate, todayStats.currentStreak)

  sendReaction(petWindow, reactionEngine.react(ctx))

  const ratePercent = Math.round(todayStats.completionRate * 100)
  sendNotification(
    '今日总结',
    `今天完成率 ${ratePercent}%，连续 ${todayStats.currentStreak} 天达标。`
  )
}
