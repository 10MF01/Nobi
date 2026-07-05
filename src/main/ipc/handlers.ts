import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/ipcChannels'
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
    // M1 placeholder: reaction engine (emotion + message) lands in M4.
    console.log('[Nobi] pet clicked')
  })

  ipcMain.on(IPC_CHANNELS.PANEL_OPEN, () => {
    openPanelWindow()
  })
}
