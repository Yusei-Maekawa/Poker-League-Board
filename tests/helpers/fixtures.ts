import { Timestamp } from 'firebase/firestore'
import type { Game, Player, Result } from '../../src/types'

let idSeq = 0
function nextId(prefix: string) {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

export function mockTimestamp(ms: number): Timestamp {
  return Timestamp.fromMillis(ms)
}

export function mockPlayer(
  overrides: Partial<Player> & Pick<Player, 'id' | 'name'>,
): Player {
  const now = Timestamp.now()
  return {
    icon: '🎴',
    memo: '',
    isActive: true,
    authUid: 'auth-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function mockGame(
  overrides: Partial<Game> & Pick<Game, 'id'>,
): Game {
  const now = Timestamp.now()
  return {
    gameNo: 1,
    seasonId: 'season1',
    date: '2026-01-01',
    appName: 'Test',
    memo: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function mockResult(
  overrides: Partial<Result> &
    Pick<Result, 'gameId' | 'playerId' | 'rank' | 'point'>,
): Result {
  return {
    id: nextId('result'),
    createdAt: Timestamp.now(),
    ...overrides,
  }
}
