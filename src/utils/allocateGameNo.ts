import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { DEFAULT_SEASON_ID } from '../constants/seasons'
import type { Season } from '../types'
import { repairGameActivities } from './activityFeed'
import { getGameSeasonId } from './season'

function gameBelongsToSeason(
  data: { seasonId?: string },
  seasonId: string,
): boolean {
  const sid = data.seasonId?.trim() || DEFAULT_SEASON_ID
  return sid === seasonId
}

/** カウンター未作成時に同一シーズンの既存試合から nextGameNo を初期化 */
export async function ensureGameCounterInitialized(
  db: Firestore,
  gamesPath: string,
  counterPath: string,
  seasonId: string,
): Promise<void> {
  const counterRef = doc(db, counterPath)
  const snap = await getDoc(counterRef)
  if (snap.exists()) return

  const gamesSnap = await getDocs(collection(db, gamesPath))
  let maxNo = 0
  for (const gameDoc of gamesSnap.docs) {
    if (!gameBelongsToSeason(gameDoc.data(), seasonId)) continue
    const n = gameDoc.data().gameNo
    if (typeof n === 'number' && n > maxNo) maxNo = n
  }

  await setDoc(counterRef, { nextGameNo: maxNo + 1 })
}

/** シーズン内の不変通し番号を1つ採番（削除しても再利用しない） */
export async function allocateGameNo(
  db: Firestore,
  gamesPath: string,
  counterPath: string,
  seasonId: string,
): Promise<number> {
  await ensureGameCounterInitialized(db, gamesPath, counterPath, seasonId)
  const counterRef = doc(db, counterPath)

  return runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    if (!counterSnap.exists()) {
      throw new Error('試合番号カウンターの初期化に失敗しました')
    }
    const nextGameNo = counterSnap.data().nextGameNo as number
    if (typeof nextGameNo !== 'number' || nextGameNo < 1) {
      throw new Error('試合番号カウンターが不正です')
    }
    transaction.update(counterRef, { nextGameNo: nextGameNo + 1 })
    return nextGameNo
  })
}

/** 手動で gameNo を大きくしたあと、同一シーズンの新規採番が重複しないようカウンターを繰り上げる */
export async function bumpGameCounterFromGames(
  db: Firestore,
  gamesPath: string,
  counterPath: string,
  seasonId: string,
): Promise<void> {
  await ensureGameCounterInitialized(db, gamesPath, counterPath, seasonId)

  const gamesSnap = await getDocs(collection(db, gamesPath))
  let maxNo = 0
  for (const gameDoc of gamesSnap.docs) {
    if (!gameBelongsToSeason(gameDoc.data(), seasonId)) continue
    const n = gameDoc.data().gameNo
    if (typeof n === 'number' && n > maxNo) maxNo = n
  }
  const requiredNext = maxNo + 1

  const counterRef = doc(db, counterPath)
  await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    if (!counterSnap.exists()) return
    const nextGameNo = counterSnap.data().nextGameNo as number
    if (typeof nextGameNo !== 'number' || nextGameNo < requiredNext) {
      transaction.update(counterRef, { nextGameNo: requiredNext })
    }
  })
}

/** 試合一覧からシーズンごとの max(gameNo) を集計 */
export function computeNextGameNoBySeason(
  games: { seasonId?: string; gameNo: number }[],
  seasonIds: string[],
): Record<string, number> {
  const maxBySeason = new Map<string, number>()
  for (const seasonId of seasonIds) {
    maxBySeason.set(seasonId, 0)
  }

  for (const game of games) {
    const seasonId = getGameSeasonId(game)
    if (!maxBySeason.has(seasonId)) {
      maxBySeason.set(seasonId, 0)
    }
    if (game.gameNo > maxBySeason.get(seasonId)!) {
      maxBySeason.set(seasonId, game.gameNo)
    }
  }

  const result: Record<string, number> = {}
  for (const [seasonId, maxNo] of maxBySeason) {
    result[seasonId] = maxNo + 1
  }
  return result
}

export interface RepairGameCountersResult {
  nextBySeason: Record<string, number>
  removedLegacyCounter: boolean
  removedOrphanActivities: number
  updatedActivityGameNos: number
  /** counters は成功したが activities の整理が Rules 等で失敗した */
  activityRepairFailed: boolean
}

export interface RepairGameCountersOnlyResult {
  nextBySeason: Record<string, number>
  removedLegacyCounter: boolean
}

/**
 * シーズン別 counters/{seasonId} を試合データから再計算し、
 * 旧 counters/games を削除する。
 */
export async function repairGameCounters(
  db: Firestore,
  gamesPath: string,
  countersPath: string,
  legacyCounterPath: string,
  activitiesPath: string,
  seasonIds: string[],
  seasons: Pick<Season, 'id' | 'label'>[],
): Promise<RepairGameCountersResult> {
  const countersResult = await repairGameCountersFromGamesOnly(
    db,
    gamesPath,
    countersPath,
    legacyCounterPath,
    seasonIds,
  )

  let activityResult = {
    removedOrphanActivities: 0,
    updatedActivityGameNos: 0,
  }
  let activityRepairFailed = false
  try {
    activityResult = await repairGameActivities(
      db,
      gamesPath,
      activitiesPath,
      seasons,
    )
  } catch (err) {
    activityRepairFailed = true
    console.error('repairGameActivities failed:', err)
  }

  return {
    nextBySeason: countersResult.nextBySeason,
    removedLegacyCounter: countersResult.removedLegacyCounter,
    removedOrphanActivities: activityResult.removedOrphanActivities,
    updatedActivityGameNos: activityResult.updatedActivityGameNos,
    activityRepairFailed,
  }
}

/**
 * シーズン別 counters/{seasonId} を試合データから再計算し、
 * 旧 counters/games を削除する（activities は触らない）。
 */
export async function repairGameCountersFromGamesOnly(
  db: Firestore,
  gamesPath: string,
  countersPath: string,
  legacyCounterPath: string,
  seasonIds: string[],
): Promise<RepairGameCountersOnlyResult> {
  const gamesSnap = await getDocs(collection(db, gamesPath))
  const games = gamesSnap.docs.map((d) => {
    const data = d.data()
    return {
      seasonId: data.seasonId as string | undefined,
      gameNo: data.gameNo as number,
    }
  })

  const allSeasonIds = new Set(seasonIds)
  for (const game of games) {
    allSeasonIds.add(getGameSeasonId(game))
  }

  const nextBySeason = computeNextGameNoBySeason(games, [...allSeasonIds])
  const batch = writeBatch(db)

  for (const [seasonId, nextGameNo] of Object.entries(nextBySeason)) {
    batch.set(doc(db, countersPath, seasonId), { nextGameNo })
  }

  const legacyRef = doc(db, legacyCounterPath)
  const legacySnap = await getDoc(legacyRef)
  let removedLegacyCounter = false
  if (legacySnap.exists()) {
    batch.delete(legacyRef)
    removedLegacyCounter = true
  }

  await batch.commit()
  return {
    nextBySeason,
    removedLegacyCounter,
  }
}

