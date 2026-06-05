import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Firestore パス定数
/**
 * Firestore のリーグID。
 * - 本番: main
 * - テスト: dev など別ID（番号やデータを汚さない）
 */
export const LEAGUE_ID: string = import.meta.env.VITE_LEAGUE_ID ?? 'main'
/** @deprecated 新規試合は config/league.activeSeasonId を使用 */
export const SEASON_ID = 'season1'

export const paths = {
  admins: `leagues/${LEAGUE_ID}/admins`,
  players: `leagues/${LEAGUE_ID}/players`,
  games: `leagues/${LEAGUE_ID}/games`,
  results: `leagues/${LEAGUE_ID}/results`,
  announcements: `leagues/${LEAGUE_ID}/announcements`,
  activities: `leagues/${LEAGUE_ID}/activities`,
  seasons: `leagues/${LEAGUE_ID}/seasons`,
  leagueConfig: `leagues/${LEAGUE_ID}/config/league`,
  counters: `leagues/${LEAGUE_ID}/counters`,
  /** v0.3 以前のリーグ通しカウンター（削除対象） */
  legacyGameCounter: `leagues/${LEAGUE_ID}/counters/games`,
  /** シーズンごとの試合番号カウンター（nextGameNo） */
  gameCounter: (seasonId: string) =>
    `leagues/${LEAGUE_ID}/counters/${seasonId}`,
}
