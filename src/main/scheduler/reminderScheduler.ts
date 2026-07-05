import dayjs from 'dayjs'
import schedule from 'node-schedule'
import type { BrowserWindow } from 'electron'
import { getReminderSettings } from '../store/repositories/settingsRepo'
import { triggerNudgeReaction, triggerDailySummary } from '../engine/reactionCoordinator'

let jobs: schedule.Job[] = []

function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** node-schedule 用标准 5 段 cron，HH:mm 直接映射成 "分 时 * * *" */
function cronFromTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  return `${minute} ${hour} * * *`
}

/** 首次启动 + 每次面板保存提醒设置后都调用这个，先清空旧任务再按最新设置重排 */
export function rescheduleReminders(petWindow: BrowserWindow): void {
  jobs.forEach((job) => job.cancel())
  jobs = []

  const settings = getReminderSettings()

  if (settings.noonEnabled) {
    jobs.push(
      schedule.scheduleJob(cronFromTime(settings.noonTime), () =>
        triggerNudgeReaction(petWindow, today())
      )
    )
  }
  if (settings.eveningEnabled) {
    jobs.push(
      schedule.scheduleJob(cronFromTime(settings.eveningTime), () =>
        triggerNudgeReaction(petWindow, today())
      )
    )
  }
  if (settings.summaryEnabled) {
    jobs.push(
      schedule.scheduleJob(cronFromTime(settings.summaryTime), () =>
        triggerDailySummary(petWindow, today())
      )
    )
  }
}
