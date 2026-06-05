import { describe, expect, it } from 'vitest'
import { buildRankingStats, formatPoint, getRankLabel } from '../../src/utils/ranking'
import { mockPlayer, mockResult } from '../helpers/fixtures'

describe('buildRankingStats', () => {
  const players = [
    mockPlayer({ id: 'p1', name: 'Alice', isActive: true }),
    mockPlayer({ id: 'p2', name: 'Bob', isActive: true }),
    mockPlayer({ id: 'p3', name: 'Inactive', isActive: false }),
  ]

  it('aggregates points and counts for active players only', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
      mockResult({ gameId: 'g1', playerId: 'p2', rank: 2, point: 5 }),
      mockResult({ gameId: 'g2', playerId: 'p1', rank: 2, point: 5 }),
      mockResult({ gameId: 'g2', playerId: 'p2', rank: 1, point: 7 }),
    ]

    const stats = buildRankingStats(players, results)
    expect(stats).toHaveLength(2)

    const alice = stats.find((s) => s.player.id === 'p1')!
    expect(alice.totalPoint).toBe(12)
    expect(alice.playCount).toBe(2)
    expect(alice.winCount).toBe(1)
    expect(alice.podiumCount).toBe(2)
    expect(alice.podiumRate).toBe(100)
    expect(alice.avgRank).toBe(1.5)
    expect(alice.avgTableSize).toBe(2)
  })

  it('computes average table size per player', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
      mockResult({ gameId: 'g1', playerId: 'p2', rank: 2, point: 5 }),
      mockResult({ gameId: 'g2', playerId: 'p1', rank: 2, point: 5 }),
      mockResult({ gameId: 'g2', playerId: 'p2', rank: 1, point: 7 }),
      mockResult({ gameId: 'g2', playerId: 'p3', rank: 3, point: 3 }),
    ]
    const alice = buildRankingStats(players, results).find(
      (s) => s.player.id === 'p1',
    )!
    expect(alice.avgTableSize).toBe(2.5)
  })

  it('counts last place per game participant count', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
      mockResult({ gameId: 'g1', playerId: 'p2', rank: 2, point: -2 }),
      mockResult({ gameId: 'g2', playerId: 'p1', rank: 2, point: 5 }),
      mockResult({ gameId: 'g2', playerId: 'p2', rank: 1, point: 7 }),
    ]

    const bob = buildRankingStats(players, results).find(
      (s) => s.player.id === 'p2',
    )!
    expect(bob.lastPlaceCount).toBe(1)
  })

  it('excludes zero-play players when participantsOnly', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
    ]
    const stats = buildRankingStats(players, results, {
      participantsOnly: true,
    })
    expect(stats).toHaveLength(1)
    expect(stats[0].player.id).toBe('p1')
  })

  it('sorts by totalPoint desc then playCount desc', () => {
    const results = [
      mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 10 }),
      mockResult({ gameId: 'g1', playerId: 'p2', rank: 2, point: 10 }),
      mockResult({ gameId: 'g2', playerId: 'p2', rank: 1, point: 0 }),
    ]

    const stats = buildRankingStats(players, results)
    expect(stats[0].player.id).toBe('p2')
    expect(stats[1].player.id).toBe('p1')
  })
})

describe('formatPoint / getRankLabel', () => {
  it('formats signed points', () => {
    expect(formatPoint(7)).toBe('+7')
    expect(formatPoint(-2)).toBe('-2')
  })

  it('formats rank label', () => {
    expect(getRankLabel(3)).toBe('3位')
  })
})
