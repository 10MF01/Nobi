import { getDb } from '../db'
import type { MessageCategory, MessagePoolEntry, MessagePoolInput } from '../../../../shared/types'

interface MessagePoolRow {
  id: number
  category: MessageCategory
  text: string
  is_active: number
  last_used_at: string | null
  created_at: string
}

function toMessage(row: MessagePoolRow): MessagePoolEntry {
  return {
    id: row.id,
    category: row.category,
    text: row.text,
    isActive: row.is_active === 1,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at
  }
}

export function listMessages(): MessagePoolEntry[] {
  const rows = getDb()
    .prepare<[], MessagePoolRow>(`SELECT * FROM message_pools ORDER BY category, created_at ASC`)
    .all()
  return rows.map(toMessage)
}

/** reactionEngine 只应该看到当前启用的文案 */
export function listActiveMessages(): MessagePoolEntry[] {
  const rows = getDb()
    .prepare<[], MessagePoolRow>(
      `SELECT * FROM message_pools WHERE is_active = 1 ORDER BY category, created_at ASC`
    )
    .all()
  return rows.map(toMessage)
}

export function createMessage(input: MessagePoolInput): MessagePoolEntry {
  const now = new Date().toISOString()
  const result = getDb()
    .prepare(
      `INSERT INTO message_pools (category, text, is_active, created_at) VALUES (@category, @text, 1, @createdAt)`
    )
    .run({ category: input.category, text: input.text, createdAt: now })
  return getMessageById(Number(result.lastInsertRowid))
}

export function getMessageById(id: number): MessagePoolEntry {
  const row = getDb()
    .prepare<[number], MessagePoolRow>(`SELECT * FROM message_pools WHERE id = ?`)
    .get(id)
  if (!row) throw new Error(`Message ${id} not found`)
  return toMessage(row)
}

export function updateMessage(id: number, input: Partial<MessagePoolInput>): MessagePoolEntry {
  const existing = getMessageById(id)
  getDb()
    .prepare(`UPDATE message_pools SET category = @category, text = @text WHERE id = @id`)
    .run({
      id,
      category: input.category ?? existing.category,
      text: input.text ?? existing.text
    })
  return getMessageById(id)
}

export function setMessageActive(id: number, isActive: boolean): MessagePoolEntry {
  getDb()
    .prepare(`UPDATE message_pools SET is_active = @isActive WHERE id = @id`)
    .run({ id, isActive: isActive ? 1 : 0 })
  return getMessageById(id)
}

export function deleteMessage(id: number): void {
  getDb().prepare(`DELETE FROM message_pools WHERE id = ?`).run(id)
}

/** 每次 reactionEngine 选中一条文案后调用，避免同一句反复出现 */
export function markMessageUsed(id: number): void {
  getDb()
    .prepare(`UPDATE message_pools SET last_used_at = @now WHERE id = @id`)
    .run({ id, now: new Date().toISOString() })
}
