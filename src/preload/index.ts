import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../../shared/ipcChannels'
import type { PetReactionPayload } from '../../shared/types'

// Custom APIs for renderer
const api = {
  pet: {
    dragStart: (): void => ipcRenderer.send(IPC_CHANNELS.PET_DRAG_START),
    dragMove: (dx: number, dy: number): void =>
      ipcRenderer.send(IPC_CHANNELS.PET_DRAG_MOVE, { dx, dy }),
    click: (): void => ipcRenderer.send(IPC_CHANNELS.PET_CLICK),
    onReaction: (callback: (payload: PetReactionPayload) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: PetReactionPayload): void =>
        callback(payload)
      ipcRenderer.on(IPC_CHANNELS.PET_REACTION, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_REACTION, listener)
    }
  },
  panel: {
    open: (): void => ipcRenderer.send(IPC_CHANNELS.PANEL_OPEN),
    testReaction: (payload: PetReactionPayload): void =>
      ipcRenderer.send(IPC_CHANNELS.PANEL_TEST_REACTION, payload)
  }
}

export type Api = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
