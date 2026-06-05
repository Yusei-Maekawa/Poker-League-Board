import type { SeasonScope } from '../constants/seasons'
import type { Season } from '../types'
import { isSeasonShownInRanking } from '../utils/seasonRanking'
import {
  formatSeasonPeriodCompact,
  getSeasonPeriodPhase,
  getSeasonPeriodPhaseLabel,
  getUserSeasonHeadline,
} from '../utils/seasonPeriod'
import { SeasonScopeToggle } from './SeasonScopeToggle'

/** ホームヒーロー用 — いまのシーズンと期間 */
export function ActiveSeasonHero({ season }: { season: Season | undefined }) {
  if (!season) {
    return (
      <p className="text-gold-400/80 text-sm mt-1 font-medium tracking-wider">
        Season 1 進行中
      </p>
    )
  }

  const { main, period } = getUserSeasonHeadline(season)

  return (
    <div className="mt-1">
      <p className="text-gold-400/80 text-sm font-medium tracking-wider">{main}</p>
      {period ? (
        <p className="text-white/45 text-xs mt-1 font-mono">{period}</p>
      ) : (
        <p className="text-white/40 text-xs mt-1">シーズン期間は準備中です</p>
      )}
    </div>
  )
}

/** ランキング・個人詳細 — 切替 + 選択中の説明 */
export function SeasonScopeSection({
  seasons,
  value,
  onChange,
  className = '',
}: {
  seasons: Season[]
  value: SeasonScope
  onChange: (scope: SeasonScope) => void
  className?: string
}) {
  const selected = seasons.find((s) => s.id === value)

  return (
    <div className={className}>
      <SeasonScopeToggle seasons={seasons} value={value} onChange={onChange} />
      {selected ? <SeasonPeriodCaption season={selected} className="mt-2" /> : null}
    </div>
  )
}

export function SeasonPeriodCaption({
  season,
  className = '',
}: {
  season: Season
  className?: string
}) {
  const phase = getSeasonPeriodPhase(season)
  const period = formatSeasonPeriodCompact(season)

  return (
    <p className={`text-xs leading-relaxed ${className}`}>
      <SeasonPhaseBadge phase={phase} />
      {period ? (
        <span className="text-white/50 font-mono ml-1.5">{period}</span>
      ) : (
        <span className="text-white/40 ml-1.5">期間は準備中です</span>
      )}
    </p>
  )
}

export function SeasonPhaseBadge({
  phase,
}: {
  phase: ReturnType<typeof getSeasonPeriodPhase>
}) {
  const label = getSeasonPeriodPhaseLabel(phase)
  const style =
    phase === 'current'
      ? 'bg-gold-500/15 text-gold-300/90 border-gold-500/30'
      : phase === 'upcoming'
        ? 'bg-sky-500/15 text-sky-200/90 border-sky-500/30'
        : phase === 'ended'
          ? 'bg-white/5 text-white/45 border-white/10'
          : 'bg-white/5 text-white/40 border-white/10'

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${style}`}
    >
      {label}
    </span>
  )
}

/** ホーム — 全シーズンの日程一覧 */
export function SeasonsScheduleCard({ seasons }: { seasons: Season[] }) {
  if (seasons.length === 0) return null

  return (
    <section className="card px-4 py-4 mb-6">
      <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
        シーズン日程
      </h2>
      <ul className="space-y-3">
        {seasons.map((season) => {
          const phase = getSeasonPeriodPhase(season)
          const period = formatSeasonPeriodCompact(season)
          return (
            <li
              key={season.id}
              className="border-b border-white/[0.06] last:border-0 pb-3 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white font-medium text-sm">{season.label}</span>
                <SeasonPhaseBadge phase={phase} />
                {!isSeasonShownInRanking(season) && (
                  <span className="text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    ランキング非表示
                  </span>
                )}
              </div>
              <p className="text-white/45 text-xs mt-1 font-mono leading-relaxed">
                {period ?? '期間は準備中です'}
              </p>
            </li>
          )
        })}
      </ul>
      <p className="text-white/35 text-[10px] mt-3 leading-relaxed">
        試合の記録は、開催中のシーズンに自動で紐づきます。ランキングで公開されているシーズンは切り替えて確認できます。
      </p>
    </section>
  )
}
