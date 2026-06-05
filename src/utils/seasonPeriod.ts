import { Timestamp } from 'firebase/firestore'
import type { GameSeasonMode, Season } from '../types'
import { formatTimestamp, normalizeGameTime } from './formatDateTime'

export const DEFAULT_GAME_SEASON_MODE: GameSeasonMode = 'manual'

export function normalizeGameSeasonMode(value: unknown): GameSeasonMode {
  return value === 'period' ? 'period' : 'manual'
}

export type SeasonPeriodPhase = 'unset' | 'upcoming' | 'current' | 'ended'

export interface SeasonPeriodFields {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
}

const DEFAULT_TIME = '15:00'

/** 新規シーズン作成フォームの初期値 */
export function defaultNextSeasonPeriodFields(
  existing: Pick<Season, 'endsAt' | 'order'>[],
): SeasonPeriodFields {
  const withEnd = existing
    .filter((s) => s.endsAt)
    .sort((a, b) => (b.endsAt!.toMillis?.() ?? 0) - (a.endsAt!.toMillis?.() ?? 0))
  const latestEnd = withEnd[0]?.endsAt?.toDate?.()

  if (latestEnd) {
    const start = latestEnd
    const end = new Date(start.getTime())
    end.setMonth(end.getMonth() + 1)
    return {
      startDate: toDateInputValue(start),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(end),
      endTime: toTimeInputValue(end),
    }
  }

  const start = new Date()
  start.setHours(15, 0, 0, 0)
  const end = new Date(start.getTime())
  end.setMonth(end.getMonth() + 1)
  return {
    startDate: toDateInputValue(start),
    startTime: DEFAULT_TIME,
    endDate: toDateInputValue(end),
    endTime: DEFAULT_TIME,
  }
}

