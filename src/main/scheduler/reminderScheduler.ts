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

/** settings 里存的是未经校验的 JSON，时间字符串万一损坏时 scheduleJob 会返回 null——
 * 跳过并打日志，而不是把 null 混进 jobs 数组，否则下次 reschedule 时 job.cancel() 会直接崩掉整个主进程 */
function scheduleValidJob(time: string, task: () => void): schedule.Job | null {
  const job = schedule.scheduleJob(cronFromTime(time), task)
  if (!job) {
    console.error(`[reminderScheduler] 提醒时间格式无效，已跳过这个任务: "${time}"`)
  }
  return job
}

/** 首次启动 + 每次面板保存提醒设置后都调用这个，先清空旧任务再按最新设置重排 */
export function rescheduleReminders(petWindow: BrowserWindow): void {
  jobs.forEach((job) => job.cancel())
  jobs = []

  const settings = getReminderSettings()
  const newJobs: (schedule.Job | null)[] = []

  if (settings.noonEnabled) {
    newJobs.push(
      scheduleValidJob(settings.noonTime, () => triggerNudgeReaction(petWindow, today()))
    )
  }
  if (settings.eveningEnabled) {
    newJobs.push(
      scheduleValidJob(settings.eveningTime, () => triggerNudgeReaction(petWindow, today()))
    )
  }
  if (settings.summaryEnabled) {
    newJobs.push(
      scheduleValidJob(settings.summaryTime, () => triggerDailySummary(petWindow, today()))
    )
  }

  jobs = newJobs.filter((job): job is schedule.Job => job !== null)
}
