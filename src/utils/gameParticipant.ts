import { getCpuParticipant, isCpuPlayerId } from '../constants/cpuPlayers'
import type { Player, Result } from '../types'
import { getPlayerDisplayName } from './playerAccount'

export type ParticipantDisplay = {
  id: string
  name: string
  icon: string
}

export function resolveParticipant(
  playerId: string,
  players: Player[],
): ParticipantDisplay | null {
  const cpu = getCpuParticipant(playerId)
  if (cpu) return { id: cpu.id, name: cpu.name, icon: cpu.icon }

  const player = players.find((p) => p.id === playerId)
  if (!player) return null

  return {
    id: player.id,
    name: getPlayerDisplayName(player),
    icon: player.icon || player.name.slice(0, 2),
  }
}

export function countGameParticipants(
  results: Pick<Result, 'playerId'>[],
): { human: number; cpu: number; total: number } {
  let human = 0
  let cpu = 0
  for (const r of results) {
    if (isCpuPlayerId(r.playerId)) cpu += 1
    else human += 1
  }
  return { human, cpu, total: results.length }
}

/** 例: 3人(＋CPU3人) / 5人参加（CPUなし） */
export function formatGameParticipantCount(
  results: Pick<Result, 'playerId'>[],
): string {
  const { human, cpu } = countGameParticipants(results)
  if (results.length === 0) return '0人参加'
  if (cpu === 0) return `${human}人参加`
  if (human === 0) return `CPU${cpu}人`
  return `${human}人(＋CPU${cpu}人)`
}
