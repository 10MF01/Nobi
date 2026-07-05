import dayjs from 'dayjs'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/ipcChannels'
import type { PetReactionPayload, ReactionContext, ReactionResult } from '../../../shared/types'
import { listPlans } from '../store/repositories/planRepo'
import { listCheckInsInRange } from '../store/repositories/checkinRepo'
import { listActiveMessages, markMessageUsed } from '../store/repositories/messagePoolRepo'
import { computeDailyStats } from './streakCalculator'
import { reactionEngine } from './reactionEngine'

const DATE_FORMAT = 'YYYY-MM-DD'
const LOOKBACK_DAYS = 60
const REACTION_DURATION_MS = 4500
const LOW_RATE_THRESHOLD = 0.4

function weekdayOfDate(date: string): number {
  return dayjs(date).day()
}

function offsetDate(date: string, dayOffset: number): string {
  return dayjs(date).add(dayOffset, 'day').format(DATE_FORMAT)
}

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

/** 打卡（daily/weekly）触发：真正算今天完成率 + 连续天数，交给 reactionEngine 决定情绪与文案 */
export function triggerCheckinReaction(petWindow: BrowserWindow, date: string): void {
  const plans = listPlans()
  const checkIns = listCheckInsInRange(offsetDate(date, -LOOKBACK_DAYS), date)

  const checkInsByDate = new Map<string, Set<number>>()
  for (const c of checkIns) {
    if (!checkInsByDate.has(c.date)) checkInsByDate.set(c.date, new Set())
    checkInsByDate.get(c.date)!.add(c.planId)
  }
  const checkedPlanIdsOnDate = (d: string): Set<number> => checkInsByDate.get(d) ?? new Set()

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
