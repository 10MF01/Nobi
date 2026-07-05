import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { SEED_MESSAGES } from './seedMessages'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'nobi.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'countdown', 'one_off')),
      title TEXT NOT NULL,
      note TEXT,
      weekdays TEXT,
      target_date TEXT,
      is_done INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE (plan_id, date)
    );

    CREATE TABLE IF NOT EXISTS message_pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK (category IN ('encourage', 'comfort', 'stern', 'celebrate', 'neutral')),
      text TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT NOT NULL
    );
  `)

  seedMessagePoolsIfEmpty(db)

  return db
}

function seedMessagePoolsIfEmpty(database: Database.Database): void {
  const { count } = database
    .prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM message_pools`)
    .get()!
  if (count > 0) return

  const now = new Date().toISOString()
  const insert = database.prepare(
    `INSERT INTO message_pools (category, text, is_active, created_at) VALUES (@category, @text, 1, @createdAt)`
  )
  const insertAll = database.transaction(() => {
    for (const seed of SEED_MESSAGES) {
      insert.run({ category: seed.category, text: seed.text, createdAt: now })
    }
  })
  insertAll()
}
