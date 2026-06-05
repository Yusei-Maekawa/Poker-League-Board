/** クライアント・Firestore Rules と揃える文字数上限（単一の参照元） */

export const GAME_LIMITS = {
  appName: 40,
  memo: 100,
  maxParticipants: 20,
  gameNoMin: 1,
  gameNoMax: 9999,
} as const

export const PLAYER_LIMITS = {
  name: 20,
  icon: 4,
  memo: 80,
} as const

export const ANNOUNCEMENT_LIMITS = {
  title: 60,
  body: 2000,
} as const

/** シーズン表示名（ランキング切替・日程などに表示。ID は season1 形式のまま） */
export const SEASON_LIMITS = {
  label: 24,
} as const
