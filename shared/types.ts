export type EmotionState = 'idle' | 'happy' | 'comfort' | 'stern'

export interface PetReactionPayload {
  emotion: EmotionState
  durationMs: number
  message?: string
}

/** daily/weekly = 固定重复任务, countdown = 长期目标/考证倒计时, one_off = 临时单次待办 */
export type PlanType = 'daily' | 'weekly' | 'countdown' | 'one_off'

export interface Plan {
  id: number
  type: PlanType
  title: string
  note: string | null
  /** 仅 weekly 使用：0=周日...6=周六 */
  weekdays: number[] | null
  /** 仅 countdown 使用：YYYY-MM-DD */
  targetDate: string | null
  /** 仅 countdown/one_off 使用，daily/weekly 靠 CheckIn 判断完成情况 */
  isDone: boolean
  isActive: boolean
  createdAt: string
  archivedAt: string | null
}

export interface PlanInput {
  type: PlanType
  title: string
  note?: string | null
  weekdays?: number[] | null
  targetDate?: string | null
}

export interface CheckIn {
  id: number
  planId: number
  /** YYYY-MM-DD，打卡针对的日期，不是打卡发生的时间 */
  date: string
  completedAt: string
}

/** encourage/comfort/stern/celebrate 由 reactionEngine 规则驱动选取；neutral 预留给 M5 的主动提醒等非完成率触发场景 */
export type MessageCategory = 'encourage' | 'comfort' | 'stern' | 'celebrate' | 'neutral'

export interface MessagePoolEntry {
  id: number
  category: MessageCategory
  text: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export interface MessagePoolInput {
  category: MessageCategory
  text: string
}

export interface ReactionContext {
  completionRate: number
  currentStreak: number
  /** 昨天及之前有连续打卡记录，但今天完成率过低 —— 用于区分"批评"和"单纯治愈" */
  justBrokeStreak: boolean
  trigger: 'checkin' | 'goal_done'
  /** 只需传入当前启用的文案，engine 内部按 category 过滤 */
  pool: MessagePoolEntry[]
}

export interface ReactionResult {
  emotion: EmotionState
  category: MessageCategory
  message: MessagePoolEntry | null
}

export interface ReactionEngine {
  react(ctx: ReactionContext): ReactionResult
}
