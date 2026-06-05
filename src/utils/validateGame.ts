import { GAME_LIMITS } from './validationLimits'
import { getLocalDateString } from './formatDateTime'

const MAX_APP_NAME_LEN = GAME_LIMITS.appName
const MAX_MEMO_LEN = GAME_LIMITS.memo

export function validateGameForm(
  date: string,
  appName: string,
  memo: string,
  selectedPlayerIds: string[],
  rankMap: Record<string, number>,
): string | null {
  if (!date) return '日付を入力してください'

  const today = getLocalDateString()
  if (date > today) return '未来の日付は入力できません'

  const trimmedAppName = appName.trim()
  if (!trimmedAppName) return 'アプリ名を入力してください'
  if (trimmedAppName.length > MAX_APP_NAME_LEN) {
    return `アプリ名は${MAX_APP_NAME_LEN}文字以内で入力してください`
  }
  if (memo.trim().length > MAX_MEMO_LEN) {
    return `メモは${MAX_MEMO_LEN}文字以内で入力してください`
  }

  if (selectedPlayerIds.length < 2) {
    return '参加者を2名以上選択してください'
  }
  if (selectedPlayerIds.length > 20) {
    return '参加者は20名までです'
  }

  const n = selectedPlayerIds.length
  const usedRanks = new Set<number>()

  for (const playerId of selectedPlayerIds) {
    const rank = rankMap[playerId]

    if (rank === undefined || rank === null || Number.isNaN(rank)) {
      return 'すべての参加者に順位を入力してください'
    }
    if (!Number.isInteger(rank)) {
      return '順位は整数で入力してください'
    }
    if (rank < 1 || rank > n) {
      return `順位は1〜${n}の範囲で入力してください`
    }
    if (usedRanks.has(rank)) {
      return `同じ順位が重複しています（${rank}位）`
    }
    usedRanks.add(rank)
  }

  if (usedRanks.size !== n) {
    return '順位は1から連番で入力してください（欠けている順位があります）'
  }

  return null
}

export function parseRankInput(value: string): number | undefined {
  if (value === '') return undefined
  const rank = Number(value)
  if (!Number.isInteger(rank) || rank < 1) return undefined
  return rank
}
