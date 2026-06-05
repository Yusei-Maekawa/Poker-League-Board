import { describe, expect, it } from 'vitest'
import { computeNextGameNoBySeason } from '../../src/utils/allocateGameNo'

describe('computeNextGameNoBySeason', () => {
  it('computes next number per season from games', () => {
    const games = [
      { seasonId: 'season1', gameNo: 5 },
      { seasonId: 'season1', gameNo: 3 },
      { seasonId: 'season3', gameNo: 2 },
      { gameNo: 10 },
    ]
    expect(computeNextGameNoBySeason(games, ['season1', 'season2'])).toEqual({
      season1: 11,
      season2: 1,
      season3: 3,
    })
  })

  it('includes orphan season ids from games', () => {
    const games = [{ seasonId: 'season3', gameNo: 7 }]
    expect(computeNextGameNoBySeason(games, [])).toEqual({ season3: 8 })
  })
})
