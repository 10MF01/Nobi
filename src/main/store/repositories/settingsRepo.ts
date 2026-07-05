import { getDb } from '../db'
import type { ReminderSettings } from '../../../../shared/types'

const REMINDER_SETTINGS_KEY = 'reminderSettings'

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  noonEnabled: true,
  noonTime: '12:30',
  eveningEnabled: true,
  eveningTime: '21:00',
  summaryEnabled: true,
  summaryTime: '23:30'
}

export function getReminderSettings(): ReminderSettings {
  const row = getDb()
    .prepare<[string], { value: string }>(`SELECT value FROM settings WHERE key = ?`)
    .get(REMINDER_SETTINGS_KEY)
  if (!row) return DEFAULT_REMINDER_SETTINGS
  return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(row.value) }
}

export function setReminderSettings(settings: ReminderSettings): ReminderSettings {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = @value`
    )
    .run({ key: REMINDER_SETTINGS_KEY, value: JSON.stringify(settings) })
  return settings
}
