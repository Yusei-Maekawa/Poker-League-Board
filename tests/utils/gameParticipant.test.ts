import { describe, expect, it } from 'vitest'
import {
  countGameParticipants,
  formatGameParticipantCount,
} from '../../src/utils/gameParticipant'

describe('formatGameParticipantCount', () => {
  it('returns human-only label when no CPU', () => {
    expect(
      formatGameParticipantCount([
        { playerId: 'p1' },
        { playerId: 'p2' },
      ]),
    ).toBe('2人参加')
  })

  it('returns human + CPU label', () => {
    expect(
      formatGameParticipantCount([
        { playerId: 'p1' },
        { playerId: 'p2' },
        { playerId: 'p3' },
        { playerId: 'cpu-1' },
        { playerId: 'cpu-2' },
        { playerId: 'cpu-3' },
      ]),
    ).toBe('3人(＋CPU3人)')
  })

  it('returns CPU-only label', () => {
    expect(
      formatGameParticipantCount([{ playerId: 'cpu-1' }]),
    ).toBe('CPU1人')
  })
})

describe('countGameParticipants', () => {
  it('counts human and cpu separately', () => {
    expect(
      countGameParticipants([
        { playerId: 'a' },
        { playerId: 'cpu-2' },
      ]),
    ).toEqual({ human: 1, cpu: 1, total: 2 })
  })
})
