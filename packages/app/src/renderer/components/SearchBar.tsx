import { useEffect, useRef } from 'react'

interface Props {
  query: string
  onChange: (q: string) => void
  onBack?: () => void
  onSubmit?: () => void
  isSearching: boolean
  variant?: 'home' | 'compact'
}

export default function SearchBar({ query, onChange, onBack, onSubmit, isSearching, variant = 'compact' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const isHome = variant === 'home'

  return (
    <div className="flex items-center gap-2 w-full">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-none text-warm-muted hover:text-warm-text dark:text-dark-muted dark:hover:text-dark-text transition-colors"
          aria-label="Back to search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <div className={`relative flex-1 group ${isHome ? 'focus-within:shadow-md transition-shadow duration-150' : ''}`}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-faint dark:text-dark-muted">
          {isSearching ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30" strokeDashoffset="10"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) onSubmit?.()
          }}
          placeholder="Search my thinking…"
          className={[
            'w-full rounded-full outline-none',
            'bg-warm-surface dark:bg-dark-surface',
            'border border-warm-border dark:border-dark-border',
            'placeholder:text-warm-faint dark:placeholder:text-dark-muted',
            'text-warm-text dark:text-dark-text',
            'focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent-dark/30',
            isHome
              ? 'pl-10 pr-10 py-3 text-[15px] shadow-sm'
              : 'pl-9 pr-9 py-[7px] text-[13.5px]',
          ].join(' ')}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-faint hover:text-warm-muted dark:text-dark-muted dark:hover:text-dark-text"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
