import type {
  EmotionState,
  MessageCategory,
  MessagePoolEntry,
  ReactionContext,
  ReactionEngine,
  ReactionResult
} from '../../../shared/types'

const CELEBRATE_STREAK_THRESHOLD = 3
const HIGH_RATE_THRESHOLD = 0.8
const MID_RATE_THRESHOLD = 0.4

/** 从"最久未被使用"的几条里随机挑一条，兼顾不重复感和随机感 */
const RECENCY_CANDIDATE_POOL_SIZE = 3

function decideCategory(ctx: ReactionContext): MessageCategory {
  if (ctx.trigger === 'goal_done') {
    return 'celebrate'
  }
  if (
    ctx.completionRate >= HIGH_RATE_THRESHOLD &&
    ctx.currentStreak >= CELEBRATE_STREAK_THRESHOLD
  ) {
    return 'celebrate'
  }
  if (ctx.completionRate >= MID_RATE_THRESHOLD) {
    return 'encourage'
  }
  if (ctx.justBrokeStreak) {
    return 'stern'
  }
  return 'comfort'
}

const CATEGORY_EMOTION: Record<MessageCategory, EmotionState> = {
  celebrate: 'happy',
  encourage: 'happy',
  comfort: 'comfort',
  stern: 'stern',
  neutral: 'idle'
}

/** 导出给 reactionCoordinator 的提醒(nudge)场景直接使用——那类场景的 category 是固定的（'neutral'），不需要走完成率决策 */
export function pickMessageForCategory(
  pool: MessagePoolEntry[],
  category: MessageCategory
): MessagePoolEntry | null {
  const candidates = pool.filter((m) => m.category === category && m.isActive)
  if (candidates.length === 0) return null

  const sorted = [...candidates].sort((a, b) => {
    const aTime = a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0
    const bTime = b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0
    return aTime - bTime
  })
  const leastRecentlyUsed = sorted.slice(0, RECENCY_CANDIDATE_POOL_SIZE)
  return leastRecentlyUsed[Math.floor(Math.random() * leastRecentlyUsed.length)]
}

export const reactionEngine: ReactionEngine = {
  react(ctx: ReactionContext): ReactionResult {
    const category = decideCategory(ctx)
    const emotion = CATEGORY_EMOTION[category]
    const message = pickMessageForCategory(ctx.pool, category)
    return { emotion, category, message }
  }
}