export function seasonFieldsToDate(
  date: string,
  time: string,
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return null
  const t = normalizeGameTime(time) ?? DEFAULT_TIME
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = t.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export type ResolvedSeasonPeriod =
  | { kind: 'unset' }
  | { kind: 'set'; startsAt: Timestamp; endsAt: Timestamp }

export function isSeasonPeriodFieldsEmpty(fields: SeasonPeriodFields): boolean {
  return !fields.startDate.trim() && !fields.endDate.trim()
}

/** 開始・終了のどちらかだけ入力されている */
export function isSeasonPeriodFieldsPartial(fields: SeasonPeriodFields): boolean {
  const hasStart = !!fields.startDate.trim()
  const hasEnd = !!fields.endDate.trim()
  return hasStart !== hasEnd
}

function periodMillis(season: Pick<Season, 'startsAt' | 'endsAt'>): {
  start: number
  end: number
} | null {
  if (!season.startsAt || !season.endsAt) return null
  return {
    start: season.startsAt.toMillis(),
    end: season.endsAt.toMillis(),
  }
}

/** 終了日時を含む区間として重なり判定 */
function periodsOverlapMs(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA <= endB && startB <= endA
}

export function findOverlappingSeason(
  otherSeasons: Season[],
  startsAt: Timestamp,
  endsAt: Timestamp,
  excludeSeasonId?: string,
): Season | null {
  const start = startsAt.toMillis()
  const end = endsAt.toMillis()
  for (const other of otherSeasons) {
    if (excludeSeasonId && other.id === excludeSeasonId) continue
    const range = periodMillis(other)
    if (!range) continue
    if (periodsOverlapMs(start, end, range.start, range.end)) {
      return other
    }
  }
  return null
}

/**
 * 保存前検証。空欄 = 期間未設定（許容）。
 * 期間ありのときは終了 > 開始、他シーズンと重複不可。
 */
export function validateSeasonPeriodForSave(
  fields: SeasonPeriodFields,
  otherSeasons: Season[],
  excludeSeasonId?: string,
): string | null {
  if (isSeasonPeriodFieldsEmpty(fields)) return null
  if (isSeasonPeriodFieldsPartial(fields)) {
    return '開始日と終了日は両方入力するか、両方空にしてください'
  }

  const start = seasonFieldsToDate(fields.startDate, fields.startTime)
  const end = seasonFieldsToDate(fields.endDate, fields.endTime)
  if (!start || !end) {
    return '開始・終了の日時を正しく入力してください'
  }
  if (end.getTime() <= start.getTime()) {
    return '終了は開始より後の日時にしてください'
  }

  const startsAt = Timestamp.fromDate(start)
  const endsAt = Timestamp.fromDate(end)
  const overlap = findOverlappingSeason(
    otherSeasons,
    startsAt,
    endsAt,
    excludeSeasonId,
  )
  if (overlap) {
    return `「${overlap.label}」の期間と重なっています。期間が重ならないよう調整してください`
  }
  return null
}

export function resolveSeasonPeriodFromFields(
  fields: SeasonPeriodFields,
  otherSeasons: Season[],
  excludeSeasonId?: string,
): { ok: ResolvedSeasonPeriod } | { error: string } {
  const err = validateSeasonPeriodForSave(
    fields,
    otherSeasons,
    excludeSeasonId,
  )
  if (err) return { error: err }
  if (isSeasonPeriodFieldsEmpty(fields)) {
    return { ok: { kind: 'unset' } }
  }
  const start = seasonFieldsToDate(fields.startDate, fields.startTime)!
  const end = seasonFieldsToDate(fields.endDate, fields.endTime)!
  return {
    ok: {
      kind: 'set',
      startsAt: Timestamp.fromDate(start),
      endsAt: Timestamp.fromDate(end),
    },
  }
}

/** @deprecated validateSeasonPeriodForSave を使用 */
export function validateSeasonPeriodFields(
  fields: SeasonPeriodFields,
): string | null {
  return validateSeasonPeriodForSave(fields, [])
}

export function seasonFieldsToTimestamps(fields: SeasonPeriodFields): {
  startsAt: Timestamp
  endsAt: Timestamp
} {
  const resolved = resolveSeasonPeriodFromFields(fields, [])
  if ('error' in resolved) throw new Error(resolved.error)
  if (resolved.ok.kind === 'unset') {
    throw new Error('期間が未設定です')
  }
  return {
    startsAt: resolved.ok.startsAt,
    endsAt: resolved.ok.endsAt,
  }
}

export function seasonToPeriodFields(season: Season): SeasonPeriodFields {
  const start = season.startsAt?.toDate?.()
  const end = season.endsAt?.toDate?.()
  return {
    startDate: start ? toDateInputValue(start) : '',
    startTime: start ? toTimeInputValue(start) : DEFAULT_TIME,
    endDate: end ? toDateInputValue(end) : '',
    endTime: end ? toTimeInputValue(end) : DEFAULT_TIME,
  }
}

export function formatSeasonPeriodRange(season: Season): string {
  if (!season.startsAt || !season.endsAt) return '期間未設定'
  return `${formatTimestamp(season.startsAt)} ～ ${formatTimestamp(season.endsAt)}`
}

export function formatSeasonPeriodFromFields(fields: SeasonPeriodFields): string {
  if (isSeasonPeriodFieldsEmpty(fields)) return '期間未設定'
  const start = seasonFieldsToDate(fields.startDate, fields.startTime)
  const end = seasonFieldsToDate(fields.endDate, fields.endTime)
  if (!start || !end) return '期間未設定'
  return `${formatCompactDateTime(Timestamp.fromDate(start))} ～ ${formatCompactDateTime(Timestamp.fromDate(end))}`
}

/** ユーザー向けのコンパクト表示（例: 2026/6/10 15:00 ～ 2026/7/10 15:00） */
export function formatSeasonPeriodCompact(season: Season): string | null {
  if (!season.startsAt || !season.endsAt) return null
  return `${formatCompactDateTime(season.startsAt)} ～ ${formatCompactDateTime(season.endsAt)}`
}

export function getUserSeasonHeadline(season: Season): {
  main: string
  period: string | null
} {
  const phase = getSeasonPeriodPhase(season)
  const period = formatSeasonPeriodCompact(season)
  let suffix = '進行中'
  if (phase === 'current') suffix = '開催中'
  else if (phase === 'upcoming') suffix = '開始前'
  else if (phase === 'ended') suffix = '終了済み'
  return {
    main: `${season.label} ${suffix}`,
    period,
  }
}

function formatCompactDateTime(ts: Timestamp): string {
  const d = ts.toDate()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${h}:${min}`
}

export function getSeasonPeriodPhase(
  season: Season,
  nowMs = Date.now(),
): SeasonPeriodPhase {
  if (!season.startsAt || !season.endsAt) return 'unset'
  const start = season.startsAt.toMillis()
  const end = season.endsAt.toMillis()
  if (nowMs < start) return 'upcoming'
  if (nowMs > end) return 'ended'
  return 'current'
}

const PHASE_LABEL: Record<SeasonPeriodPhase, string> = {
  unset: '期間未設定',
  upcoming: '開始前',
  current: '開催中',
  ended: '終了',
}

export function getSeasonPeriodPhaseLabel(phase: SeasonPeriodPhase): string {
  return PHASE_LABEL[phase]
}

/** 期間内シーズンを優先して ID を返す。該当なしは configActiveSeasonId */
export function resolveActiveSeasonId(
  seasons: Season[],
  configActiveSeasonId: string,
  nowMs = Date.now(),
): string {
  const inPeriod = seasons
    .filter((s) => s.startsAt && s.endsAt)
    .filter((s) => {
      const start = s.startsAt!.toMillis()
      const end = s.endsAt!.toMillis()
      return nowMs >= start && nowMs <= end
    })
    .sort((a, b) => b.order - a.order)

  if (inPeriod.length > 0) return inPeriod[0].id
  return configActiveSeasonId
}

/** 採番モードに応じた有効シーズン ID（表示・新規試合共通） */
export function resolveGameSeasonId(
  seasons: Season[],
  configActiveSeasonId: string,
  mode: GameSeasonMode = DEFAULT_GAME_SEASON_MODE,
  nowMs = Date.now(),
): string {
  if (mode === 'period') {
    return resolveActiveSeasonId(seasons, configActiveSeasonId, nowMs)
  }
  return configActiveSeasonId
}

/** 採番表示用（期間内があればそれ、なければ config） */
export function resolveDisplayActiveSeason(
  seasons: Season[],
  configActiveSeasonId: string,
  nowMs = Date.now(),
): { id: string; fromPeriod: boolean } {
  const id = resolveActiveSeasonId(seasons, configActiveSeasonId, nowMs)
  const fromPeriod = seasons.some(
    (s) =>
      s.id === id &&
      s.startsAt &&
      s.endsAt &&
      nowMs >= s.startsAt.toMillis() &&
      nowMs <= s.endsAt.toMillis(),
  )
  return { id, fromPeriod }
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
