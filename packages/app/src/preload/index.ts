import { contextBridge, ipcRenderer } from 'electron'
import type { FragmentResult, Session, Message, StatusInfo, SyncResult } from '@spool/core'

export type SpoolAPI = typeof api

const api = {
  search: (query: string, limit?: number, source?: string): Promise<FragmentResult[]> =>
    ipcRenderer.invoke('spool:search', { query, limit, source }),

  listSessions: (limit?: number): Promise<Session[]> =>
    ipcRenderer.invoke('spool:list-sessions', { limit }),

  getSession: (sessionUuid: string): Promise<{ session: Session; messages: Message[] } | null> =>
    ipcRenderer.invoke('spool:get-session', { sessionUuid }),

  getStatus: (): Promise<StatusInfo> =>
    ipcRenderer.invoke('spool:get-status'),

  syncNow: (): Promise<SyncResult> =>
    ipcRenderer.invoke('spool:sync-now'),

  resumeCLI: (sessionUuid: string, source: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('spool:resume-cli', { sessionUuid, source }),

  copyFragment: (text: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('spool:copy-fragment', { text }),

  onSyncProgress: (cb: (e: { phase: string; count: number; total: number }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: unknown) => cb(data as { phase: string; count: number; total: number })
    ipcRenderer.on('spool:sync-progress', handler)
    return () => ipcRenderer.removeListener('spool:sync-progress', handler)
  },

  onNewSessions: (cb: (data: { count: number }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: unknown) => cb(data as { count: number })
    ipcRenderer.on('spool:new-sessions', handler)
    return () => ipcRenderer.removeListener('spool:new-sessions', handler)
  },
}

contextBridge.exposeInMainWorld('spool', api)

declare global {
  interface Window {
    spool: SpoolAPI
  }
}
