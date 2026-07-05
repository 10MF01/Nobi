import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createPetWindow } from './windows/petWindow'
import { registerIpcHandlers } from './ipc/handlers'
import { createTray } from './tray'
import { rescheduleReminders } from './scheduler/reminderScheduler'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.nobi.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Nobi is a tray-resident app with no dock-worthy main window.
  if (process.platform === 'darwin') {
    app.dock?.hide()
  }

  const petWindow = createPetWindow()
  registerIpcHandlers(petWindow)
  createTray()
  rescheduleReminders(petWindow)
})

// Subscribing with an empty handler overrides Electron's default quit-on-close behavior;
// のびちゃん lives in the tray permanently — only the tray "退出 Nobi" item quits the app.
app.on('window-all-closed', () => {})
