import { DEFAULT_SEASON_POINT_RULES } from '../constants/pointRules'
import type { SeasonPointRules } from '../types'

/**
 * 順位からポイントを計算（シーズン別ルール対応）
 * - 最下位は lastPlace を優先
 * - 1〜4位は rank1〜rank4、5位以下（最下位以外）は rank5Plus
 */
export function calculatePoint(
  rank: number,
  totalPlayers: number,
  rules: SeasonPointRules = DEFAULT_SEASON_POINT_RULES,
): number {
  if (rank === totalPlayers) return rules.lastPlace
  switch (rank) {
    case 1:
      return rules.rank1
    case 2:
      return rules.rank2
    case 3:
      return rules.rank3
    case 4:
      return rules.rank4
    default:
      return rules.rank5Plus
  }
}

export { DEFAULT_SEASON_POINT_RULES }
