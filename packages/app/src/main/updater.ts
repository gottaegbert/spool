import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

/**
 * Auto-updater for packaged (production) builds.
 *
 * - Only runs when app.isPackaged is true (skips `pnpm dev`)
 * - Checks GitHub Releases on startup (10s delay) then every 4 hours
 * - Downloads silently in background
 * - Notifies renderer when update is ready to install
 */

const CHECK_INTERVAL = 4 * 60 * 60 * 1000 // 4 hours

export function setupAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  if (!app.isPackaged) return

  // Don't auto-download — we'll trigger it after checking
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`[updater] Update available: ${info.version}`)
    getMainWindow()?.webContents.send('spool:update-status', {
      status: 'downloading',
      version: info.version,
    })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] No update available')
  })

  autoUpdater.on('download-progress', (progress) => {
    getMainWindow()?.webContents.send('spool:update-status', {
      status: 'downloading',
      percent: Math.round(progress.percent),
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[updater] Update downloaded: ${info.version}`)
    getMainWindow()?.webContents.send('spool:update-status', {
      status: 'ready',
      version: info.version,
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] Error:', err.message)
  })

  // First check after 10s delay
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Check failed:', err.message)
    })
  }, 10_000)

  // Periodic checks
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Periodic check failed:', err.message)
    })
  }, CHECK_INTERVAL)
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
