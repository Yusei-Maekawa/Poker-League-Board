import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  ACTIVITY_NEW_HOURS,
  countNewActivities,
  getActivityDisplayMeta,
  getActivityTimeLabel,
  isActivityNew,
  isWithinLastHours,
  planGameActivityRepairs,
  resolveActivitySeasonLabel,
} from '../../src/utils/activityFeed'
import type { Activity } from '../../src/types'

const NOW = new Date('2025-06-01T12:00:00').getTime()

function mockTimestamp(msAgo: number) {
  const date = new Date(NOW - msAgo)
  return { toDate: () => date }
}

describe('isActivityNew', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is true within 1 hour', () => {
    expect(
      isActivityNew({
        createdAt: mockTimestamp(30 * 60 * 1000) as Activity['createdAt'],
      }),
    ).toBe(true)
  })

  it('is false after 1 hour', () => {
    expect(
      isActivityNew({
        createdAt: mockTimestamp(
          (ACTIVITY_NEW_HOURS * 60 + 1) * 60 * 1000,
        ) as Activity['createdAt'],
      }),
    ).toBe(false)
  })
})

describe('isWithinLastHours', () => {
  it('returns false for missing timestamp', () => {
    expect(isWithinLastHours(undefined, 1)).toBe(false)
  })
})

describe('getActivityTimeLabel', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('combines event date and relative on one line for game_added', () => {
    const label = getActivityTimeLabel({
      id: 'a1',
      type: 'game_added',
      gameDate: '2025-05-20',
      gameTime: '20:00',
      createdAt: mockTimestamp(10 * 60 * 1000) as Activity['createdAt'],
    })
    expect(label).toBe('2025年5月20日 20:00 · 10分前')
    expect(label?.match(/年/g)?.length).toBe(1)
  })

  it('uses relative only for member_joined', () => {
    const label = getActivityTimeLabel({
      id: 'a2',
      type: 'member_joined',
      createdAt: mockTimestamp(2 * 60 * 1000) as Activity['createdAt'],
    })
    expect(label).toBe('2分前')
  })
})

describe('countNewActivities', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts only activities within new window', () => {
    const count = countNewActivities([
      {
        id: '1',
        type: 'game_added',
        createdAt: mockTimestamp(10 * 60 * 1000) as Activity['createdAt'],
      },
      {
        id: '2',
        type: 'member_joined',
        createdAt: mockTimestamp(3 * 60 * 60 * 1000) as Activity['createdAt'],
      },
    ])
    expect(count).toBe(1)
  })
})

describe('getActivityDisplayMeta', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats game_added title and single time line', () => {
    const meta = getActivityDisplayMeta({
      id: 'a1',
      type: 'game_added',
      gameNo: 3,
      gameDate: '2025-05-20',
      gameTime: '20:00',
      createdAt: mockTimestamp(10 * 60 * 1000) as Activity['createdAt'],
    })
    expect(meta.title).toBe('第3戦の結果が追加されました')
    expect(meta.timeLabel).toContain('2025年5月20日 20:00')
    expect(meta.timeLabel).toContain('10分前')
  })

  it('includes season label in game_added title when provided', () => {
    const meta = getActivityDisplayMeta(
      {
        id: 'a1',
        type: 'game_added',
        gameNo: 5,
        createdAt: mockTimestamp(10 * 60 * 1000) as Activity['createdAt'],
      },
      { seasonLabel: 'Season 3' },
    )
    expect(meta.title).toBe('「Season 3」第5戦の結果が追加されました')
  })
})

describe('resolveActivitySeasonLabel', () => {
  it('prefers snapshot label, then seasonId, then game season', () => {
    const seasons = [
      { id: 'season1', label: 'Season 1' },
      { id: 'season3', label: 'Season 3' },
    ]
    expect(
      resolveActivitySeasonLabel(
        { type: 'game_added', seasonLabel: '春のバウンティ' },
        seasons,
      ),
    ).toBe('春のバウンティ')
    expect(
      resolveActivitySeasonLabel(
        { type: 'game_added', seasonId: 'season3' },
        seasons,
      ),
    ).toBe('Season 3')
    expect(
      resolveActivitySeasonLabel({ type: 'game_added' }, seasons, 'season1'),
    ).toBe('Season 1')
  })
})

describe('planGameActivityRepairs', () => {
  const seasons = [
    { id: 'season1', label: 'Season 1' },
    { id: 'season3', label: 'Season 3' },
  ]

  it('deletes orphan game_added and updates stale gameNo', () => {
    const plan = planGameActivityRepairs(
      [{ id: 'g1', gameNo: 5, seasonId: 'season3' }],
      [
        {
          id: 'a1',
          type: 'game_added',
          gameId: 'g1',
          gameNo: 3,
        },
        {
          id: 'a2',
          type: 'game_added',
          gameId: 'missing',
          gameNo: 1,
        },
      ],
      seasons,
    )

    expect(plan.deleteIds).toEqual(['a2'])
    expect(plan.updates).toEqual([
      {
        id: 'a1',
        gameNo: 5,
        seasonId: 'season3',
        seasonLabel: 'Season 3',
      },
    ])
  })
})
