import { describe, expect, it } from 'vitest'
import { DEFAULT_SEASON_ID } from '../../src/constants/seasons'
import {
  filterGamesBySeason,
  filterResultsBySeason,
  getGameSeasonId,
} from '../../src/utils/season'
import { mockGame, mockResult } from '../helpers/fixtures'

describe('getGameSeasonId', () => {
  it('falls back to season1 when seasonId is missing', () => {
    expect(getGameSeasonId({ seasonId: undefined })).toBe(DEFAULT_SEASON_ID)
    expect(getGameSeasonId({ seasonId: '' })).toBe(DEFAULT_SEASON_ID)
  })

  it('returns trimmed seasonId', () => {
    expect(getGameSeasonId({ seasonId: ' season2 ' })).toBe('season2')
  })
})

describe('filterGamesBySeason / filterResultsBySeason', () => {
  const games = [
    mockGame({ id: 'g1', seasonId: 'season1' }),
    mockGame({ id: 'g2', seasonId: 'season2' }),
    mockGame({ id: 'g3' }),
  ]
  const results = [
    mockResult({ gameId: 'g1', playerId: 'p1', rank: 1, point: 7 }),
    mockResult({ gameId: 'g2', playerId: 'p1', rank: 1, point: 7 }),
    mockResult({ gameId: 'g3', playerId: 'p2', rank: 2, point: 5 }),
  ]

  it('filters games by season', () => {
    expect(filterGamesBySeason(games, 'season2').map((g) => g.id)).toEqual([
      'g2',
    ])
    expect(filterGamesBySeason(games, 'season1').map((g) => g.id)).toEqual([
      'g1',
      'g3',
    ])
  })

  it('filters results via game season', () => {
    expect(
      filterResultsBySeason(games, results, 'season2').map((r) => r.gameId),
    ).toEqual(['g2'])
    expect(
      filterResultsBySeason(games, results, 'season1').map((r) => r.gameId),
    ).toEqual(['g1', 'g3'])
  })
})
