import { useMemo } from 'react'
import { useActivities } from '../../hooks/useActivities'
import { useGames } from '../../hooks/useGames'
import { useSeasons } from '../../hooks/useSeasons'
import { useActivityHub } from '../../context/ActivityHubContext'
import {
  countNewActivities,
  getActivityDisplayMeta,
  isActivityNew,
  resolveActivitySeasonLabel,
} from '../../utils/activityFeed'
import { getGameSeasonId } from '../../utils/season'

/** 直近1時間の新着があるときだけホームに表示する告知バナー */
export function ActivityHomeNotice() {
  const { openList } = useActivityHub()
  const { activities, loading } = useActivities()
  const { games } = useGames()
  const { seasons } = useSeasons()

  const newCount = useMemo(() => countNewActivities(activities), [activities])
  const latestNew = useMemo(
    () => activities.find(isActivityNew),
    [activities],
  )
  const preview = useMemo(() => {
    if (!latestNew) return null
    const linkedGame = games.find((g) => g.id === latestNew.gameId)
    const seasonLabel = resolveActivitySeasonLabel(
      latestNew,
      seasons,
      linkedGame ? getGameSeasonId(linkedGame) : null,
    )
    return getActivityDisplayMeta(latestNew, { seasonLabel })
  }, [latestNew, games, seasons])

  if (loading || newCount === 0) return null

  return (
    <button
      type="button"
      onClick={openList}
      className="card w-full text-left px-4 py-3.5 mb-6 border-gold-500/30
        hover:border-gold-500/45 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-full bg-gold-500/15 ring-1 ring-gold-500/30
            flex items-center justify-center text-lg shrink-0"
          aria-hidden
        >
          🕐
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-gold-300/95 text-sm font-semibold">
            新しい動きがあります
            {newCount > 1 && (
              <span className="text-white/50 font-normal ml-1.5">（{newCount}件）</span>
            )}
          </p>
          {preview?.title && (
            <p className="text-white/50 text-xs mt-1 truncate group-hover:text-white/60 transition-colors">
              {preview.title}
            </p>
          )}
        </div>
        <span className="text-gold-400/70 group-hover:text-gold-400 text-xs font-medium shrink-0">
          見る →
        </span>
      </div>
    </button>
  )
}
