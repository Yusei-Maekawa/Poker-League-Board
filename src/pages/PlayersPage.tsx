import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { StickyFeedback } from '../components/StickyFeedback'
import { Loading } from '../components/Loading'
import { SeasonScopeSection } from '../components/SeasonUserDisplay'
import type { SeasonScope } from '../constants/seasons'
import { useAdmins } from '../hooks/useAdmins'
import { useGames } from '../hooks/useGames'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { useSeasons } from '../hooks/useSeasons'
import { useAuth } from '../hooks/useAuth'
import { buildRankingStats } from '../utils/ranking'
import { filterResultsBySeason } from '../utils/season'
import {
  FormerMemberAvatar,
  FormerMemberLabel,
} from '../components/FormerMemberDisplay'
import { isFormerMember, isPlayerAccountDeleted } from '../utils/playerAccount'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function PlayersPage() {
  const { user, myPlayer, hasPlayerProfile, canManageAdmins, isAdmin } = useAuth()
  const {
    admins,
    loading: adminsLoading,
    error: adminsError,
    addAdmin,
    removeAdmin,
  } = useAdmins(canManageAdmins)
  const { players, loading: playersLoading, banPlayer, unbanPlayer } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useResults()
  const { seasonsForRanking, activeSeasonId, seasonsLoading } = useSeasons()
  const [scopeOverride, setScopeOverride] = useState<SeasonScope | null>(null)

  const defaultScope = useMemo((): SeasonScope | null => {
    if (seasonsForRanking.some((s) => s.id === activeSeasonId)) {
      return activeSeasonId
    }
    if (seasonsForRanking.length > 0) return seasonsForRanking[0].id
    return null
  }, [activeSeasonId, seasonsForRanking])

  const scope = scopeOverride ?? defaultScope

  useEffect(() => {
    if (scope && !seasonsForRanking.some((s) => s.id === scope)) {
      setScopeOverride(
        seasonsForRanking.length > 0 ? seasonsForRanking[0].id : null,
      )
    }
  }, [scope, seasonsForRanking])

  const [adminForm, setAdminForm] = useState({ uid: '', note: '' })
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [removingAdminUid, setRemovingAdminUid] = useState('')

  const [playerBanSubmittingUid, setPlayerBanSubmittingUid] = useState('')
  const [playerBanError, setPlayerBanError] = useState('')
  const [banConfirm, setBanConfirm] = useState<{
    uid: string
    name: string
    /** true = BAN解除、false = BAN */
    unbanning: boolean
  } | null>(null)

  const openBanConfirm = (uid: string, name: string, unbanning: boolean) => {
    setBanConfirm({ uid, name, unbanning })
  }

  const closeBanConfirm = () => {
    if (playerBanSubmittingUid) return
    setBanConfirm(null)
  }

  const executeBanConfirm = async () => {
    if (!user || !banConfirm) return

    const { uid, unbanning } = banConfirm
    setPlayerBanError('')
    setAdminMessage('')
    setPlayerBanSubmittingUid(uid)
    try {
      if (unbanning) await unbanPlayer(uid)
      else await banPlayer(uid)
      setBanConfirm(null)
      setAdminMessage(
        unbanning ? 'BAN を解除しました' : 'プレイヤーを BAN しました',
      )
    } catch (e) {
      console.error(e)
      setPlayerBanError(
        getFirebaseErrorMessage(e, 'BAN の操作に失敗しました。再試行してください。'),
      )
    } finally {
      setPlayerBanSubmittingUid('')
    }
  }

  const handleAddAdmin = async () => {
    const uid = adminForm.uid.trim()

    if (!uid) {
      setAdminError('UID を入力してください')
      return
    }

    if (!user) {
      setAdminError('ログイン状態を確認してください')
      return
    }

    setAdminError('')
    setAdminMessage('')
    setAdminSubmitting(true)

    try {
      await addAdmin(uid, user.uid, adminForm.note)
      setAdminForm({ uid: '', note: '' })
      setAdminMessage('管理者を追加しました')
    } catch (e) {
      console.error(e)
      setAdminError(
        getFirebaseErrorMessage(e, '管理者の追加に失敗しました。'),
      )
    } finally {
      setAdminSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (uid: string) => {
    setAdminError('')
    setAdminMessage('')
    setRemovingAdminUid(uid)

    try {
      await removeAdmin(uid)
      setAdminMessage('管理者を削除しました')
    } catch (e) {
      console.error(e)
      setAdminError(
        getFirebaseErrorMessage(e, '管理者の削除に失敗しました。'),
      )
    } finally {
      setRemovingAdminUid('')
    }
  }

  const activePlayers = players.filter((p) => p.isActive)

  const scopedResults = useMemo(() => {
    if (!scope) return []
    return filterResultsBySeason(games, results, scope)
  }, [games, results, scope])

  const rankingStats = useMemo(
    () =>
      buildRankingStats(players, scopedResults, {
        participantsOnly: true,
      }),
    [players, scopedResults],
  )

  const totalPointMap = useMemo(
    () => new Map(rankingStats.map((stat) => [stat.player.id, stat.totalPoint])),
    [rankingStats],
  )
  const playCountMap = useMemo(
    () => new Map(rankingStats.map((stat) => [stat.player.id, stat.playCount])),
    [rankingStats],
  )

  const displayPlayers = useMemo(() => {
    const order = new Map(rankingStats.map((s, i) => [s.player.id, i]))
    return [...activePlayers]
      .filter((p) => order.has(p.id))
      .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
  }, [activePlayers, rankingStats])

  const loading =
    playersLoading || gamesLoading || resultsLoading || seasonsLoading

  const scopeSubtitle = scope
    ? `${displayPlayers.length}名（シーズン参加）`
    : `${activePlayers.length}名`

  return (
    <Layout>
      <PageHeader
        title="プレイヤー"
        subtitle={scopeSubtitle}
        action={
          <div className="flex flex-col items-end gap-2">
            {user && hasPlayerProfile ? (
              <Link to="/profile" className="btn-secondary text-sm">
                マイプロフィール
              </Link>
            ) : user ? (
              <Link to="/register" className="btn-primary text-sm">
                登録する
              </Link>
            ) : (
              <Link to="/register" className="btn-primary text-sm">
                新規登録
              </Link>
            )}
          </div>
        }
      />

      {user && !hasPlayerProfile && (
        <div className="card px-4 py-4 mb-6 border-gold-500/30">
          <p className="text-white/70 text-sm">
            プレイヤー登録がまだ完了していません。プロフィールを登録すると試合結果に参加できます。
          </p>
          <Link to="/register" className="btn-primary w-full mt-3 text-sm text-center block">
            プロフィールを登録する
          </Link>
        </div>
      )}

      {canManageAdmins && (
        <div className="card px-4 py-4 mb-6">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            管理者設定
          </h2>

          <div className="space-y-3">
            <div>
              <label className="label">追加する管理者 UID *</label>
              <input
                className="input font-mono"
                placeholder="例: abc123..."
                value={adminForm.uid}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, uid: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">
                メモ
                <span className="text-white/30 ml-1 font-normal">省略可</span>
              </label>
              <input
                className="input"
                placeholder="例: サブ管理者"
                value={adminForm.note}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, note: e.target.value })
                }
              />
            </div>

            <button
              onClick={handleAddAdmin}
              disabled={adminSubmitting}
              className="btn-primary w-full"
            >
              {adminSubmitting ? '追加中...' : '管理者を追加'}
            </button>

            <div className="pt-2 border-t border-white/10">
              <p className="text-white/40 text-xs mb-3">追加済みの管理者</p>

              {adminsLoading ? (
                <Loading />
              ) : admins.length === 0 ? (
                <p className="text-white/30 text-sm">
                  まだ追加された管理者はいません
                </p>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="bg-white/5 rounded-lg px-3 py-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-mono break-all">
                          {admin.uid}
                        </p>
                        {admin.note && (
                          <p className="text-white/40 text-xs mt-1">
                            {admin.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAdmin(admin.uid)}
                        disabled={removingAdminUid === admin.uid}
                        className="text-red-300 hover:text-red-200 text-xs transition-colors"
                      >
                        {removingAdminUid === admin.uid ? '削除中...' : '削除'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card px-4 py-4 mb-6 border-gold-500/20">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            プレイヤー BAN（無効化）
          </h2>

          <p className="text-white/40 text-sm mb-4">
            管理者だけがプレイヤーを無効化できます。無効化されたプレイヤーは新規参加・ランキングから外れます。
          </p>

          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white/5 rounded-lg px-3 py-3 flex items-start gap-3"
              >
                {isFormerMember(player) ? (
                  <FormerMemberAvatar size="md" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {player.icon || player.name.slice(0, 2)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate flex items-center gap-2 flex-wrap">
                    {isFormerMember(player) ? (
                      <FormerMemberLabel size="sm" />
                    ) : (
                      <span>{player.name}</span>
                    )}
                    <span className="text-white/30 text-xs font-mono font-normal">
                      ({player.id})
                    </span>
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    状態:{' '}
                    {isFormerMember(player)
                      ? 'WITHDRAWN'
                      : player.isActive
                        ? 'ACTIVE'
                        : 'BAN'}
                  </p>
                </div>

                {isPlayerAccountDeleted(player) ? (
                  <span className="text-white/35 text-xs shrink-0">操作不可</span>
                ) : player.isActive ? (
                  <button
                    type="button"
                    className="btn-secondary text-sm px-3 py-2"
                    onClick={() =>
                      openBanConfirm(player.id, player.name, false)
                    }
                    disabled={playerBanSubmittingUid === player.id}
                  >
                    {playerBanSubmittingUid === player.id ? 'BAN中...' : 'BAN'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary text-sm px-3 py-2"
                    onClick={() =>
                      openBanConfirm(player.id, player.name, true)
                    }
                    disabled={playerBanSubmittingUid === player.id}
                  >
                    {playerBanSubmittingUid === player.id ? '解除中...' : '解除'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {seasonsForRanking.length > 0 && scope ? (
        <SeasonScopeSection
          seasons={seasonsForRanking}
          value={scope}
          onChange={setScopeOverride}
          className="mb-5"
        />
      ) : !seasonsLoading ? (
        <p className="text-white/45 text-xs mb-5 leading-relaxed">
          シーズン未設定のため、シーズン別の成績は表示できません。
        </p>
      ) : null}

      {loading ? (
        <Loading />
      ) : activePlayers.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30">まだプレイヤーがいません</p>
        </div>
      ) : displayPlayers.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30 text-sm">
            このシーズンに参加したプレイヤーはいません
          </p>
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up">
          {displayPlayers.map((player) => {
            const count = playCountMap.get(player.id) ?? 0
            const totalPoint = totalPointMap.get(player.id) ?? 0
            const pointLabel = totalPoint >= 0 ? `+${totalPoint}` : `${totalPoint}`
            const isMe = myPlayer?.id === player.id

            return (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className={`card px-4 py-3 flex items-center gap-3 hover:border-white/15 transition-colors ${
                  isMe ? 'border-gold-500/30' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {player.icon || player.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {player.name}
                    {isMe && (
                      <span className="text-gold-400/80 text-xs ml-2">（あなた）</span>
                    )}
                  </p>
                  {player.memo && (
                    <p className="text-white/40 text-xs truncate">{player.memo}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-mono text-sm font-bold ${totalPoint >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                    {pointLabel}pt
                  </p>
                  <p className="text-white/50 text-xs">{count}試合</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {banConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65"
          aria-hidden={false}
          onClick={() => closeBanConfirm()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ban-dialog-title"
            className="card max-w-md w-full p-6 border border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="ban-dialog-title"
              className="font-display font-bold text-lg text-white"
            >
              {banConfirm.unbanning ? 'BANを解除しますか？' : 'プレイヤーをBANしますか？'}
            </h3>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              {banConfirm.unbanning ? (
                <>
                  「<span className="text-white">{banConfirm.name}</span>
                  」を再び一覧・試合参加・ランキングに含めます。
                </>
              ) : (
                <>
                  「<span className="text-white">{banConfirm.name}</span>
                  」を無効化します。新規の試合参加やランキング表示から外れます（過去の結果ドキュメントは残ります）。
                </>
              )}
            </p>
            <p className="text-white/35 text-xs font-mono mt-2 break-all">
              UID: {banConfirm.uid}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button
                type="button"
                className="btn-secondary flex-1 text-sm"
                onClick={() => closeBanConfirm()}
                disabled={!!playerBanSubmittingUid}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={
                  banConfirm.unbanning
                    ? 'btn-primary flex-1 text-sm'
                    : 'flex-1 text-sm py-2.5 rounded-lg font-medium border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50'
                }
                onClick={() => void executeBanConfirm()}
                disabled={!!playerBanSubmittingUid}
              >
                {playerBanSubmittingUid
                  ? '処理中...'
                  : banConfirm.unbanning
                    ? '解除する'
                    : 'BANする'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isAdmin || canManageAdmins) && (
        <StickyFeedback
          success={adminMessage}
          error={playerBanError || adminError || adminsError}
          onDismissSuccess={() => setAdminMessage('')}
          onDismissError={() => {
            setAdminError('')
            setPlayerBanError('')
          }}
        />
      )}
    </Layout>
  )
}
