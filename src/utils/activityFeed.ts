import type { Timestamp } from 'firebase/firestore'
import type { Activity, ActivityType } from '../types'
import { formatGameDateTime, formatRelativeTime } from './formatDateTime'

/** 新着バッジを付ける経過時間（時間） */
export const ACTIVITY_NEW_HOURS = 1

export function isWithinLastHours(
  ts: Timestamp | null | undefined,
  hours: number,
): boolean {
  if (!ts || typeof ts.toDate !== 'function') return false
  const ageMs = Date.now() - ts.toDate().getTime()
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000
}

export function isActivityNew(activity: Pick<Activity, 'createdAt'>): boolean {
  return isWithinLastHours(activity.createdAt, ACTIVITY_NEW_HOURS)
}

export function countNewActivities(activities: Activity[]): number {
  return activities.filter(isActivityNew).length
}

export type ActivityDisplayMeta = {
  icon: string
  title: string
  /** 日時の補足（1行。試合は開催日時 · 相対、参加は相対のみ） */
  timeLabel: string | null
}

export function getActivityTimeLabel(activity: Activity): string | null {
  const relative = formatRelativeTime(activity.createdAt)
  if (!relative) return null

  if (activity.type === 'game_added' && activity.gameDate) {
    const event = formatGameDateTime(activity.gameDate, activity.gameTime)
    return `${event} · ${relative}`
  }

  return relative
}

export function getActivityDisplayMeta(activity: Activity): ActivityDisplayMeta {
  const timeLabel = getActivityTimeLabel(activity)

  if (activity.type === 'member_joined') {
    const name = activity.playerName?.trim() || 'メンバー'
    return {
      icon: '👋',
      title: `${name} さんがリーグに参加しました`,
      timeLabel,
    }
  }
  if (activity.type === 'game_added') {
    const no = activity.gameNo != null ? `第${activity.gameNo}戦` : '試合'
    return {
      icon: '🎮',
      title: `${no}の結果が追加されました`,
      timeLabel,
    }
  }
  return {
    icon: '·',
    title: '',
    timeLabel,
  }
}

export function getActivityTypeLabel(type: ActivityType): string {
  switch (type) {
    case 'member_joined':
      return 'メンバー参加'
    case 'game_added':
      return '試合結果'
    default:
      return ''
  }
}
