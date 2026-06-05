import type { Season } from '../types'

/** 旧データ・未設定 games のフォールバック */
export const DEFAULT_SEASON_ID = 'season1'

/** Firestore に seasons が無いときの表示用 */
export const FALLBACK_SEASONS: Omit<Season, 'createdAt' | 'updatedAt'>[] = [
  {
    id: DEFAULT_SEASON_ID,
    label: 'Season 1',
    order: 1,
  },
]

/** ランキング等の「全期間」 */
export const ALL_SEASONS_SCOPE = 'all' as const

export type SeasonScope = typeof ALL_SEASONS_SCOPE | string
