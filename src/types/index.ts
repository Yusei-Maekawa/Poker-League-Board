import { Timestamp } from 'firebase/firestore'

export interface Player {
  id: string
  authUid?: string   // Firebase UID（1アカウント1プレイヤー。旧データは未設定の場合あり）
  name: string
  icon: string       // 絵文字 or 1〜2文字のイニシャル
  memo: string
  isActive: boolean
  /** 退会日時。設定時は Auth 削除済みの匿名プロフィール */
  deletedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AdminUser {
  id: string
  uid: string
  note: string
  addedBy: string
  createdAt: Timestamp
}

/** シーズン別ポイント（未設定時はリーグ標準） */
export interface SeasonPointRules {
  rank1: number
  rank2: number
  rank3: number
  rank4: number
  /** 5位以下（最下位以外） */
  rank5Plus: number
  /** 最下位（順位ポイントより優先） */
  lastPlace: number
}

export interface Season {
  id: string
  label: string
  order: number
  /** 試合登録時の pt 計算。未設定は標準ルール（+7/+5/…/-2） */
  pointRules?: SeasonPointRules
  /** シーズン開始（未設定の旧データは config の採番シーズンのみで運用） */
  startsAt?: Timestamp
  /** シーズン終了（この日時を含む） */
  endsAt?: Timestamp
  /** @deprecated 期間（startsAt / endsAt）で判断。新規書き込みでは使わない */
  status?: 'active' | 'closed'
  /** ランキングのシーズン切替に出すか。未設定・true = 表示、false = 非表示 */
  showInRanking?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** 試合採番: manual=管理者が選んだシーズン / period=期間内を自動 */
export type GameSeasonMode = 'manual' | 'period'

export interface LeagueConfig {
  activeSeasonId: string
  /** 未設定は manual */
  gameSeasonMode?: GameSeasonMode
  updatedAt: Timestamp
}

export interface Game {
  id: string
  gameNo: number
  /** 未設定の旧データは season1 扱い */
  seasonId?: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:mm（開催時刻）
  appName: string
  memo: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ActivityType = 'member_joined' | 'game_added'

/** お知らせの種別（表示ラベルは announcementCategories を参照） */
export type AnnouncementCategory = 'important' | 'update' | 'bugfix'

export interface Announcement {
  id: string
  title: string
  body: string
  /** 未設定の旧データはアプリ側で update 扱い */
  category?: AnnouncementCategory
  isPinned: boolean
  authorUid: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** ユーザーごとのお知らせ既読（players/{uid}/announcementReads/{announcementId}） */
export interface AnnouncementRead {
  readAt: Timestamp
}

export interface Activity {
  id: string
  type: ActivityType
  createdAt: Timestamp
  playerId?: string
  playerName?: string
  gameId?: string
  gameNo?: number
  gameDate?: string
  gameTime?: string
  /** game_added の採番シーズン（スナップショット） */
  seasonId?: string
  /** game_added の表示名スナップショット */
  seasonLabel?: string
  actorUid?: string
}

export interface Result {
  id: string
  gameId: string
  playerId: string
  rank: number
  point: number
  createdAt: Timestamp
}

// 集計用
export interface RankingStat {
  player: Player
  totalPoint: number
  playCount: number
  winCount: number       // 1位回数
  podiumCount: number    // 3位以内回数
  lastPlaceCount: number // 最下位回数
  avgRank: number
  podiumRate: number     // 入賞率 (3位以内 / 参加)
  /** 参加した試合の平均テーブル人数 */
  avgTableSize: number
}

export interface GameWithResults {
  game: Game
  results: ResultWithPlayer[]
}

export interface ResultWithPlayer extends Result {
  player: Player
}
