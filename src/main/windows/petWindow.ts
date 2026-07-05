import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const PET_WIDTH = 260
// 比角色本体高不少，给情绪反应的气泡文案留出上方空间（不会被窗口边缘裁切）
const PET_HEIGHT = 300
const MARGIN = 40

export function createPetWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const petWindow = new BrowserWindow({
    width: PET_WIDTH,
    height: PET_HEIGHT,
    x: width - PET_WIDTH - MARGIN,
    y: height - PET_HEIGHT - MARGIN,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet/index.html'))
  }

  return petWindow
}
