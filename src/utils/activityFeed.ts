import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import type { Activity, ActivityType, Season } from '../types'
import { formatGameDateTime, formatRelativeTime } from './formatDateTime'
import { getGameSeasonId, getSeasonLabelForGame } from './season'

const FIRESTORE_BATCH_LIMIT = 450

export type GameActivityRepairPlan = {
  deleteIds: string[]
  updates: {
    id: string
    gameNo: number
    seasonId: string
    seasonLabel: string
  }[]
}

/** 削除済み試合の game_added を削除し、残りを試合 doc に合わせる */
export function planGameActivityRepairs(
  games: { id: string; gameNo: number; seasonId?: string }[],
  activities: {
    id: string
    type: ActivityType
    gameId?: string
    gameNo?: number
    seasonId?: string
    seasonLabel?: string
  }[],
  seasons: Pick<Season, 'id' | 'label'>[],
): GameActivityRepairPlan {
  const gameById = new Map(games.map((g) => [g.id, g]))
  const deleteIds: string[] = []
  const updates: GameActivityRepairPlan['updates'] = []

  for (const activity of activities) {
    if (activity.type !== 'game_added') continue
    const gameId = activity.gameId?.trim()
    const game = gameId ? gameById.get(gameId) : undefined
    if (!gameId || !game) {
      deleteIds.push(activity.id)
      continue
    }
    const expectedNo = game.gameNo
    const expectedSeasonId = getGameSeasonId(game)
    const expectedSeasonLabel = getSeasonLabelForGame(game, seasons)
    const needsUpdate =
      activity.gameNo !== expectedNo ||
      activity.seasonId !== expectedSeasonId ||
      activity.seasonLabel !== expectedSeasonLabel
    if (needsUpdate) {
      updates.push({
        id: activity.id,
        gameNo: expectedNo,
        seasonId: expectedSeasonId,
        seasonLabel: expectedSeasonLabel,
      })
    }
  }

  return { deleteIds, updates }
}

/** 表示用シーズン名（アクティビティ保存値 → 試合 doc からの解決） */
export function resolveActivitySeasonLabel(
  activity: Pick<Activity, 'type' | 'seasonId' | 'seasonLabel'>,
  seasons: Pick<Season, 'id' | 'label'>[],
  gameSeasonId?: string | null,
): string | null {
  if (activity.type !== 'game_added') return null
  const snapshot = activity.seasonLabel?.trim()
  if (snapshot) return snapshot
  const seasonId = activity.seasonId?.trim() || gameSeasonId?.trim()
  if (!seasonId) return null
  return seasons.find((s) => s.id === seasonId)?.label ?? seasonId
}

export interface RepairGameActivitiesResult {
  removedOrphanActivities: number
  updatedActivityGameNos: number
}

export async function repairGameActivities(
  db: Firestore,
  gamesPath: string,
  activitiesPath: string,
  seasons: Pick<Season, 'id' | 'label'>[],
): Promise<RepairGameActivitiesResult> {
  const gamesSnap = await getDocs(collection(db, gamesPath))
  const games = gamesSnap.docs
    .map((d) => ({
      id: d.id,
      gameNo: d.data().gameNo as number,
      seasonId: d.data().seasonId as string | undefined,
    }))
    .filter((g) => typeof g.gameNo === 'number')

  const activitiesSnap = await getDocs(collection(db, activitiesPath))
  const activities = activitiesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Pick<
    Activity,
    'id' | 'type' | 'gameId' | 'gameNo' | 'seasonId' | 'seasonLabel'
  >[]

  const plan = planGameActivityRepairs(games, activities, seasons)
  let batch = writeBatch(db)
  let opCount = 0

  const flush = async () => {
    if (opCount === 0) return
    await batch.commit()
    batch = writeBatch(db)
    opCount = 0
  }

  for (const id of plan.deleteIds) {
    batch.delete(doc(db, activitiesPath, id))
    opCount++
    if (opCount >= FIRESTORE_BATCH_LIMIT) await flush()
  }

  for (const { id, gameNo, seasonId, seasonLabel } of plan.updates) {
    batch.update(doc(db, activitiesPath, id), { gameNo, seasonId, seasonLabel })
    opCount++
    if (opCount >= FIRESTORE_BATCH_LIMIT) await flush()
  }

  await flush()

  return {
    removedOrphanActivities: plan.deleteIds.length,
    updatedActivityGameNos: plan.updates.length,
  }
}

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

export function getActivityDisplayMeta(
  activity: Activity,
  options?: { seasonLabel?: string | null },
): ActivityDisplayMeta {
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
    const seasonLabel = options?.seasonLabel?.trim()
    const seasonPrefix = seasonLabel ? `「${seasonLabel}」` : ''
    return {
      icon: '🎮',
      title: `${seasonPrefix}${no}の結果が追加されました`,
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
