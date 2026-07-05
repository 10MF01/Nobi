import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let panelWindow: BrowserWindow | null = null

export function openPanelWindow(): void {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.show()
    panelWindow.focus()
    return
  }

  panelWindow = new BrowserWindow({
    width: 900,
    height: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  panelWindow.on('ready-to-show', () => panelWindow?.show())
  panelWindow.on('closed', () => {
    panelWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    panelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/panel/index.html`)
  } else {
    panelWindow.loadFile(join(__dirname, '../renderer/panel/index.html'))
  }
}
