import { Link } from 'react-router-dom'
import type { Activity } from '../../types'
import {
  getActivityDisplayMeta,
  getActivityTypeLabel,
  isActivityNew,
} from '../../utils/activityFeed'

export function resolveActivityLink(
  activity: Activity,
  gamesExist: (gameId: string) => boolean,
): string | null {
  if (
    activity.type === 'game_added' &&
    activity.gameId &&
    gamesExist(activity.gameId)
  ) {
    return `/games/${activity.gameId}`
  }
  if (activity.type === 'member_joined' && activity.playerId) {
    return `/players/${activity.playerId}`
  }
  return null
}

export function isActivityMuted(
  activity: Activity,
  gamesExist: (gameId: string) => boolean,
): boolean {
  return (
    activity.type === 'game_added' &&
    !!activity.gameId &&
    !gamesExist(activity.gameId)
  )
}

type ActivityListContentProps = {
  activities: Activity[]
  gamesExist: (gameId: string) => boolean
  /** モーダル内でリンクタップ時に閉じる */
  onNavigate?: () => void
  compact?: boolean
}

export function ActivityListContent({
  activities,
  gamesExist,
  onNavigate,
  compact = false,
}: ActivityListContentProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 px-2">
        <p className="text-white/40 text-sm">アクティビティはまだありません</p>
        <p className="text-white/35 text-xs mt-2 leading-relaxed">
          メンバー参加や試合結果の追加がここに表示されます
        </p>
      </div>
    )
  }

  return (
    <ul className={compact ? 'space-y-1' : 'space-y-2'}>
      {activities.map((activity) => {
        const linkTo = resolveActivityLink(activity, gamesExist)
        const muted = isActivityMuted(activity, gamesExist)
        return (
          <li key={activity.id}>
            <ActivityListRow
              activity={activity}
              linkTo={linkTo}
              muted={muted}
              compact={compact}
              onNavigate={onNavigate}
            />
          </li>
        )
      })}
    </ul>
  )
}

function ActivityListRow({
  activity,
  linkTo,
  muted,
  compact,
  onNavigate,
}: {
  activity: Activity
  linkTo: string | null
  muted: boolean
  compact: boolean
  onNavigate?: () => void
}) {
  const meta = getActivityDisplayMeta(activity)
  const isNew = isActivityNew(activity)
  const typeLabel = getActivityTypeLabel(activity.type)

  const row = (
    <div
      className={`flex gap-3 items-start ${
        compact ? 'px-3 py-2.5 rounded-lg bg-white/[0.03]' : 'px-4 py-3'
      } ${linkTo ? 'hover:bg-white/[0.04] transition-colors' : ''}`}
    >
      <span
        className={`shrink-0 flex items-center justify-center rounded-full ${
          compact ? 'w-8 h-8 text-base' : 'w-9 h-9 text-lg'
        } ${isNew ? 'bg-gold-500/15 ring-1 ring-gold-500/25' : 'bg-white/[0.06]'}`}
        aria-hidden
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">
            {typeLabel}
          </span>
          {isNew && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gold-500/25 text-gold-300 border border-gold-500/35">
              NEW
            </span>
          )}
        </div>
        <p
          className={`text-sm leading-snug ${
            muted ? 'text-white/50' : 'text-white/85 font-medium'
          }`}
        >
          {meta.title}
          {muted && (
            <span className="text-white/35 text-xs font-normal ml-1">
              （削除された試合）
            </span>
          )}
        </p>
        {meta.timeLabel && (
          <p className="text-white/40 text-xs mt-1 leading-relaxed">{meta.timeLabel}</p>
        )}
      </div>
      {linkTo && (
        <span className="text-gold-400/45 text-xs shrink-0 self-center" aria-hidden>
          →
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="block group" onClick={onNavigate}>
        {row}
      </Link>
    )
  }

  return row
}
