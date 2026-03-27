import { useEffect, useState, useCallback, useRef, type MouseEvent } from 'react'
import type { FragmentResult, Session } from '@spool/core'
import SearchBar from './components/SearchBar.js'
import FragmentResults from './components/FragmentResults.js'
import RecentSessions from './components/RecentSessions.js'
import SessionDetail from './components/SessionDetail.js'
import StatusBar from './components/StatusBar.js'

type View = 'search' | 'session'

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FragmentResult[]>([])
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [view, setView] = useState<View>('search')
  const [isSearching, setIsSearching] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ phase: string; count: number; total: number } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragState = useRef<{ lastX: number; lastY: number } | null>(null)

  // Load recent sessions on mount
  useEffect(() => {
    window.spool.listSessions(30).then(setRecentSessions).catch(console.error)
  }, [])

  // Subscribe to sync progress and new sessions
  useEffect(() => {
    const offProgress = window.spool.onSyncProgress((e) => {
      setSyncStatus(e)
      if (e.phase === 'done') {
        setTimeout(() => setSyncStatus(null), 3000)
        // Refresh recent sessions
        window.spool.listSessions(30).then(setRecentSessions).catch(console.error)
        // Re-run search if active
        if (query.trim()) doSearch(query)
      }
    })
    const offNew = window.spool.onNewSessions(() => {
      window.spool.listSessions(30).then(setRecentSessions).catch(console.error)
      if (query.trim()) doSearch(query)
    })
    return () => { offProgress(); offNew() }
  }, [query])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const res = await window.spool.search(q, 20)
      setResults(res)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(q), 200)
  }, [doSearch])

  const handleOpenSession = useCallback((uuid: string) => {
    setSelectedSession(uuid)
    setView('session')
  }, [])

  const handleBack = useCallback(() => {
    setView('search')
    setSelectedSession(null)
  }, [])

  // Custom window drag — replaces -webkit-app-region:drag which breaks when
  // a scrollable child container has been scrolled (known Electron/Chromium bug).
  const handleHeaderMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea')) return
    dragState.current = { lastX: e.screenX, lastY: e.screenY }
  }, [])

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      if (!dragState.current) return
      const dx = e.screenX - dragState.current.lastX
      const dy = e.screenY - dragState.current.lastY
      dragState.current.lastX = e.screenX
      dragState.current.lastY = e.screenY
      window.spool.moveWindow(dx, dy)
    }
    const onUp = () => { dragState.current = null }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      {/* Keep a dedicated drag strip above the search UI so list scrolling can never
          cover the title-bar hit target. */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="flex-none h-10 shrink-0 relative z-20"
      />

      <div className="flex-none px-4 pb-3 relative z-10">
        <SearchBar
          query={query}
          onChange={handleQueryChange}
          onBack={view === 'session' ? handleBack : undefined}
          isSearching={isSearching}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'session' && selectedSession ? (
          <SessionDetail sessionUuid={selectedSession} />
        ) : query.trim() ? (
          <FragmentResults
            results={results}
            query={query}
            onOpenSession={handleOpenSession}
          />
        ) : (
          <RecentSessions
            sessions={recentSessions}
            onOpenSession={handleOpenSession}
          />
        )}
      </div>

      {/* Status bar */}
      <StatusBar syncStatus={syncStatus} />
    </div>
  )
}
