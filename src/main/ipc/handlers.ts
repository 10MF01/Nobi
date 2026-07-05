import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/ipcChannels'
import type { PetReactionPayload, PlanInput } from '../../../shared/types'
import { openPanelWindow } from '../windows/panelWindow'
import {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  setPlanDone
} from '../store/repositories/planRepo'
import { listCheckInsForDate, toggleCheckIn } from '../store/repositories/checkinRepo'

export function registerIpcHandlers(petWindow: BrowserWindow): void {
  let dragOrigin: { x: number; y: number } | null = null

  ipcMain.on(IPC_CHANNELS.PET_DRAG_START, () => {
    const bounds = petWindow.getBounds()
    dragOrigin = { x: bounds.x, y: bounds.y }
  })

  ipcMain.on(IPC_CHANNELS.PET_DRAG_MOVE, (_event, { dx, dy }: { dx: number; dy: number }) => {
    if (!dragOrigin) return
    petWindow.setPosition(Math.round(dragOrigin.x + dx), Math.round(dragOrigin.y + dy))
  })

  ipcMain.on(IPC_CHANNELS.PET_CLICK, () => {
    // Petting のびちゃん gives a small happy pulse. The real rule-driven
    // reaction (completion rate / streak based) lands in M4.
    petWindow.webContents.send(IPC_CHANNELS.PET_REACTION, {
      emotion: 'happy',
      durationMs: 1200
    } satisfies PetReactionPayload)
  })

  ipcMain.on(IPC_CHANNELS.PANEL_OPEN, () => {
    openPanelWindow()
  })

  ipcMain.on(IPC_CHANNELS.PANEL_TEST_REACTION, (_event, payload: PetReactionPayload) => {
    petWindow.webContents.send(IPC_CHANNELS.PET_REACTION, payload)
  })

  ipcMain.handle(IPC_CHANNELS.PLANS_LIST, () => listPlans())

  ipcMain.handle(IPC_CHANNELS.PLANS_CREATE, (_event, input: PlanInput) => createPlan(input))

  ipcMain.handle(IPC_CHANNELS.PLANS_UPDATE, (_event, id: number, input: Partial<PlanInput>) =>
    updatePlan(id, input)
  )

  ipcMain.handle(IPC_CHANNELS.PLANS_DELETE, (_event, id: number) => deletePlan(id))

  ipcMain.handle(IPC_CHANNELS.PLANS_SET_DONE, (_event, id: number, isDone: boolean) =>
    setPlanDone(id, isDone)
  )

  ipcMain.handle(IPC_CHANNELS.CHECKINS_LIST_FOR_DATE, (_event, date: string) =>
    listCheckInsForDate(date)
  )

  ipcMain.handle(IPC_CHANNELS.CHECKINS_TOGGLE, (_event, planId: number, date: string) =>
    toggleCheckIn(planId, date)
  )
}
