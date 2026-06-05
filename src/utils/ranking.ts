import type { Player, Result, RankingStat } from '../types'

export interface BuildRankingStatsOptions {
  /** true のとき playCount が 0 のプレイヤーを除外（シーズン別表示向け） */
  participantsOnly?: boolean
}

export function buildRankingStats(
  players: Player[],
  results: Result[],
  options?: BuildRankingStatsOptions,
): RankingStat[] {
  // gameId ごとの参加人数を集計
  const playersPerGame = new Map<string, number>()
  for (const r of results) {
    playersPerGame.set(r.gameId, (playersPerGame.get(r.gameId) ?? 0) + 1)
  }

  const statsMap = new Map<string, RankingStat>()

  for (const player of players) {
    if (!player.isActive) continue
    statsMap.set(player.id, {
      player,
      totalPoint: 0,
      playCount: 0,
      winCount: 0,
      podiumCount: 0,
      lastPlaceCount: 0,
      avgRank: 0,
      podiumRate: 0,
      avgTableSize: 0,
    })
  }

  for (const result of results) {
    const stat = statsMap.get(result.playerId)
    if (!stat) continue

    const total = playersPerGame.get(result.gameId) ?? 1
    const isLast = result.rank === total

    stat.totalPoint += result.point
    stat.playCount += 1
    stat.avgRank += result.rank
    stat.avgTableSize += total
    if (result.rank === 1) stat.winCount += 1
    if (result.rank <= 3) stat.podiumCount += 1
    if (isLast) stat.lastPlaceCount += 1
  }

  let stats = Array.from(statsMap.values())

  for (const stat of stats) {
    if (stat.playCount > 0) {
      stat.avgRank = Math.round((stat.avgRank / stat.playCount) * 10) / 10
      stat.podiumRate = Math.round((stat.podiumCount / stat.playCount) * 1000) / 10
      stat.avgTableSize =
        Math.round((stat.avgTableSize / stat.playCount) * 10) / 10
    }
  }

  if (options?.participantsOnly) {
    stats = stats.filter((s) => s.playCount > 0)
  }

  // 合計ポイント降順 → 参加回数降順
  stats.sort((a, b) => {
    if (b.totalPoint !== a.totalPoint) return b.totalPoint - a.totalPoint
    return b.playCount - a.playCount
  })

  return stats
}

export function getRankLabel(rank: number): string {
  return `${rank}位`
}

export function formatPoint(point: number): string {
  return point >= 0 ? `+${point}` : `${point}`
}
