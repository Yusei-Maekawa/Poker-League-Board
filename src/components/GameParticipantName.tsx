import { PlayerNameDisplay } from './FormerMemberDisplay'
import { isCpuPlayerId } from '../constants/cpuPlayers'
import type { Player } from '../types'
import { resolveParticipant } from '../utils/gameParticipant'

type GameParticipantNameProps = {
  playerId: string
  players: Player[]
  className?: string
  nameClassName?: string
  size?: 'sm' | 'md'
  linkTo?: string
}

/** 試合結果行の参加者名（人間・CPU・退会済み） */
export function GameParticipantName({
  playerId,
  players,
  className = '',
  nameClassName = 'text-white/80 text-sm',
  size = 'sm',
  linkTo,
}: GameParticipantNameProps) {
  if (isCpuPlayerId(playerId)) {
    const cpu = resolveParticipant(playerId, players)
    if (!cpu) {
      return <span className={`text-white/40 ${nameClassName}`}>—</span>
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${nameClassName} ${className}`}
        title="CPU 参加者"
      >
        <span aria-hidden>{cpu.icon}</span>
        <span>{cpu.name}</span>
      </span>
    )
  }

  const player = players.find((p) => p.id === playerId)
  return (
    <PlayerNameDisplay
      player={player}
      className={className}
      nameClassName={nameClassName}
      size={size}
      linkTo={linkTo}
    />
  )
}
