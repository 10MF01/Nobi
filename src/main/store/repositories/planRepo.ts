import { getDb } from '../db'
import type { Plan, PlanInput } from '../../../../shared/types'

interface PlanRow {
  id: number
  type: Plan['type']
  title: string
  note: string | null
  weekdays: string | null
  target_date: string | null
  is_done: number
  is_active: number
  created_at: string
  archived_at: string | null
}

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    note: row.note,
    weekdays: row.weekdays ? JSON.parse(row.weekdays) : null,
    targetDate: row.target_date,
    isDone: row.is_done === 1,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    archivedAt: row.archived_at
  }
}

export function listPlans(): Plan[] {
  const rows = getDb()
    .prepare<[], PlanRow>(`SELECT * FROM plans WHERE is_active = 1 ORDER BY type, created_at ASC`)
    .all()
  return rows.map(toPlan)
}

export function createPlan(input: PlanInput): Plan {
  const now = new Date().toISOString()
  const result = getDb()
    .prepare(
      `INSERT INTO plans (type, title, note, weekdays, target_date, is_done, is_active, created_at)
       VALUES (@type, @title, @note, @weekdays, @targetDate, 0, 1, @createdAt)`
    )
    .run({
      type: input.type,
      title: input.title,
      note: input.note ?? null,
      weekdays: input.weekdays ? JSON.stringify(input.weekdays) : null,
      targetDate: input.targetDate ?? null,
      createdAt: now
    })

  return getPlanById(Number(result.lastInsertRowid))
}

export function getPlanById(id: number): Plan {
  const row = getDb().prepare<[number], PlanRow>(`SELECT * FROM plans WHERE id = ?`).get(id)
  if (!row) throw new Error(`Plan ${id} not found`)
  return toPlan(row)
}

export function updatePlan(id: number, input: Partial<PlanInput>): Plan {
  const existing = getPlanById(id)
  getDb()
    .prepare(
      `UPDATE plans SET title = @title, note = @note, weekdays = @weekdays, target_date = @targetDate
       WHERE id = @id`
    )
    .run({
      id,
      title: input.title ?? existing.title,
      note: input.note !== undefined ? input.note : existing.note,
      weekdays:
        input.weekdays !== undefined
          ? JSON.stringify(input.weekdays)
          : JSON.stringify(existing.weekdays),
      targetDate: input.targetDate !== undefined ? input.targetDate : existing.targetDate
    })
  return getPlanById(id)
}

export function setPlanDone(id: number, isDone: boolean): Plan {
  getDb()
    .prepare(`UPDATE plans SET is_done = @isDone WHERE id = @id`)
    .run({ id, isDone: isDone ? 1 : 0 })
  return getPlanById(id)
}

export function deletePlan(id: number): void {
  getDb().prepare(`DELETE FROM plans WHERE id = ?`).run(id)
}
