import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { useAuth } from '../hooks/useAuth'
import { usePlayers } from '../hooks/usePlayers'
import { LimitedTextField } from '../components/LimitedTextField'
import { PresetIconPicker } from '../components/PresetIconPicker'
import { validatePlayerForm } from '../utils/validatePlayer'
import { PLAYER_LIMITS } from '../utils/validationLimits'
import { getFirebaseErrorMessage } from '../utils/firebaseError'
import { isDevelopmentLeague } from '../config/environment'

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    user,
    myPlayer,
    hasPlayerProfile,
    loading,
    isPlayerParticipationSuspended,
    isBootstrapAdmin,
    deleteOwnAccount,
  } = useAuth()
  const { updateOwnPlayer } = usePlayers()

  const [form, setForm] = useState({ name: '', icon: '', memo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!hasPlayerProfile) {
      navigate('/register', { replace: true })
    }
  }, [user, hasPlayerProfile, loading, navigate])

  useEffect(() => {
    if (!myPlayer) return
    setForm({
      name: myPlayer.name,
      icon: myPlayer.icon,
      memo: myPlayer.memo,
    })
  }, [myPlayer])

  const handleSubmit = async () => {
    if (!user || isPlayerParticipationSuspended) return

    const validationError = validatePlayerForm(form, {
      allowedNonPresetIcon: myPlayer?.icon,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await updateOwnPlayer(user.uid, form)
      navigate('/players')
    } catch (e) {
      console.error(e)
      setError(
        getFirebaseErrorMessage(e, 'プロフィールの更新に失敗しました。'),
      )
      setSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleting) return
    if (deleteConfirmText.trim() !== '退会') {
      setDeleteError('確認のため「退会」と入力してください')
      return
    }

    setDeleteError('')
    setDeleting(true)
    try {
      await deleteOwnAccount(user.uid)
      navigate('/', { replace: true })
    } catch (e) {
      console.error(e)
      setDeleteError(
        getFirebaseErrorMessage(e, '退会処理に失敗しました。'),
      )
      setDeleting(false)
    }
  }

  if (loading || !myPlayer) {
    return <Layout><Loading /></Layout>
  }

  return (
    <Layout>
      <Link
        to="/players"
        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"
      >
        ← プレイヤー一覧
      </Link>

      <PageHeader
        title="マイプロフィール"
        subtitle={
          isPlayerParticipationSuspended
            ? '参加資格停止中のためプロフィールの変更はできません'
            : '自分の表示名・アイコンを編集'
        }
      />

      {isPlayerParticipationSuspended && (
        <div className="card px-4 py-3 mb-4 border-amber-600/40 bg-amber-950/30">
          <p className="text-amber-200/90 text-sm font-medium">参加資格が停止されています</p>
          <p className="text-white/55 text-sm mt-2 leading-relaxed">
            プロフィールの編集・試合への参加はできません。詳細はリーグ運営にお問い合わせください。
          </p>
        </div>
      )}

      <div className="card px-4 py-4 space-y-4">
        <div className="space-y-4">
          <LimitedTextField
            label="名前"
            value={form.name}
            maxLength={PLAYER_LIMITS.name}
            hint="リーグ内の表示名（20文字まで）"
            disabled={isPlayerParticipationSuspended}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <PresetIconPicker
            label="アイコン"
            value={form.icon}
            disabled={isPlayerParticipationSuspended}
            onChange={(icon) => setForm({ ...form, icon })}
          />
          <LimitedTextField
            label="メモ"
            optional
            multiline
            value={form.memo}
            maxLength={PLAYER_LIMITS.memo}
            hint="自己紹介など（80文字まで）"
            disabled={isPlayerParticipationSuspended}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || isPlayerParticipationSuspended}
          className="btn-primary w-full"
        >
          {isPlayerParticipationSuspended
            ? '変更できません（参加停止中）'
            : submitting
              ? '保存中...'
              : '変更を保存'}
        </button>
      </div>

      <section className="mt-8 card px-4 py-4 border-red-500/25">
        <h2 className="text-red-300/90 text-sm font-semibold">退会</h2>
        <p className="text-white/50 text-sm mt-2 leading-relaxed">
          Rivalt から退会します。Google ログイン情報（Firebase Authentication）が削除され、
          プロフィールは非公開化されます（画面上の名前は「—」と表示）。
        </p>
        <ul className="text-white/40 text-xs mt-3 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>過去の試合結果への記録はリーグの履歴として残ります（名前は「—」と表示）</li>
          <li>同じ Google アカウントで再度登録すれば、新しいプロフィールとして参加できます</li>
          <li>退会後は元に戻せません</li>
        </ul>

        {isBootstrapAdmin && !isDevelopmentLeague() ? (
          <p className="text-amber-200/85 text-sm mt-4 leading-relaxed">
            初期管理者は退会できません。別の管理者を追加してから運用を引き継いでください。
          </p>
        ) : !deleteConfirmOpen ? (
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmOpen(true)
              setDeleteConfirmText('')
              setDeleteError('')
            }}
            className="mt-4 w-full rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-2.5 text-red-200/90 text-sm font-medium hover:bg-red-950/50 transition-colors"
          >
            退会する…
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-red-200/80 text-sm font-medium">
              本当に退会しますか？ 下の欄に <strong className="text-red-100">退会</strong>{' '}
              と入力してください。
            </p>
            <input
              className="input"
              value={deleteConfirmText}
              placeholder="退会"
              disabled={deleting}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText.trim() !== '退会'}
                className="flex-1 rounded-lg bg-red-600/80 hover:bg-red-600 px-4 py-2.5 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {deleting ? '退会処理中...' : '退会する'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleting) return
                  setDeleteConfirmOpen(false)
                  setDeleteConfirmText('')
                  setDeleteError('')
                }}
                disabled={deleting}
                className="btn-secondary text-sm px-4"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  )
}
