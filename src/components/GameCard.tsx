import { Link } from 'react-router-dom'
import type { Game, Result, Player } from '../types'
import { GameParticipantName } from './GameParticipantName'
import { isCpuPlayerId } from '../constants/cpuPlayers'
import { formatGameParticipantCount } from '../utils/gameParticipant'
import { formatGameDateTime } from '../utils/formatDateTime'

interface GameCardProps {
  game: Game
  results: Result[]
  players: Player[]
  seasonLabel?: string
  compact?: boolean
}

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function GameCard({
  game,
  results,
  players,
  seasonLabel,
  compact = false,
}: GameCardProps) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank)
  const participantLabel = formatGameParticipantCount(results)

  const winner = sorted.find((r) => r.rank === 1)
  const top3 = sorted.slice(0, 3)

  const formattedDate = formatGameDateTime(game.date, game.time)

  if (compact) {
    return (
      <Link
        to={`/games/${game.id}`}
        className="card px-4 py-3 block hover:border-white/15 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/40 text-xs font-mono">#{game.gameNo}</span>
              {seasonLabel && (
                <span className="text-gold-400/55 text-xs truncate">{seasonLabel}</span>
              )}
            </div>
            <p className="text-white font-medium text-sm mt-0.5">{formattedDate}</p>
            <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1.5">
              <span>🥇</span>
              {winner ? (
                <GameParticipantName
                  playerId={winner.playerId}
                  players={players}
                  nameClassName="text-white/80 text-xs"
                />
              ) : (
                <span>—</span>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white/30 text-xs">{game.appName}</p>
            <p className="text-white/40 text-xs mt-1">{participantLabel}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="card px-4 py-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/30 text-xs font-mono">第{game.gameNo}戦</span>
            {seasonLabel && (
              <>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-gold-400/55 text-xs">{seasonLabel}</span>
              </>
            )}
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/50 text-xs">{game.appName}</span>
          </div>
          <p className="text-white font-semibold mt-0.5">{formattedDate}</p>
        </div>
        <span className="text-white/30 text-xs bg-white/5 px-2 py-1 rounded-full shrink-0 text-right leading-snug max-w-[9rem]">
          {participantLabel}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {top3.map((r) => {
          const pointStr = r.point >= 0 ? `+${r.point}pt` : `${r.point}pt`
          const cpu = isCpuPlayerId(r.playerId)
          return (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-5 text-sm">{RANK_EMOJI[r.rank]}</span>
              <span className="text-sm flex-1 min-w-0">
                <GameParticipantName
                  playerId={r.playerId}
                  players={players}
                  nameClassName={
                    cpu ? 'text-white/65 text-sm' : 'text-white/80 text-sm'
                  }
                />
              </span>
              {!cpu && (
                <span
                  className={`font-mono text-xs ${r.point >= 0 ? 'text-gold-400/70' : 'text-red-400/70'}`}
                >
                  {pointStr}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {game.memo && (
        <p className="text-white/35 text-xs border-t border-white/6 pt-2 mb-3 line-clamp-2">
          📝 {game.memo}
        </p>
      )}

      <Link
        to={`/games/${game.id}`}
        className="text-gold-400/70 hover:text-gold-400 text-xs font-medium transition-colors"
      >
        詳細を見る →
      </Link>
    </div>
  )
}
