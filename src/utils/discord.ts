import { isCpuPlayerId } from '../constants/cpuPlayers'
import type { Game, Player, Result } from '../types'
import { formatGameDateTime } from './formatDateTime'
import { formatGameParticipantCount, resolveParticipant } from './gameParticipant'

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function formatDiscordResultLine(r: Result, players: Player[]): string {
  const emoji = RANK_EMOJI[r.rank] ?? `${r.rank}位`
  const name = resolveParticipant(r.playerId, players)?.name ?? '—'
  if (isCpuPlayerId(r.playerId)) {
    return `${emoji}  ${name}`
  }
  const pointStr = r.point >= 0 ? `+${r.point}pt` : `${r.point}pt`
  return `${emoji}  ${name}  ${pointStr}`
}

/**
 * Discord 共有文を生成する
 */
export function buildDiscordMessage(
  game: Game,
  results: Result[],
  players: Player[],
): string {
  const sorted = [...results].sort((a, b) => a.rank - b.rank)
  const participantLabel = formatGameParticipantCount(sorted)

  const lines: string[] = [
    `🃏 **ポーカーリーグ 第${game.gameNo}戦 結果** 🃏`,
    `📅 ${formatGameDateTime(game.date, game.time)}  ·  🎮 ${game.appName}  ·  👥 ${participantLabel}`,
    '',
    '```',
    ...sorted.map((r) => formatDiscordResultLine(r, players)),
    '```',
  ]

  if (game.memo.trim()) {
    lines.push('', `📝 ${game.memo.trim()}`)
  }

  return lines.join('\n')
}
