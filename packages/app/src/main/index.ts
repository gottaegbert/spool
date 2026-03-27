import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'node:path'
import { getDB, Syncer, SpoolWatcher, searchFragments, listRecentSessions, getSessionWithMessages, getStatus } from '@spool/core'
import { setupTray } from './tray.js'
import { execSync } from 'node:child_process'
import type Database from 'better-sqlite3'

let mainWindow: BrowserWindow | null = null
let db: Database.Database
let syncer: Syncer
let watcher: SpoolWatcher

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 860,
    height: 620,
    minWidth: 640,
    minHeight: 480,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a1a' : '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['VITE_DEV_SERVER_URL']) {
    win.loadURL(process.env['VITE_DEV_SERVER_URL'])
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  db = getDB()
  syncer = new Syncer(db, (e) => {
    mainWindow?.webContents.send('spool:sync-progress', e)
  })
  watcher = new SpoolWatcher(syncer)
  watcher.on('new-sessions', (_event, data) => {
    mainWindow?.webContents.send('spool:new-sessions', data)
  })

  // Initial sync in background
  setImmediate(() => {
    syncer.syncAll()
    watcher.start()
  })

  mainWindow = createWindow()

  // Background mode — hide from dock when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
    app.dock?.hide()
  })

  setupTray(() => {
    if (mainWindow) {
      mainWindow.show()
      app.dock?.show()
    } else {
      mainWindow = createWindow()
      app.dock?.show()
    }
  }, () => {
    syncer.syncAll()
  })

  app.on('activate', () => {
    if (!mainWindow) {
      mainWindow = createWindow()
      app.dock?.show()
    } else {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', (e) => {
  // On macOS, keep app running in tray
  e.preventDefault()
  app.dock?.hide()
})

// ── IPC Handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('spool:search', (_e, { query, limit = 10, source }: { query: string; limit?: number; source?: string }) => {
  const src = source === 'claude' || source === 'codex' ? source : undefined
  return searchFragments(db, query, { limit, ...(src !== undefined && { source: src }) })
})

ipcMain.handle('spool:list-sessions', (_e, { limit = 50 }: { limit?: number } = {}) => {
  return listRecentSessions(db, limit)
})

ipcMain.handle('spool:get-session', (_e, { sessionUuid }: { sessionUuid: string }) => {
  return getSessionWithMessages(db, sessionUuid)
})

ipcMain.handle('spool:get-status', () => {
  return getStatus(db)
})

ipcMain.handle('spool:sync-now', () => {
  return syncer.syncAll()
})

ipcMain.handle('spool:resume-cli', (_e, { sessionUuid, source }: { sessionUuid: string; source: string }) => {
  try {
    if (source === 'claude') {
      // Open Terminal and run claude --resume <uuid>
      const script = `tell application "Terminal" to do script "claude --resume ${sessionUuid}"`
      execSync(`osascript -e '${script}'`)
    } else {
      // Codex doesn't support --resume yet; open a new session in the project
      const script = `tell application "Terminal" to activate`
      execSync(`osascript -e '${script}'`)
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('spool:copy-fragment', (_e, { text }: { text: string }) => {
  const { clipboard } = require('electron')
  clipboard.writeText(text)
  return { ok: true }
})

ipcMain.on('spool:move-window', (_e, { dx, dy }: { dx: number; dy: number }) => {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  mainWindow.setPosition(x + dx, y + dy)
})
