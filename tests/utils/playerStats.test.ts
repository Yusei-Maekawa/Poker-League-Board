import { describe, expect, it } from 'vitest'
import {
  computePodiumStreaks,
  formatWinRate,
  getPlayerRankingStat,
} from '../../src/utils/playerStats'
import { mockGame, mockPlayer, mockResult } from '../helpers/fixtures'

describe('formatWinRate', () => {
  it('returns em dash when no games', () => {
    expect(formatWinRate(0, 0)).toBe('—')
  })

  it('formats percentage with one decimal', () => {
    expect(formatWinRate(1, 3)).toBe('33.3%')
  })
})

describe('getPlayerRankingStat', () => {
  const players = [
    mockPlayer({ id: 'p1', name: 'Alice', isActive: true }),
    mockPlayer({ id: 'p2', name: 'Bob', isActive: true }),
  ]
  const games = [
    mockGame({ id: 'g1', seasonId: 'season1', gameNo: 1 }),
    mockGame({ id: 'g2', seasonId: 'season2', gameNo: 2 }),
  ]
  const results = [
    mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
    mockResult({ gameId: 'g2', playerId: 'p1', rank: 2, point: 5 }),
  ]

  it('scopes stats to a season', () => {
    const all = getPlayerRankingStat('p1', players, results, games, 'all')
    const s1 = getPlayerRankingStat('p1', players, results, games, 'season1')
    expect(all?.playCount).toBe(2)
    expect(s1?.playCount).toBe(1)
    expect(s1?.totalPoint).toBe(7)
  })
})

describe('computePodiumStreaks', () => {
  const games = [
    mockGame({ id: 'g1', gameNo: 1 }),
    mockGame({ id: 'g2', gameNo: 2 }),
    mockGame({ id: 'g3', gameNo: 3 }),
  ]

  it('tracks longest and current podium streaks', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
      mockResult({ gameId: 'g2', playerId: 'p1', rank: 4, point: 1 }),
      mockResult({ gameId: 'g3', playerId: 'p1', rank: 2, point: 5 }),
    ]

    expect(computePodiumStreaks('p1', games, results)).toEqual({
      longest: 1,
      current: 1,
    })
  })

  it('counts consecutive top-3 from most recent games', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 2, point: 5 }),
      mockResult({ gameId: 'g2', playerId: 'p1', rank: 3, point: 3 }),
      mockResult({ gameId: 'g3', playerId: 'p1', rank: 1, point: 7 }),
    ]

    expect(computePodiumStreaks('p1', games, results)).toEqual({
      longest: 3,
      current: 3,
    })
  })
})
