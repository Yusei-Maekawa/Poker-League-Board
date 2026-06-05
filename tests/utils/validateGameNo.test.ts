import { describe, expect, it } from 'vitest'
import {
  validateGameNo,
  parseGameNoInput,
  suggestNextGameNo,
} from '../../src/utils/validateGameNo'

describe('validateGameNo', () => {
  const games = [
    { id: 'a', gameNo: 10, seasonId: 'season1' },
    { id: 'b', gameNo: 12, seasonId: 'season1' },
    { id: 'c', gameNo: 12, seasonId: 'season2' },
  ]

  it('rejects non-integer', () => {
    expect(validateGameNo(1.5, games, 'a', 'season1')).toMatch(/整数/)
  })

  it('rejects duplicate within same season', () => {
    expect(validateGameNo(12, games, 'a', 'season1')).toMatch(/既に/)
  })

  it('allows same number in different season', () => {
    expect(validateGameNo(10, games, 'c', 'season2')).toBeNull()
  })

  it('allows same number on same game', () => {
    expect(validateGameNo(10, games, 'a', 'season1')).toBeNull()
  })

  it('allows unused number in season', () => {
    expect(validateGameNo(11, games, 'a', 'season1')).toBeNull()
  })
})

describe('suggestNextGameNo', () => {
  it('returns max in season plus one', () => {
    const games = [
      { gameNo: 3, seasonId: 'season1' },
      { gameNo: 7, seasonId: 'season1' },
      { gameNo: 99, seasonId: 'season2' },
    ]
    expect(suggestNextGameNo(games, 'season1')).toBe(8)
    expect(suggestNextGameNo(games, 'season2')).toBe(100)
  })

  it('starts at 1 when season has no games', () => {
    expect(suggestNextGameNo([], 'season1')).toBe(1)
  })
})

describe('parseGameNoInput', () => {
  it('parses valid integer', () => {
    expect(parseGameNoInput('42')).toBe(42)
  })

  it('returns undefined for empty', () => {
    expect(parseGameNoInput('')).toBeUndefined()
  })
})
