import { describe, expect, it } from 'vitest'
import { DEFAULT_SEASON_POINT_RULES } from '../../src/constants/pointRules'
import type { Season } from '../../src/types'
import {
  getPointRulesForSeason,
  normalizeSeasonPointRules,
  usesCustomPointRules,
  validateSeasonPointRules,
} from '../../src/utils/seasonPointRules'

describe('normalizeSeasonPointRules', () => {
  it('returns defaults when raw is undefined', () => {
    expect(normalizeSeasonPointRules(undefined)).toEqual(
      DEFAULT_SEASON_POINT_RULES,
    )
  })

  it('clamps out-of-range values', () => {
    expect(
      normalizeSeasonPointRules({ rank1: 200, lastPlace: -200 }),
    ).toMatchObject({ rank1: 99, lastPlace: -99 })
  })
})

describe('validateSeasonPointRules', () => {
  it('accepts valid numbers', () => {
    expect(validateSeasonPointRules({ rank1: 7 })).toBeNull()
  })

  it('rejects non-numeric values', () => {
    expect(validateSeasonPointRules({ rank1: NaN })).toContain('数値')
  })

  it('rejects out-of-range values', () => {
    expect(validateSeasonPointRules({ rank1: 100 })).toContain('範囲')
  })
})

describe('usesCustomPointRules', () => {
  it('is false when pointRules is unset', () => {
    const season = { pointRules: undefined } as Season
    expect(usesCustomPointRules(season)).toBe(false)
  })

  it('is true when any value differs from default', () => {
    const season = {
      pointRules: { ...DEFAULT_SEASON_POINT_RULES, rank1: 10 },
    } as Season
    expect(usesCustomPointRules(season)).toBe(true)
  })
})

describe('getPointRulesForSeason', () => {
  it('merges partial season rules with defaults', () => {
    const rules = getPointRulesForSeason({
      pointRules: { rank1: 10 },
    } as Season)
    expect(rules.rank1).toBe(10)
    expect(rules.rank2).toBe(DEFAULT_SEASON_POINT_RULES.rank2)
  })
})
