export type EmotionState = 'idle' | 'happy' | 'comfort' | 'stern'

export interface PetReactionPayload {
  emotion: EmotionState
  durationMs: number
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
