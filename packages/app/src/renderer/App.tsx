import { useEffect, useState, useCallback, useRef } from 'react'
import type { FragmentResult, StatusInfo } from '@spool/core'
import SearchBar from './components/SearchBar.js'
import FragmentResults from './components/FragmentResults.js'
import HomeView from './components/HomeView.js'
import SessionDetail from './components/SessionDetail.js'
import StatusBar from './components/StatusBar.js'

type View = 'search' | 'session'

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FragmentResult[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [view, setView] = useState<View>('search')
  const [homeMode, setHomeMode] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ phase: string; count: number; total: number } | null>(null)
  const [status, setStatus] = useState<StatusInfo | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHomeMode = homeMode && view === 'search' && !selectedSession

  useEffect(() => {
    if (!window.spool) return
    window.spool.getStatus().then(setStatus).catch(console.error)
  }, [syncStatus])

  useEffect(() => {
    if (!window.spool) return () => {}
    const offProgress = window.spool.onSyncProgress((e) => {
      setSyncStatus(e)
      if (e.phase === 'done') {
        setTimeout(() => setSyncStatus(null), 3000)
        window.spool.getStatus().then(setStatus).catch(console.error)
        if (query.trim()) doSearch(query)
      }
    })
    const offNew = window.spool.onNewSessions(() => {
      window.spool.getStatus().then(setStatus).catch(console.error)
      if (query.trim()) doSearch(query)
    })
    return () => { offProgress(); offNew() }
  }, [query])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setIsSearching(false); return }
    setIsSearching(true)
    try {
      const res = window.spool ? await window.spool.search(q, 20) : []
      setResults(res)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    if (!q.trim()) setHomeMode(true)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(q), 200)
  }, [doSearch])

  const handleSubmit = useCallback(() => {
    if (query.trim()) setHomeMode(false)
  }, [query])

  const handleSelectSuggestion = useCallback((uuid: string) => {
    setHomeMode(false)
    setSelectedSession(uuid)
    setView('session')
  }, [])

  const handleOpenSession = useCallback((uuid: string) => {
    setSelectedSession(uuid); setView('session')
  }, [])

  const handleBack = useCallback(() => {
    setView('search'); setSelectedSession(null)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-warm-bg dark:bg-dark-bg text-warm-text dark:text-dark-text">
      <div className="flex flex-col flex-1 min-h-0">
        {isHomeMode ? (
          <HomeView
            query={query}
            onChange={handleQueryChange}
            onSubmit={handleSubmit}
            onSelectSuggestion={handleSelectSuggestion}
            suggestions={results}
            isSearching={isSearching}
            claudeCount={status?.claudeSessions ?? null}
            codexCount={status?.codexSessions ?? null}
          />
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 h-10 flex-none mt-2">
              <span className="text-base font-bold tracking-[-0.04em] flex-none select-none">
                S<span className="text-accent">.</span>
              </span>
              <SearchBar
                query={query}
                onChange={handleQueryChange}
                {...(view === 'session' ? { onBack: handleBack } : {})}
                isSearching={isSearching}
                variant="compact"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {view === 'session' && selectedSession
                ? <SessionDetail sessionUuid={selectedSession} />
                : <FragmentResults results={results} query={query} onOpenSession={handleOpenSession} />
              }
            </div>
          </>
        )}
      </div>

      <StatusBar syncStatus={syncStatus} />
    </div>
  )
}
