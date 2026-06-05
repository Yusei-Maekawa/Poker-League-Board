import { DEFAULT_SEASON_ID } from '../constants/seasons'
import { SEASON_LIMITS } from './validationLimits'
import { sanitizeUserText } from './sanitizeUserText'
import type { Season } from '../types'

const SEASON_ID_PATTERN = /^season(\d+)$/

export function planNextSeason(existing: Pick<Season, 'id' | 'order'>[]) {
  const maxOrder = existing.reduce((max, s) => Math.max(max, s.order), 0)
  const nextOrder = maxOrder + 1
  const id = `season${nextOrder}`
  return {
    id,
    label: `Season ${nextOrder}`,
    order: nextOrder,
  }
}

/** Firestore に doc が無いときの表示用 ID が本当に未登録か */
export function isFallbackOnlySeasonList(
  seasons: Season[],
  hasFirestoreSeasons: boolean,
): boolean {
  return !hasFirestoreSeasons && seasons.length === 1 && seasons[0]?.id === DEFAULT_SEASON_ID
}

export function parseSeasonNumber(seasonId: string): number | null {
  const match = seasonId.match(SEASON_ID_PATTERN)
  if (!match) return null
  return Number(match[1])
}

export function normalizeSeasonLabel(raw: string): string {
  return sanitizeUserText(raw).trim()
}

export function validateSeasonLabel(raw: string): string | null {
  const label = normalizeSeasonLabel(raw)
  if (!label) return '表示名を入力してください'
  if (label.length > SEASON_LIMITS.label) {
    return `表示名は${SEASON_LIMITS.label}文字以内です`
  }
  return null
}
