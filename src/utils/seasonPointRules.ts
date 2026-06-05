import { DEFAULT_SEASON_POINT_RULES } from '../constants/pointRules'
import type { Season, SeasonPointRules } from '../types'

const POINT_MIN = -99
const POINT_MAX = 99

export function normalizeSeasonPointRules(
  raw: Partial<SeasonPointRules> | undefined,
): SeasonPointRules {
  const d = DEFAULT_SEASON_POINT_RULES
  if (!raw) return { ...d }
  return {
    rank1: clampPoint(raw.rank1 ?? d.rank1),
    rank2: clampPoint(raw.rank2 ?? d.rank2),
    rank3: clampPoint(raw.rank3 ?? d.rank3),
    rank4: clampPoint(raw.rank4 ?? d.rank4),
    rank5Plus: clampPoint(raw.rank5Plus ?? d.rank5Plus),
    lastPlace: clampPoint(raw.lastPlace ?? d.lastPlace),
  }
}

function clampPoint(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(POINT_MIN, Math.min(POINT_MAX, Math.round(n)))
}

export function validateSeasonPointRules(
  raw: Partial<SeasonPointRules>,
): string | null {
  const keys: (keyof SeasonPointRules)[] = [
    'rank1',
    'rank2',
    'rank3',
    'rank4',
    'rank5Plus',
    'lastPlace',
  ]
  for (const key of keys) {
    const v = raw[key]
    if (v === undefined || v === null) continue
    if (!Number.isFinite(Number(v))) {
      return 'ポイントは数値で入力してください'
    }
    const n = Math.round(Number(v))
    if (n < POINT_MIN || n > POINT_MAX) {
      return `ポイントは ${POINT_MIN} 〜 ${POINT_MAX} の範囲で入力してください`
    }
  }
  return null
}

export function getPointRulesForSeason(season: Season | undefined): SeasonPointRules {
  return normalizeSeasonPointRules(season?.pointRules)
}

export function pointRulesToDisplayRows(rules: SeasonPointRules) {
  return [
    { label: '🥇 1位', pt: formatPt(rules.rank1) },
    { label: '🥈 2位', pt: formatPt(rules.rank2) },
    { label: '🥉 3位', pt: formatPt(rules.rank3) },
    { label: '4位', pt: formatPt(rules.rank4) },
    { label: '5位以下', pt: formatPt(rules.rank5Plus) },
    { label: '最下位', pt: formatPt(rules.lastPlace) },
  ]
}

function formatPt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

export function usesCustomPointRules(season: Season): boolean {
  if (!season.pointRules) return false
  const n = normalizeSeasonPointRules(season.pointRules)
  const d = DEFAULT_SEASON_POINT_RULES
  return (
    n.rank1 !== d.rank1 ||
    n.rank2 !== d.rank2 ||
    n.rank3 !== d.rank3 ||
    n.rank4 !== d.rank4 ||
    n.rank5Plus !== d.rank5Plus ||
    n.lastPlace !== d.lastPlace
  )
}
