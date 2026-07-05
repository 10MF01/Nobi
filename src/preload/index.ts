import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../../shared/ipcChannels'
import type { CheckIn, PetReactionPayload, Plan, PlanInput } from '../../shared/types'

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
  },
  plans: {
    list: (): Promise<Plan[]> => ipcRenderer.invoke(IPC_CHANNELS.PLANS_LIST),
    create: (input: PlanInput): Promise<Plan> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLANS_CREATE, input),
    update: (id: number, input: Partial<PlanInput>): Promise<Plan> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLANS_UPDATE, id, input),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.PLANS_DELETE, id),
    setDone: (id: number, isDone: boolean): Promise<Plan> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLANS_SET_DONE, id, isDone)
  },
  checkIns: {
    listForDate: (date: string): Promise<CheckIn[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHECKINS_LIST_FOR_DATE, date),
    toggle: (planId: number, date: string): Promise<CheckIn | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHECKINS_TOGGLE, planId, date)
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
