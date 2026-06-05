import type { SeasonPointRules } from '../types'

/** リーグ標準（v0.3 までの既定） */
export const DEFAULT_SEASON_POINT_RULES: SeasonPointRules = {
  rank1: 7,
  rank2: 5,
  rank3: 3,
  rank4: 1,
  rank5Plus: 0,
  lastPlace: -2,
}
