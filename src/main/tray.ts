import { Tray, Menu, app, nativeImage } from 'electron'
import icon from '../../resources/icon.png?asset'
import { openPanelWindow } from './windows/panelWindow'

let tray: Tray | null = null

// TODO(M6): swap for a real Nobi/のびちゃん brand icon once art assets exist.
export function createTray(): Tray {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Nobi - のびちゃん')

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开设置面板', click: () => openPanelWindow() },
    { type: 'separator' },
    { label: '退出 Nobi', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  return tray
}
