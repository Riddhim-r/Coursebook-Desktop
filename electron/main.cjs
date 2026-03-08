const path = require('node:path')
const { app, BrowserWindow } = require('electron')
const { ensureDatabase } = require('./db.cjs')
const { registerIpcHandlers } = require('./ipc.cjs')

const isDev = !app.isPackaged

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#efc8d5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    await window.loadURL('http://localhost:5173')
    window.webContents.openDevTools({ mode: 'detach' })
    return
  }

  await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(async () => {
  ensureDatabase()
  registerIpcHandlers()
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
