import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ActivityListContent } from '../components/home/ActivityListContent'
import { useActivities } from '../hooks/useActivities'
import { useGames } from '../hooks/useGames'
import { useSeasons } from '../hooks/useSeasons'
import { countNewActivities } from '../utils/activityFeed'

type ActivityHubContextValue = {
  openList: () => void
  newCount: number
  loading: boolean
}

const ActivityHubContext = createContext<ActivityHubContextValue | null>(null)

export function ActivityHubProvider({ children }: { children: ReactNode }) {
  const [listOpen, setListOpen] = useState(false)
  const { activities, loading } = useActivities()
  const { games } = useGames()
  const { seasons } = useSeasons()

  const gamesExist = useCallback(
    (gameId: string) => games.some((g) => g.id === gameId),
    [games],
  )

  const newCount = useMemo(() => countNewActivities(activities), [activities])

  const openList = useCallback(() => setListOpen(true), [])
  const closeList = useCallback(() => setListOpen(false), [])

  const value = useMemo(
    () => ({ openList, newCount, loading }),
    [openList, newCount, loading],
  )

  const visible = activities.slice(0, 15)

  return (
    <ActivityHubContext.Provider value={value}>
      {children}
      {listOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] grid place-items-center p-4 sm:p-6 bg-black/65"
            style={{ minHeight: '100dvh' }}
            onClick={closeList}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-modal-title"
              className="relative card w-full max-w-md border border-white/10 shadow-xl
                max-h-[min(85dvh,640px)] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeList}
                className="absolute top-3 right-3 z-10 flex items-center justify-center
                  w-9 h-9 rounded-full bg-white/10 border border-white/15
                  text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="閉じる"
              >
                <span className="text-xl leading-none font-light" aria-hidden>
                  ×
                </span>
              </button>

              <div className="shrink-0 px-5 pt-5 pb-4 pr-14 border-b border-white/[0.06]">
                <h2
                  id="activity-modal-title"
                  className="font-display font-bold text-lg text-white leading-snug"
                >
                  🕐 アクティビティ
                </h2>
                <p className="text-white/45 text-xs mt-1">
                  メンバー参加・試合結果の追加
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                {loading ? (
                  <p className="text-white/40 text-sm text-center py-8">読み込み中...</p>
                ) : (
                  <ActivityListContent
                    activities={visible}
                    gamesExist={gamesExist}
                    seasons={seasons}
                    games={games}
                    onNavigate={closeList}
                    compact
                  />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ActivityHubContext.Provider>
  )
}

export function useActivityHub(): ActivityHubContextValue {
  const ctx = useContext(ActivityHubContext)
  if (!ctx) {
    throw new Error('useActivityHub must be used within ActivityHubProvider')
  }
  return ctx
}
