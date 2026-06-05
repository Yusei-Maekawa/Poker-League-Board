import { describe, expect, it } from 'vitest'
import type { Season } from '../../src/types'
import { resolveActiveSeasonId } from '../../src/utils/seasonPeriod'
import { mockTimestamp } from '../helpers/fixtures'

function season(
  partial: Pick<Season, 'id' | 'order'> &
    Partial<Pick<Season, 'startsAt' | 'endsAt'>>,
): Season {
  const now = mockTimestamp(0)
  return {
    label: partial.id,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

describe('resolveActiveSeasonId', () => {
  const now = new Date('2026-06-15T12:00:00').getTime()

  it('prefers season whose period contains now (highest order)', () => {
    const seasons = [
      season({
        id: 'season1',
        order: 1,
        startsAt: mockTimestamp(now - 86400000),
        endsAt: mockTimestamp(now + 86400000),
      }),
      season({
        id: 'season2',
        order: 2,
        startsAt: mockTimestamp(now - 86400000),
        endsAt: mockTimestamp(now + 86400000),
      }),
    ]

    expect(resolveActiveSeasonId(seasons, 'season1', now)).toBe('season2')
  })

  it('falls back to config when no period matches', () => {
    const seasons = [
      season({
        id: 'season1',
        order: 1,
        startsAt: mockTimestamp(now + 86400000),
        endsAt: mockTimestamp(now + 172800000),
      }),
    ]

    expect(resolveActiveSeasonId(seasons, 'season9', now)).toBe('season9')
  })

  it('ignores seasons without both startsAt and endsAt', () => {
    const seasons = [season({ id: 'season1', order: 1 })]

    expect(resolveActiveSeasonId(seasons, 'config-fallback', now)).toBe(
      'config-fallback',
    )
  })
})
