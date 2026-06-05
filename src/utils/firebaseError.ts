export function getFirebaseErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  switch (code) {
    case 'permission-denied':
      return 'この操作を行う権限がありません。管理者としてログインしているか、Firestore Rules が最新か確認してください。'
    case 'auth/requires-recent-login':
      return 'セキュリティのため、一度ログアウトしてから再度 Google でログインし、もう一度お試しください。'
    case 'unavailable':
      return 'Firebase に接続できません。通信環境を確認して再試行してください。'
    default:
      return fallbackMessage
  }
}
