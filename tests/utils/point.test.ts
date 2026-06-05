import { describe, expect, it } from 'vitest'
import { DEFAULT_SEASON_POINT_RULES } from '../../src/constants/pointRules'
import { calculatePoint } from '../../src/utils/point'

describe('calculatePoint', () => {
  const rules = DEFAULT_SEASON_POINT_RULES

  it('assigns standard points by rank', () => {
    expect(calculatePoint(1, 6, rules)).toBe(7)
    expect(calculatePoint(2, 6, rules)).toBe(5)
    expect(calculatePoint(3, 6, rules)).toBe(3)
    expect(calculatePoint(4, 6, rules)).toBe(1)
    expect(calculatePoint(5, 6, rules)).toBe(0)
  })

  it('applies last-place penalty over rank points', () => {
    expect(calculatePoint(6, 6, rules)).toBe(-2)
    expect(calculatePoint(3, 3, rules)).toBe(-2)
  })

  it('uses custom season rules', () => {
    const custom = { ...rules, rank1: 10, lastPlace: -5 }
    expect(calculatePoint(1, 4, custom)).toBe(10)
    expect(calculatePoint(4, 4, custom)).toBe(-5)
  })
})
