import { GAME_LIMITS } from './validationLimits'
import { getGameSeasonId } from './season'
import type { Game } from '../types'

export function suggestNextGameNo(
  games: Pick<Game, 'gameNo' | 'seasonId'>[],
  seasonId: string,
): number {
  let maxNo = 0
  for (const game of games) {
    if (getGameSeasonId(game) !== seasonId) continue
    if (game.gameNo > maxNo) maxNo = game.gameNo
  }
  return maxNo + 1
}

export function validateGameNo(
  gameNo: number,
  games: Pick<Game, 'id' | 'gameNo' | 'seasonId'>[],
  excludeGameId: string,
  seasonId: string,
): string | null {
  if (!Number.isInteger(gameNo)) {
    return '試合番号は整数で入力してください'
  }
  if (gameNo < GAME_LIMITS.gameNoMin) {
    return `試合番号は${GAME_LIMITS.gameNoMin}以上で入力してください`
  }
  if (gameNo > GAME_LIMITS.gameNoMax) {
    return `試合番号は${GAME_LIMITS.gameNoMax}以下で入力してください`
  }
  const duplicate = games.find(
    (g) =>
      g.id !== excludeGameId &&
      getGameSeasonId(g) === seasonId &&
      g.gameNo === gameNo,
  )
  if (duplicate) {
    return `このシーズンで第${gameNo}戦は既に別の試合で使われています`
  }
  return null
}

export function parseGameNoInput(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  if (!Number.isInteger(n)) return undefined
  return n
}
