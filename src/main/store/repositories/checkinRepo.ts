import { getDb } from '../db'
import type { CheckIn } from '../../../../shared/types'

interface CheckInRow {
  id: number
  plan_id: number
  date: string
  completed_at: string
}

function toCheckIn(row: CheckInRow): CheckIn {
  return {
    id: row.id,
    planId: row.plan_id,
    date: row.date,
    completedAt: row.completed_at
  }
}

export function listCheckInsForDate(date: string): CheckIn[] {
  const rows = getDb()
    .prepare<[string], CheckInRow>(`SELECT * FROM check_ins WHERE date = ?`)
    .all(date)
  return rows.map(toCheckIn)
}

/** 已打卡则取消打卡返回 null，未打卡则新增打卡返回记录 —— 面板复选框直接绑定这个切换动作 */
export function toggleCheckIn(planId: number, date: string): CheckIn | null {
  const db = getDb()
  const existing = db
    .prepare<[number, string], CheckInRow>(`SELECT * FROM check_ins WHERE plan_id = ? AND date = ?`)
    .get(planId, date)

  if (existing) {
    db.prepare(`DELETE FROM check_ins WHERE id = ?`).run(existing.id)
    return null
  }

  const result = db
    .prepare(
      `INSERT INTO check_ins (plan_id, date, completed_at) VALUES (@planId, @date, @completedAt)`
    )
    .run({ planId, date, completedAt: new Date().toISOString() })

  const row = db
    .prepare<[number], CheckInRow>(`SELECT * FROM check_ins WHERE id = ?`)
    .get(Number(result.lastInsertRowid))
  return toCheckIn(row!)
}
