import { describe, expect, it } from 'vitest'
import { buildDiscordMessage } from '../../src/utils/discord'
import type { Game, Player, Result } from '../../src/types'

const game: Game = {
  id: 'g1',
  gameNo: 1,
  date: '2025-01-01',
  appName: 'Poker',
  memo: '',
  createdAt: {} as Game['createdAt'],
  updatedAt: {} as Game['updatedAt'],
}

const players: Player[] = [
  {
    id: 'p1',
    name: 'Alice',
    icon: 'A',
    memo: '',
    isActive: true,
    createdAt: {} as Player['createdAt'],
    updatedAt: {} as Player['updatedAt'],
  },
]

const results: Result[] = [
  { id: 'r1', gameId: 'g1', playerId: 'p1', rank: 1, point: 7, createdAt: {} as Result['createdAt'] },
  { id: 'r2', gameId: 'g1', playerId: 'cpu-1', rank: 2, point: 0, createdAt: {} as Result['createdAt'] },
]

describe('buildDiscordMessage', () => {
  it('resolves human names and omits CPU points', () => {
    const text = buildDiscordMessage(game, results, players)
    expect(text).toContain('Alice')
    expect(text).toContain('CPU 1')
    expect(text).not.toMatch(/CPU 1\s+\+?\d+pt/)
    expect(text).toContain('+7pt')
  })
})
