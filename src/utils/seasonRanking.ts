import type { Season } from '../types'

/** 未設定時はランキング切替に表示する */
export function isSeasonShownInRanking(season: Season): boolean {
  return season.showInRanking !== false
}

export function filterSeasonsForRanking(seasons: Season[]): Season[] {
  return seasons.filter(isSeasonShownInRanking)
}
