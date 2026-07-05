import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IPC_CHANNELS } from '../../../shared/ipcChannels'
import { getAppSettings } from '../store/repositories/settingsRepo'

export const PET_BASE_WIDTH = 260
// 比角色本体高不少，给情绪反应的气泡文案留出上方空间（不会被窗口边缘裁切）
export const PET_BASE_HEIGHT = 300
const MARGIN = 40

/** 按缩放比例算窗口尺寸，右下角 margin 保持不变（窗口从右下角"长大/缩小"，不会跑出锚点） */
function boundsForScale(scale: number): { width: number; height: number; x: number; y: number } {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  const width = Math.round(PET_BASE_WIDTH * scale)
  const height = Math.round(PET_BASE_HEIGHT * scale)
  return {
    width,
    height,
    x: screenWidth - width - MARGIN,
    y: screenHeight - height - MARGIN
  }
}

export function createPetWindow(): BrowserWindow {
  const { petScale, petOpacity } = getAppSettings()
  const bounds = boundsForScale(petScale)

  const petWindow = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    opacity: petOpacity,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 'screen-saver' level keeps のびちゃん above fullscreen apps too.
  petWindow.setAlwaysOnTop(true, 'screen-saver')
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  petWindow.on('ready-to-show', () => petWindow.show())

  // renderer 里角色本体的容器大小是按 scale 算的，初次加载完也要推一次，不然会用默认 100% 大小渲染
  petWindow.webContents.once('did-finish-load', () => {
    petWindow.webContents.send(IPC_CHANNELS.PET_APPEARANCE, { scale: petScale })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet/index.html'))
  }

  return petWindow
}

/** 面板保存外观设置后调用：重设窗口大小/位置/整体透明度，并通知 renderer 同步缩放角色容器 */
export function applyPetAppearance(
  petWindow: BrowserWindow,
  settings: { petScale: number; petOpacity: number }
): void {
  petWindow.setBounds(boundsForScale(settings.petScale))
  petWindow.setOpacity(settings.petOpacity)
  petWindow.webContents.send(IPC_CHANNELS.PET_APPEARANCE, { scale: settings.petScale })
}
