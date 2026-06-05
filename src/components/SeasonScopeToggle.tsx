import type { ReactNode } from 'react'
import type { SeasonScope } from '../constants/seasons'
import type { Season } from '../types'

interface SeasonScopeToggleProps {
  seasons: Season[]
  value: SeasonScope
  onChange: (scope: SeasonScope) => void
  className?: string
}

/** シーズン切替のみ（通算は別画面） */
export function SeasonScopeToggle({
  seasons,
  value,
  onChange,
  className = '',
}: SeasonScopeToggleProps) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="tablist"
      aria-label="シーズン"
    >
      {seasons.map((season) => (
        <ScopeButton
          key={season.id}
          active={value === season.id}
          onClick={() => onChange(season.id)}
        >
          {season.label}
        </ScopeButton>
      ))}
    </div>
  )
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
          : 'bg-white/5 text-white/55 border border-white/10 hover:bg-white/10 hover:text-white/75'
      }`}
    >
      {children}
    </button>
  )
}
