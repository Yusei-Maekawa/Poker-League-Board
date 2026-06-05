import { DEFAULT_SEASON_ID } from '../constants/seasons'
import type { Game, Result, Season } from '../types'

export function getGameSeasonId(game: Pick<Game, 'seasonId'>): string {
  return game.seasonId?.trim() || DEFAULT_SEASON_ID
}

export function getSeasonLabelForGame(
  game: Pick<Game, 'seasonId'>,
  seasons: Pick<Season, 'id' | 'label'>[],
): string {
  const id = getGameSeasonId(game)
  return seasons.find((s) => s.id === id)?.label ?? id
}

export function filterGamesBySeason(
  games: Game[],
  seasonId: string,
): Game[] {
  return games.filter((g) => getGameSeasonId(g) === seasonId)
}

export function filterResultsBySeason(
  games: Game[],
  results: Result[],
  seasonId: string,
): Result[] {
  const gameIds = new Set(filterGamesBySeason(games, seasonId).map((g) => g.id))
  return results.filter((r) => gameIds.has(r.gameId))
}
