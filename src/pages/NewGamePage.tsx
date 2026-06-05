import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { StickyFeedback } from '../components/StickyFeedback'
import { Loading } from '../components/Loading'
import { usePlayers, useActivePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { suggestNextGameNo } from '../utils/validateGameNo'
import { useAuth } from '../hooks/useAuth'
import { useSeasons } from '../hooks/useSeasons'
import { calculatePoint } from '../utils/point'
import { getPointRulesForSeason } from '../utils/seasonPointRules'
import { LimitedTextField } from '../components/LimitedTextField'
import { validateGameForm, parseRankInput } from '../utils/validateGame'
import { GAME_LIMITS } from '../utils/validationLimits'
import { getFirebaseErrorMessage } from '../utils/firebaseError'
import { getLocalDateString } from '../utils/formatDateTime'
import { CPU_PARTICIPANTS } from '../constants/cpuPlayers'
import { resolveParticipant } from '../utils/gameParticipant'

export function NewGamePage() {
  const navigate = useNavigate()
  const { isAdmin, loading: authLoading } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading, addGameWithResults } = useGames()
  const { seasons, activeSeasonId } = useSeasons()

  const gameSeason = seasons.find((s) => s.id === activeSeasonId)

  const pointRules = useMemo(
    () => getPointRulesForSeason(gameSeason),
    [gameSeason],
  )

  const nextGameNo = useMemo(
    () => suggestNextGameNo(games, activeSeasonId),
    [games, activeSeasonId],
  )

  const activePlayers = useActivePlayers(players).filter((p) => p.authUid)

  const [date, setDate] = useState(getLocalDateString)
  const [appName, setAppName] = useState('PokerStars')
  const [memo, setMemo] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [rankMap, setRankMap] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (authLoading || playersLoading || gamesLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    )
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="card py-12 text-center">
          <p className="text-white/50 mb-4">管理者ログインが必要です</p>
          <Link to="/" className="btn-secondary text-sm">ホームへ</Link>
        </div>
      </Layout>
    )
  }

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    )
    // 選択解除時にrankMapからも消す
    setRankMap((prev) => {
      const next = { ...prev }
      if (next[playerId]) delete next[playerId]
      return next
    })
  }

  const setRank = (playerId: string, rank: number | undefined) => {
    setRankMap((prev) => {
      if (rank === undefined) {
        const next = { ...prev }
        delete next[playerId]
        return next
      }
      return { ...prev, [playerId]: rank }
    })
  }

  const handleSubmit = async () => {
    const validationError = validateGameForm(
      date,
      appName,
      memo,
      selectedPlayerIds,
      rankMap,
    )
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const n = selectedPlayerIds.length
      const entries = selectedPlayerIds.map((playerId) => {
        const rank = rankMap[playerId]
        const point = calculatePoint(rank, n, pointRules)
        return { playerId, rank, point }
      })

      const { id: gameId } = await addGameWithResults({
        date,
        appName,
        memo,
        entries,
      })

      navigate(`/games/${gameId}`)
    } catch (e) {
      console.error(e)
      setError(
        getFirebaseErrorMessage(
          e,
          '保存に失敗しました。再試行してください。',
        ),
      )
      setSubmitting(false)
    }
  }

  const n = selectedPlayerIds.length

  return (
    <Layout>
      <Link to="/games" className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block">
        ← 試合一覧
      </Link>

      <PageHeader title="試合結果を追加" />

      <div className="space-y-5">
        {/* 基本情報 */}
        <div className="card px-4 py-4 space-y-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            基本情報
          </h2>

          <div className="rounded-lg bg-gold-500/10 border border-gold-500/25 px-3 py-3">
            <p className="text-white/50 text-xs mb-1">採番（自動）</p>
            <p className="text-white text-sm">
              <span className="text-gold-400/90 font-medium">
                {gameSeason?.label ?? activeSeasonId}
              </span>
              <span className="text-white/40 mx-2">·</span>
              <span className="font-mono text-white/80">第{nextGameNo}戦</span>
            </p>
            <p className="text-white/40 text-xs mt-2 leading-relaxed">
              シーズンと番号は
              <Link
                to="/admin/seasons"
                className="text-gold-400/80 hover:text-gold-300 mx-1"
              >
                シーズン管理
              </Link>
              の「試合採番シーズン」で変更できます。
            </p>
          </div>

          <div>
            <label className="label">開催日 *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <LimitedTextField
            label="使用アプリ名"
            placeholder="例: PokerStars, GGPoker"
            value={appName}
            maxLength={GAME_LIMITS.appName}
            hint="ポーカーアプリ名（40文字まで）"
            onChange={(e) => setAppName(e.target.value)}
          />

          <LimitedTextField
            label="メモ"
            optional
            multiline
            placeholder="例: 友達宅で4人戦"
            value={memo}
            maxLength={GAME_LIMITS.memo}
            hint="試合の補足（100文字まで・Discord共有文にも載ります）"
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {/* 参加者選択 */}
        <div className="card px-4 py-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            参加者を選択
            <span className="text-white/30 normal-case ml-2 font-normal">
              （{selectedPlayerIds.length}名 · 2〜{GAME_LIMITS.maxParticipants}名）
            </span>
          </h2>

          {activePlayers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-white/30 text-sm mb-3">プレイヤーがいません</p>
              <Link to="/players" className="text-gold-400 text-sm hover:text-gold-300">
                プレイヤーを追加する →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activePlayers.map((player) => {
                const selected = selectedPlayerIds.includes(player.id)
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 ${
                      selected
                        ? 'bg-gold-500/15 border-gold-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="text-base">{player.icon || player.name.slice(0, 2)}</span>
                    <span className="text-sm font-medium truncate">{player.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <p className="text-white/50 text-xs mb-2">CPU 相手（アプリ内の仮想参加者）</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CPU_PARTICIPANTS.map((cpu) => {
                const selected = selectedPlayerIds.includes(cpu.id)
                return (
                  <button
                    key={cpu.id}
                    type="button"
                    onClick={() => togglePlayer(cpu.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 ${
                      selected
                        ? 'bg-violet-500/15 border-violet-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="text-base">{cpu.icon}</span>
                    <span className="text-sm font-medium">{cpu.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 順位入力 */}
        {selectedPlayerIds.length >= 2 && (
          <div className="card px-4 py-4">
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
              順位を入力
              <span className="text-white/30 normal-case ml-2 font-normal">（1〜{n}位）</span>
            </h2>

            <div className="space-y-2">
              {selectedPlayerIds.map((pid) => {
                const participant = resolveParticipant(pid, players)
                if (!participant) return null
                const rank = rankMap[pid] ?? ''
                const point = rank ? calculatePoint(Number(rank), n, pointRules) : null

                return (
                  <div key={pid} className="flex items-center gap-3 bg-white/4 rounded-lg px-3 py-2.5">
                    <span className="text-base flex-shrink-0">
                      {participant.icon}
                    </span>
                    <span className="flex-1 text-white text-sm font-medium truncate">
                      {participant.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {point !== null && (
                        <span className={`font-mono text-xs w-12 text-right ${point >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                          {point >= 0 ? `+${point}` : point}pt
                        </span>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={n}
                        className="input w-16 text-center text-base font-mono py-1.5"
                        placeholder="—"
                        value={rank}
                        onChange={(e) => setRank(pid, parseRankInput(e.target.value))}
                      />
                      <span className="text-white/40 text-sm">位</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* プレビュー */}
            {selectedPlayerIds.every((pid) => rankMap[pid]) && (
              <div className="mt-4 pt-4 border-t border-white/[0.08]">
                <p className="text-white/40 text-xs mb-2">プレビュー（順位順）</p>
                <div className="space-y-1">
                  {[...selectedPlayerIds]
                    .sort((a, b) => (rankMap[a] ?? 99) - (rankMap[b] ?? 99))
                    .map((pid) => {
                      const participant = resolveParticipant(pid, players)
                      const rank = rankMap[pid]
                      const point = calculatePoint(rank, n, pointRules)
                      const emoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
                      return (
                        <div key={pid} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-center">{emoji[rank] ?? `${rank}位`}</span>
                          {!emoji[rank] && <span className="w-6 text-center text-white/50 text-xs">{rank}位</span>}
                          <span className="flex-1 text-white/80">{participant?.name}</span>
                          <span className={`font-mono text-xs ${point >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                            {point >= 0 ? `+${point}` : point}pt
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 保存ボタン */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full text-base py-3"
        >
          {submitting ? '保存中...' : '試合結果を保存'}
        </button>
      </div>

      <StickyFeedback
        error={error}
        onDismissError={() => setError('')}
        errorAutoDismissMs={0}
      />
    </Layout>
  )
}
