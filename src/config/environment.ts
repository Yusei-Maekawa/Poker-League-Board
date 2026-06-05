import { LEAGUE_ID } from '../firebase'

/** 本番リーグ（友達リーグの本番データ） */
export const PRODUCTION_LEAGUE_ID = 'main'

/** テスト用リーグなど、本番以外のデータを参照している */
export function isDevelopmentLeague(): boolean {
  return LEAGUE_ID !== PRODUCTION_LEAGUE_ID
}

/** 初期管理者の退会。本番 main では不可、テスト用リーグでは検証のため許可 */
export function canBootstrapAdminWithdraw(): boolean {
  return isDevelopmentLeague()
}
