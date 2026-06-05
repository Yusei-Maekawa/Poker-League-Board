import { Link } from 'react-router-dom'
import type { RankingStat } from '../types'
import { formatWinRate } from '../utils/playerStats'
import { formatPoint } from '../utils/ranking'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_COLORS: Record<number, string> = {
  1: 'text-gold-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
}

interface RankingCardProps {
  stat: RankingStat
  rank: number
  compact?: boolean
  /** 通算成績（参考）— pt を主役にせず複数指標を表示 */
  allTimeReference?: boolean
}

export function RankingCard({
  stat,
  rank,
  compact = false,
  allTimeReference = false,
}: RankingCardProps) {
  const medal = MEDAL[rank]
  const rankColor = RANK_COLORS[rank] ?? 'text-white/60'

  if (allTimeReference) {
    return (
      <div className={`card px-4 py-4 ${rank <= 3 ? 'border-gold-600/20' : ''}`}>
        <div className="flex items-start gap-3">
          <div
            className={`w-9 text-center font-mono font-bold text-xl flex-shrink-0 pt-0.5 ${rankColor}`}
          >
            {medal ?? `${rank}`}
          </div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
              rank === 1 ? 'bg-gold-500/20 ring-1 ring-gold-500/50' : 'bg-white/10'
            }`}
          >
            {stat.player.icon}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/players/${stat.player.id}`}
              className="font-semibold text-white text-base truncate block hover:text-gold-300 transition-colors"
            >
              {stat.player.name}
            </Link>
            <dl className="mt-2 space-y-1 text-sm">
              <MetricRow
                label="通算pt（参考）"
                value={`${formatPoint(stat.totalPoint)}pt`}
                valueClass={
                  stat.totalPoint >= 0 ? 'text-gold-400/90' : 'text-red-400/90'
                }
              />
              <MetricRow label="参加" value={`${stat.playCount}戦`} />
              <MetricRow label="優勝" value={`${stat.winCount}回`} />
              <MetricRow
                label="優勝率"
                value={formatWinRate(stat.winCount, stat.playCount)}
              />
              <MetricRow label="入賞率" value={`${stat.podiumRate}%`} />
              <MetricRow
                label="平均順位"
                value={stat.playCount > 0 ? `${stat.avgRank}位` : '—'}
              />
              <MetricRow
                label="平均参加人数"
                value={stat.playCount > 0 ? `${stat.avgTableSize}人` : '—'}
              />
            </dl>
            <Link
              to={`/players/${stat.player.id}/all-time`}
              className="inline-block mt-2 text-gold-400/70 hover:text-gold-300 text-xs font-medium"
            >
              通算の個人詳細 →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pointSign = stat.totalPoint >= 0 ? '+' : ''

  if (compact) {
    return (
      <div className="card px-4 py-3 flex items-center gap-3">
        <div className={`w-8 text-center font-mono font-bold text-lg ${rankColor}`}>
          {medal ?? `${rank}`}
        </div>
        <div
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center
                     text-base font-bold flex-shrink-0"
        >
          {stat.player.icon}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/players/${stat.player.id}`}
            className="font-semibold text-white truncate block hover:text-gold-300 transition-colors"
          >
            {stat.player.name}
          </Link>
          <p className="text-white/40 text-xs">{stat.playCount}試合</p>
        </div>
        <div className="text-right">
          <p
            className={`font-mono font-bold text-lg ${stat.totalPoint >= 0 ? 'text-gold-400' : 'text-red-400'}`}
          >
            {pointSign}
            {stat.totalPoint}
          </p>
          <p className="text-white/40 text-xs">pt</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card px-4 py-4 ${rank <= 3 ? 'border-gold-600/20' : ''}`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-9 text-center font-mono font-bold text-xl flex-shrink-0 ${rankColor}`}
        >
          {medal ?? `${rank}`}
        </div>

        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                      flex-shrink-0 ${rank === 1 ? 'bg-gold-500/20 ring-1 ring-gold-500/50' : 'bg-white/10'}`}
        >
          {stat.player.icon}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            to={`/players/${stat.player.id}`}
            className="font-semibold text-white text-base truncate block hover:text-gold-300 transition-colors"
          >
            {stat.player.name}
          </Link>
          <p className="text-white/40 text-xs mt-0.5">
            {stat.playCount}試合 · 優勝{stat.winCount} · 入賞率{stat.podiumRate}%
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p
            className={`font-mono font-bold text-2xl ${stat.totalPoint >= 0 ? 'text-gold-400' : 'text-red-400'}`}
          >
            {pointSign}
            {stat.totalPoint}
          </p>
          <p className="text-white/30 text-xs">pt</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/6">
        <Stat label="平均順位" value={`${stat.avgRank}`} />
        <Stat label="3位以内" value={`${stat.podiumCount}回`} />
        <Stat label="最下位" value={`${stat.lastPlaceCount}回`} className="col-span-2 sm:col-span-1" />
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  valueClass = 'text-white/85',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <dt className="text-white/45 shrink-0">{label}</dt>
      <dd className={`font-mono font-medium text-right ${valueClass}`}>{value}</dd>
    </div>
  )
}

function Stat({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-white/80 text-sm font-mono font-medium">{value}</p>
      <p className="text-white/35 text-xs mt-0.5">{label}</p>
    </div>
  )
}
