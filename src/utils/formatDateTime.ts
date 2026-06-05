import type { Timestamp } from 'firebase/firestore'

/** ローカルタイムゾーンの今日（YYYY-MM-DD）。date 入力・未来日チェック用 */
export function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** gameTime を HH:mm に正規化（不正値は無視） */
export function normalizeGameTime(time?: string): string | undefined {
  if (!time?.trim()) return undefined
  const trimmed = time.trim()
  if (/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) return trimmed
  return undefined
}

/** 開催日（YYYY-MM-DD）と任意の時刻（HH:mm）を表示用に整形 */
export function formatGameDateTime(date: string, time?: string): string {
  const [y, m, d] = date.split('-')
  if (!y || !m || !d) return date
  const base = `${y}年${Number(m)}月${Number(d)}日`
  const normalized = normalizeGameTime(time)
  if (!normalized) return base
  return `${base} ${normalized}`
}

/** Firestore Timestamp を JST 風の絶対日時表示（秒なし） */
export function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return ''
  const date = ts.toDate()
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${d}日 ${h}:${min}`
}

/** 経過時間の日本語表示（たった今 / N分前 / … / 7日超は絶対日時） */
export function formatRelativeTime(
  ts: Timestamp | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!ts || typeof ts.toDate !== 'function') return ''
  const date = ts.toDate()
  const diffMs = nowMs - date.getTime()
  if (diffMs < 0) return formatTimestamp(ts)

  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}日前`

  return formatTimestamp(ts)
}

/** 絶対日時と相対時間を併記（例: 2025年5月29日 21:50 · 3分前） */
export function formatDateTimeWithRelative(
  ts: Timestamp | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!ts || typeof ts.toDate !== 'function') return ''
  const absolute = formatTimestamp(ts)
  const relative = formatRelativeTime(ts, nowMs)
  if (!absolute) return relative
  if (!relative || relative === absolute) return absolute
  return `${absolute} · ${relative}`
}

export function getDefaultGameTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
