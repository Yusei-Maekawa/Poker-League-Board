import { getCpuParticipant } from '../constants/cpuPlayers'
import type { Player } from '../types'

/** Firestore 保存用（Rules と一致させる） */
export const DELETED_PLAYER_NAME = '退会済み'

/** UI・Discord 等のプレーンテキスト表示（横棒） */
export const DELETED_PLAYER_DISPLAY_NAME = '—'

export const DELETED_PLAYER_ICON = '—'

export function isPlayerAccountDeleted(
  player: Pick<Player, 'deletedAt'> | null | undefined,
): boolean {
  return player?.deletedAt != null
}

export function isFormerMember(
  player: Pick<Player, 'name' | 'deletedAt'> | null | undefined,
): boolean {
  if (!player) return false
  return isPlayerAccountDeleted(player) || player.name === DELETED_PLAYER_NAME
}

/** 一覧・試合表示用。退会済み・BAN 時は横棒。playerId のみ渡した場合は CPU 名を解決 */
export function getPlayerDisplayName(
  player:
    | (Pick<Player, 'id' | 'name' | 'isActive' | 'deletedAt'> & { id?: string })
    | string
    | undefined,
): string {
  if (typeof player === 'string') {
    const cpu = getCpuParticipant(player)
    if (cpu) return cpu.name
    return '—'
  }
  if (!player) return '—'
  if (isFormerMember(player)) return DELETED_PLAYER_DISPLAY_NAME
  if (!player.isActive) return '—'
  return player.name
}
