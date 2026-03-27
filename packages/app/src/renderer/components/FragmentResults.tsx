import type { FragmentResult } from '@spool/core'
import ContinueActions from './ContinueActions.js'

interface Props {
  results: FragmentResult[]
  query: string
  onOpenSession: (uuid: string) => void
}

export default function FragmentResults({ results, query, onOpenSession }: Props) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2 pb-12">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-30">
          <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 22L28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-sm">No results for "{query}"</p>
        <p className="text-xs opacity-60">Try different keywords or run <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">spool sync</code></p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {results.map((result, i) => (
          <FragmentRow key={`${result.sessionUuid}-${i}`} result={result} onOpenSession={onOpenSession} />
        ))}
      </div>
    </div>
  )
}

function FragmentRow({ result, onOpenSession }: { result: FragmentResult; onOpenSession: (uuid: string) => void }) {
  const snippet = result.snippet.replace(/<mark>/g, '<strong>').replace(/<\/mark>/g, '</strong>')
  const date = formatDate(result.startedAt)
  const project = result.project.split('/').pop() ?? result.project

  return (
    <div className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      {/* Source + project + date */}
      <div className="flex items-center gap-2 mb-1.5">
        <SourceBadge source={result.source} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex-1">You discussed this · {project}</span>
        <span className="text-xs text-neutral-400 flex-none">{date}</span>
      </div>

      {/* Fragment snippet — monospace per DESIGN.md */}
      <p
        className="font-mono text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed [&>strong]:font-semibold [&>strong]:text-[#C85A00] dark:[&>strong]:text-[#F07020] select-text cursor-text"
        dangerouslySetInnerHTML={{ __html: snippet }}
      />

      {/* Session title (subtle) */}
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 truncate">
        {result.sessionTitle}
      </p>

      {/* Continue actions */}
      <ContinueActions result={result} onOpenSession={onOpenSession} />
    </div>
  )
}

function SourceBadge({ source }: { source: string }) {
  const isClaude = source === 'claude'
  // Source badge colors per DESIGN.md: Claude=#6B5B8A, Codex=#1A6B3C
  return (
    <span
      className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded text-white"
      style={{ background: isClaude ? '#6B5B8A' : '#1A6B3C' }}
    >
      {isClaude ? 'claude' : 'codex'}
    </span>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  } catch {
    return iso.slice(0, 10)
  }
}
