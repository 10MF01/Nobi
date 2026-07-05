import { getDb } from '../db'

export function upsertDailySummary(date: string, completionRate: number, streak: number): void {
  getDb()
    .prepare(
      `INSERT INTO daily_summaries (date, completion_rate, streak, created_at)
       VALUES (@date, @completionRate, @streak, @createdAt)
       ON CONFLICT(date) DO UPDATE SET completion_rate = @completionRate, streak = @streak`
    )
    .run({ date, completionRate, streak, createdAt: new Date().toISOString() })
}
