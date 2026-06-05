import type { Game } from '../types'

/** 古い順（連続入賞など） */
export function compareGamesChronologically(a: Game, b: Game): number {
  const dateCmp = a.date.localeCompare(b.date)
  if (dateCmp !== 0) return dateCmp
  const timeA = a.time ?? '00:00'
  const timeB = b.time ?? '00:00'
  const timeCmp = timeA.localeCompare(timeB)
  if (timeCmp !== 0) return timeCmp
  return a.gameNo - b.gameNo
}

/** 新しい順（一覧・直近試合） */
export function compareGamesByRecency(a: Game, b: Game): number {
  return -compareGamesChronologically(a, b)
}
