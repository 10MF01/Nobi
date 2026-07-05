import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/ipcChannels'
import type { PetReactionPayload } from '../../../shared/types'
import { openPanelWindow } from '../windows/panelWindow'

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
}
