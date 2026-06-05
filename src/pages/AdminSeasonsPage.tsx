import { useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import { Layout, PageHeader } from '../components/Layout'
import { StickyFeedback } from '../components/StickyFeedback'

import { Loading } from '../components/Loading'

import { useAuth } from '../hooks/useAuth'

import { useSeasons } from '../hooks/useSeasons'

import { useAppContext } from '../context/AppProvider'

import {
  isFallbackOnlySeasonList,
  planNextSeason,
  validateSeasonLabel,
} from '../utils/seasonAdmin'
import { SEASON_LIMITS } from '../utils/validationLimits'

import {

  defaultNextSeasonPeriodFields,

  formatSeasonPeriodFromFields,

  formatSeasonPeriodRange,

  getSeasonPeriodPhase,

  getSeasonPeriodPhaseLabel,

  seasonToPeriodFields,

  validateSeasonPeriodForSave,

  type SeasonPeriodFields,

} from '../utils/seasonPeriod'

import { getFirebaseErrorMessage } from '../utils/firebaseError'

import { PointRulesDisplay } from '../components/PointRulesDisplay'
import { DEFAULT_SEASON_POINT_RULES } from '../constants/pointRules'
import { isSeasonShownInRanking } from '../utils/seasonRanking'
import {
  getPointRulesForSeason,
  usesCustomPointRules,
  validateSeasonPointRules,
} from '../utils/seasonPointRules'
import type { GameSeasonMode, Season, SeasonPointRules } from '../types'



const emptyPeriod: SeasonPeriodFields = {

  startDate: '',

  startTime: '15:00',

  endDate: '',

  endTime: '15:00',

}



export function AdminSeasonsPage() {

  const { isAdmin, loading: authLoading } = useAuth()

  const {

    seasons,

    hasFirestoreSeasons,

    seasonsLoading,

    configActiveSeasonId,

    activeSeasonId,

    gameSeasonMode,

    gameSeasonFromPeriod,

  } = useSeasons()

  const {

    bootstrapLeagueSeasons,

    createSeasonWithPeriod,

    updateSeasonPeriod,

    updateSeasonLabel,

    updateSeasonShowInRanking,

    updateSeasonPointRules,

    setActiveSeasonForGames,

    setGameSeasonMode,

    repairGameCountersOnlyFromGames,

    repairGameActivitiesFromGames,

  } = useAppContext()



  const [submitting, setSubmitting] = useState<string | null>(null)

  const [error, setError] = useState('')

  const [message, setMessage] = useState('')

  const [repairCountersOpen, setRepairCountersOpen] = useState(false)
  const [repairActivitiesOpen, setRepairActivitiesOpen] = useState(false)

  const [newPeriod, setNewPeriod] = useState<SeasonPeriodFields>(emptyPeriod)
  const [newLabel, setNewLabel] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)

  const [editPeriod, setEditPeriod] = useState<SeasonPeriodFields>(emptyPeriod)

  const [gameSeasonPick, setGameSeasonPick] = useState(configActiveSeasonId)
  const [gameSeasonModePick, setGameSeasonModePick] =
    useState<GameSeasonMode>(gameSeasonMode)

  useEffect(() => {
    setGameSeasonPick(configActiveSeasonId)
  }, [configActiveSeasonId])

  useEffect(() => {
    setGameSeasonModePick(gameSeasonMode)
  }, [gameSeasonMode])

  const effectiveGameSeasonLabel =
    seasons.find((s) => s.id === activeSeasonId)?.label ?? activeSeasonId

  const gameSeasonSubtitleSuffix =
    gameSeasonMode === 'period'
      ? gameSeasonFromPeriod
        ? '（期間から自動）'
        : '（手動設定・期間外）'
      : '（手動）'



  const needsBootstrap = isFallbackOnlySeasonList(seasons, hasFirestoreSeasons)

  const nextPlanned = useMemo(() => planNextSeason(seasons), [seasons])

  useEffect(() => {
    setNewLabel(nextPlanned.label)
  }, [nextPlanned.id, nextPlanned.label])

  if (authLoading || seasonsLoading) {

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

          <Link to="/" className="btn-secondary text-sm">

            ホームへ

          </Link>

        </div>

      </Layout>

    )

  }



  const run = async (key: string, fn: () => Promise<void>) => {

    setError('')

    setMessage('')

    setSubmitting(key)

    try {

      await fn()

    } catch (e) {

      console.error(e)

      setError(getFirebaseErrorMessage(e, '操作に失敗しました'))

    } finally {

      setSubmitting(null)

    }

  }



  const handleBootstrap = () =>

    run('bootstrap', async () => {

      await bootstrapLeagueSeasons()

      setMessage('Season 1 を登録しました。期間は一覧から設定できます。')

    })



  const initNewPeriod = () => {

    setNewPeriod(defaultNextSeasonPeriodFields(seasons))

  }



  const handleCreateNext = () => {
    const labelErr = validateSeasonLabel(newLabel)
    if (labelErr) {
      setError(labelErr)
      return
    }
    const validation = validateSeasonPeriodForSave(newPeriod, seasons)
    if (validation) {
      setError(validation)
      return
    }
    run('create', async () => {
      const created = await createSeasonWithPeriod({
        period: newPeriod,
        label: newLabel,
      })
      setMessage(
        `「${created.label}」を追加しました（${formatSeasonPeriodFromFields(newPeriod)}）`,
      )
      setNewPeriod(emptyPeriod)
    })
  }

  const handleSaveLabel = (seasonId: string, label: string) => {
    const labelErr = validateSeasonLabel(label)
    if (labelErr) {
      setError(labelErr)
      return
    }
    run(`label-${seasonId}`, async () => {
      await updateSeasonLabel(seasonId, label)
      setMessage('表示名を更新しました')
    })
  }

  const handleClearPeriodSave = (seasonId: string) => {
    run(`clear-${seasonId}`, async () => {
      await updateSeasonPeriod(seasonId, emptyPeriod)
      const label = seasons.find((s) => s.id === seasonId)?.label ?? seasonId
      setMessage(`${label} の期間を未設定にしました`)
      cancelEditPeriod()
    })
  }

  const startEditPeriod = (season: Season) => {

    setEditingId(season.id)

    setEditPeriod(seasonToPeriodFields(season))

    setError('')

  }



  const cancelEditPeriod = () => {

    setEditingId(null)

    setEditPeriod(emptyPeriod)

  }



  const handleToggleShowInRanking = (season: Season) =>
    run(`ranking-${season.id}`, async () => {
      const next = !isSeasonShownInRanking(season)
      await updateSeasonShowInRanking(season.id, next)
      setMessage(
        next
          ? `${season.label} をランキングの切替に表示します`
          : `${season.label} をランキングの切替から非表示にしました`,
      )
    })

  const handleSavePointRules = (seasonId: string, rules: SeasonPointRules) => {
    const err = validateSeasonPointRules(rules)
    if (err) {
      setError(err)
      return
    }
    run(`pt-${seasonId}`, async () => {
      await updateSeasonPointRules(seasonId, rules)
      const label = seasons.find((s) => s.id === seasonId)?.label ?? seasonId
      setMessage(`${label} のポイントルールを保存しました`)
    })
  }

  const handleSavePeriod = (seasonId: string) => {
    const validation = validateSeasonPeriodForSave(editPeriod, seasons, seasonId)
    if (validation) {
      setError(validation)
      return
    }
    run(`save-${seasonId}`, async () => {
      await updateSeasonPeriod(seasonId, editPeriod)
      const label = seasons.find((s) => s.id === seasonId)?.label ?? seasonId
      setMessage(
        `${label} の期間を更新しました（${formatSeasonPeriodFromFields(editPeriod)}）`,
      )
      cancelEditPeriod()
    })
  }



  return (

    <Layout>

      <Link

        to="/"

        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"

      >

        ← ホーム

      </Link>



      <PageHeader

        title="シーズン管理"

        subtitle={`いまの試合採番: ${effectiveGameSeasonLabel}${gameSeasonSubtitleSuffix}`}

      />



      <p className="text-white/50 text-sm leading-relaxed mb-5">

        各シーズンに <strong className="text-white/70">開始・終了の日時</strong>

        を設定します（未設定も可。期間が重なるシーズンは保存できません）。試合採番は「手動」または「期間自動」モードで切り替えられます。第〇戦はシーズン内で自動採番します。

      </p>



      <p className="text-white/45 text-xs mb-5 leading-relaxed">
        <strong className="text-white/60">表示名</strong>は自由に変更できます（Season 1 のままでも、イベント名でも可）。
        ID（season1 など）は内部用で変わりません。ランキング切替への表示はシーズンごとに設定できます。
      </p>

      {needsBootstrap && (

        <div className="card px-4 py-4 mb-5 border-amber-500/30">

          <p className="text-amber-200/90 text-sm font-medium">

            シーズンが Firestore に未登録です

          </p>

          <p className="text-white/45 text-xs mt-2 leading-relaxed">

            まず Season 1 を登録してください。既存の試合（seasonId なし）は Season 1 として集計されます。

          </p>

          <button

            type="button"

            className="btn-primary w-full mt-4 text-sm"

            disabled={submitting !== null}

            onClick={handleBootstrap}

          >

            {submitting === 'bootstrap' ? '登録中...' : 'Season 1 を登録する'}

          </button>

        </div>

      )}



      {!needsBootstrap && (
        <div className="card px-4 py-4 mb-5 space-y-4 border-gold-500/25">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            試合採番
          </h2>
          <div>
            <label htmlFor="game-season-mode" className="label">
              採番モード
            </label>
            <select
              id="game-season-mode"
              className="input"
              value={gameSeasonModePick}
              disabled={submitting !== null}
              onChange={(e) =>
                setGameSeasonModePick(e.target.value as GameSeasonMode)
              }
            >
              <option value="manual">手動（下で選んだシーズン）</option>
              <option value="period">
                期間自動（いまの日時が期間内のシーズン）
              </option>
            </select>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">
              期間自動は不具合対応などに使えます。通常運用は手動を推奨します。
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary w-full text-sm"
            disabled={
              submitting !== null || gameSeasonModePick === gameSeasonMode
            }
            onClick={() =>
              run('game-season-mode', async () => {
                await setGameSeasonMode(gameSeasonModePick)
                setMessage(
                  gameSeasonModePick === 'period'
                    ? '採番モードを「期間自動」に変更しました'
                    : '採番モードを「手動」に変更しました',
                )
              })
            }
          >
            {submitting === 'game-season-mode' ? '保存中...' : '採番モードを保存'}
          </button>
          <div>
            <label htmlFor="game-season-pick" className="label">
              {gameSeasonMode === 'period'
                ? 'フォールバックシーズン（期間外のとき）'
                : '採番先シーズン'}
            </label>
            <select
              id="game-season-pick"
              className="input"
              value={gameSeasonPick}
              disabled={submitting !== null}
              onChange={(e) => setGameSeasonPick(e.target.value)}
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-primary w-full text-sm"
            disabled={
              submitting !== null || gameSeasonPick === configActiveSeasonId
            }
            onClick={() =>
              run('game-season', async () => {
                await setActiveSeasonForGames(gameSeasonPick)
                const label =
                  seasons.find((s) => s.id === gameSeasonPick)?.label ??
                  gameSeasonPick
                setMessage(`試合採番シーズンを「${label}」に設定しました`)
              })
            }
          >
            {submitting === 'game-season' ? '保存中...' : '試合採番シーズンを保存'}
          </button>
          <div className="pt-3 border-t border-white/[0.08] space-y-4">
            <div className="space-y-2">
              <p className="text-white/45 text-xs leading-relaxed">
                旧形式の <span className="font-mono text-white/55">counters/games</span>{' '}
                が残っている、または dev で番号がずれたときは再同期してください。
              </p>

              {!repairCountersOpen ? (
                <button
                  type="button"
                  className="btn-secondary w-full text-sm"
                  disabled={submitting !== null}
                  onClick={() => {
                    setRepairActivitiesOpen(false)
                    setRepairCountersOpen(true)
                  }}
                >
                  カウンターを試合データから再同期…
                </button>
              ) : (
                <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-3">
                  <p className="text-amber-100/90 text-xs leading-relaxed">
                    各シーズンの{' '}
                    <span className="font-mono">counters/seasonN</span>{' '}
                    を試合データから作り直し、旧{' '}
                    <span className="font-mono">counters/games</span>{' '}
                    を削除します。アクティビティは触りません。本番データでは慎重に実行してください。
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary flex-1 text-sm"
                      disabled={submitting !== null}
                      onClick={() =>
                        run('repair-counters-only', async () => {
                          const result = await repairGameCountersOnlyFromGames()
                          const lines = Object.entries(result.nextBySeason)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([id, next]) => `${id}: 次は第${next}戦`)
                          setMessage(
                            [
                              '試合番号カウンターを再同期しました。',
                              ...lines,
                              result.removedLegacyCounter
                                ? '旧 counters/games を削除しました。'
                                : '旧 counters/games はありませんでした。',
                            ]
                              .filter(Boolean)
                              .join(' '),
                          )
                          setRepairCountersOpen(false)
                        })
                      }
                    >
                      {submitting === 'repair-counters-only'
                        ? '再同期中...'
                        : '再同期を実行'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-sm px-4"
                      disabled={submitting === 'repair-counters-only'}
                      onClick={() => setRepairCountersOpen(false)}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-white/[0.08] pt-3">
              <p className="text-white/45 text-xs leading-relaxed">
                削除済み試合に紐づく{' '}
                <span className="font-mono text-white/55">game_added</span>{' '}
                の整理、または試合番号表示の修正が必要なときに使います。
              </p>

              {!repairActivitiesOpen ? (
                <button
                  type="button"
                  className="btn-secondary w-full text-sm"
                  disabled={submitting !== null}
                  onClick={() => {
                    setRepairCountersOpen(false)
                    setRepairActivitiesOpen(true)
                  }}
                >
                  孤立・ズレた game_added を整理…
                </button>
              ) : (
                <div className="space-y-3 rounded-lg border border-red-500/35 bg-red-950/25 px-3 py-3">
                  <p className="text-red-200/90 text-xs leading-relaxed">
                    <span className="font-mono">activities</span> の{' '}
                    <span className="font-mono">game_added</span>{' '}
                    を削除・更新します。削除済み試合に紐づく game_added は削除され、残りは試合番号（gameNo）が試合データに同期されます。この操作は取り消せません。
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-red-600/80 hover:bg-red-600 px-4 py-2.5 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                      disabled={submitting !== null}
                      onClick={() =>
                        run('repair-activities', async () => {
                          const result = await repairGameActivitiesFromGames()
                          setMessage(
                            [
                              result.removedOrphanActivities > 0
                                ? `試合削除済みの game_added を ${result.removedOrphanActivities} 件削除しました。`
                                : '削除対象の game_added はありませんでした。',
                              result.updatedActivityGameNos > 0
                                ? `アクティビティの試合番号を ${result.updatedActivityGameNos} 件修正しました。`
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' '),
                          )
                          setRepairActivitiesOpen(false)
                        })
                      }
                    >
                      {submitting === 'repair-activities'
                        ? '整理中...'
                        : '整理を実行'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-sm px-4"
                      disabled={submitting === 'repair-activities'}
                      onClick={() => setRepairActivitiesOpen(false)}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!needsBootstrap && (

        <div className="card px-4 py-4 mb-5 space-y-4">

          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">

            新しいシーズン

          </h2>

          <p className="text-white/50 text-sm">
            内部 ID: <span className="font-mono text-white/60">{nextPlanned.id}</span>
            （変更不可）
          </p>
          <div>
            <label htmlFor="new-season-label" className="label">
              表示名
            </label>
            <input
              id="new-season-label"
              type="text"
              className="input"
              value={newLabel}
              maxLength={SEASON_LIMITS.label}
              placeholder="例: Season 4 / 春のバウンティ"
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <p className="text-white/30 text-xs mt-1">
              {newLabel.length}/{SEASON_LIMITS.label}文字 · ランキングや日程にこの名前が出ます
            </p>
          </div>

          {newPeriod.startDate === '' && (

            <button

              type="button"

              className="text-gold-400/80 text-xs hover:text-gold-300"

              onClick={initNewPeriod}

            >

              期間の入力欄を表示 →

            </button>

          )}

          {newPeriod.startDate !== '' && (
            <>
              <SeasonPeriodFieldsForm
                value={newPeriod}
                onChange={setNewPeriod}
                idPrefix="new"
              />
              <button
                type="button"
                className="text-white/45 text-xs hover:text-white/65"
                onClick={() => setNewPeriod(emptyPeriod)}
              >
                期間を空にする（未設定で追加）
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-primary w-full text-sm"
            disabled={submitting !== null}
            onClick={handleCreateNext}
          >

            {submitting === 'create'
              ? '作成中...'
              : `「${newLabel.trim() || nextPlanned.label}」を追加する`}
          </button>

        </div>

      )}



      <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">

        シーズン一覧

      </h2>



      <div className="space-y-2">

        {seasons.map((season) => (

          <SeasonAdminCard

            key={season.id}

            season={season}

            isGameSeason={season.id === activeSeasonId}

            isEditing={editingId === season.id}

            editPeriod={editPeriod}

            submitting={submitting}

            onStartEdit={() => startEditPeriod(season)}

            onCancelEdit={cancelEditPeriod}

            onChangeEdit={setEditPeriod}

            onSavePeriod={() => handleSavePeriod(season.id)}

            onClearPeriod={() => handleClearPeriodSave(season.id)}

            onSaveLabel={(label) => handleSaveLabel(season.id, label)}

            onToggleShowInRanking={() => handleToggleShowInRanking(season)}

            onSavePointRules={(rules) => handleSavePointRules(season.id, rules)}

          />

        ))}

      </div>



      <div className="mt-8 flex flex-wrap gap-3">

        <Link to="/ranking" className="btn-secondary text-sm">

          ランキングを確認

        </Link>

        <Link to="/admin/announcements" className="btn-secondary text-sm">

          お知らせ管理

        </Link>

      </div>

      <StickyFeedback
        success={message}
        error={error}
        onDismissSuccess={() => setMessage('')}
        onDismissError={() => setError('')}
      />

    </Layout>

  )

}



const POINT_RULE_FIELDS: {
  key: keyof SeasonPointRules
  label: string
}[] = [
  { key: 'rank1', label: '1位' },
  { key: 'rank2', label: '2位' },
  { key: 'rank3', label: '3位' },
  { key: 'rank4', label: '4位' },
  { key: 'rank5Plus', label: '5位以下' },
  { key: 'lastPlace', label: '最下位' },
]

function SeasonPointRulesFields({
  value,
  onChange,
  disabled,
}: {
  value: SeasonPointRules
  onChange: (v: SeasonPointRules) => void
  disabled: boolean
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {POINT_RULE_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="label text-[10px]">{label}</label>
          <input
            type="number"
            className="input text-sm font-mono py-1.5"
            min={-99}
            max={99}
            disabled={disabled}
            value={value[key]}
            onChange={(e) => {
              const n = e.target.value === '' ? 0 : Number(e.target.value)
              onChange({ ...value, [key]: n })
            }}
          />
        </div>
      ))}
    </div>
  )
}

function SeasonPeriodFieldsForm({

  value,

  onChange,

  idPrefix,

}: {

  value: SeasonPeriodFields

  onChange: (v: SeasonPeriodFields) => void

  idPrefix: string

}) {

  return (

    <div className="grid gap-3 sm:grid-cols-2">

      <PeriodField

        label="開始日"

        id={`${idPrefix}-start-date`}

        type="date"

        fieldValue={value.startDate}

        onFieldChange={(startDate) => onChange({ ...value, startDate })}

      />

      <PeriodField

        label="開始時刻"

        id={`${idPrefix}-start-time`}

        type="time"

        fieldValue={value.startTime}

        onFieldChange={(startTime) => onChange({ ...value, startTime })}

      />

      <PeriodField

        label="終了日"

        id={`${idPrefix}-end-date`}

        type="date"

        fieldValue={value.endDate}

        onFieldChange={(endDate) => onChange({ ...value, endDate })}

      />

      <PeriodField

        label="終了時刻"

        id={`${idPrefix}-end-time`}

        type="time"

        fieldValue={value.endTime}

        onFieldChange={(endTime) => onChange({ ...value, endTime })}

      />

    </div>

  )

}



function PeriodField({

  label,

  id,

  type,

  fieldValue,

  onFieldChange,

}: {

  label: string

  id: string

  type: 'date' | 'time'

  fieldValue: string

  onFieldChange: (v: string) => void

}) {

  return (

    <div>

      <label htmlFor={id} className="label">

        {label}

      </label>

      <input

        id={id}

        type={type}

        className="input"

        value={fieldValue}

        onChange={(e) => onFieldChange(e.target.value)}

      />

    </div>

  )

}



function SeasonAdminCard({

  season,

  isGameSeason,

  isEditing,

  editPeriod,

  submitting,

  onStartEdit,

  onCancelEdit,

  onChangeEdit,

  onSavePeriod,

  onClearPeriod,

  onSaveLabel,

  onToggleShowInRanking,

  onSavePointRules,

}: {

  season: Season

  isGameSeason: boolean

  isEditing: boolean

  editPeriod: SeasonPeriodFields

  submitting: string | null

  onStartEdit: () => void

  onCancelEdit: () => void

  onChangeEdit: (v: SeasonPeriodFields) => void

  onSavePeriod: () => void

  onClearPeriod: () => void

  onSaveLabel: (label: string) => void

  onToggleShowInRanking: () => void

  onSavePointRules: (rules: SeasonPointRules) => void

}) {

  const phase = getSeasonPeriodPhase(season)
  const busy = submitting !== null
  const [labelDraft, setLabelDraft] = useState(season.label)
  const [editingPointRules, setEditingPointRules] = useState(false)
  const [pointDraft, setPointDraft] = useState<SeasonPointRules>(() =>
    getPointRulesForSeason(season),
  )

  useEffect(() => {
    setLabelDraft(season.label)
  }, [season.id, season.label])

  useEffect(() => {
    setPointDraft(getPointRulesForSeason(season))
    setEditingPointRules(false)
  }, [season.id, season.pointRules])

  const labelDirty = labelDraft.trim() !== season.label
  const displayRules = getPointRulesForSeason(season)
  const customRules = usesCustomPointRules(season)



  return (

    <div
      className={`card px-4 py-3 ${
        isGameSeason ? 'border-gold-500/35' : ''
      }`}
    >

      <div className="flex flex-col gap-3">

        <div className="flex flex-wrap items-start justify-between gap-2">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isGameSeason && (
                <span className="text-xs font-normal text-gold-400/90 bg-gold-500/15 px-2 py-0.5 rounded-full">
                  試合採番中
                </span>
              )}
              <span className="text-xs font-normal text-white/45 bg-white/5 px-2 py-0.5 rounded-full">
                {getSeasonPeriodPhaseLabel(phase)}
              </span>
            </div>
            <label className="label text-[10px]">表示名</label>
            <div className="flex gap-2 mt-0.5">
              <input
                type="text"
                className="input text-sm flex-1 min-w-0"
                value={labelDraft}
                maxLength={SEASON_LIMITS.label}
                disabled={busy}
                onChange={(e) => setLabelDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-xs px-3 shrink-0"
                disabled={busy || !labelDirty}
                onClick={() => onSaveLabel(labelDraft)}
              >
                {submitting === `label-${season.id}` ? '...' : '保存'}
              </button>
            </div>
            <p className="text-white/35 text-xs font-mono mt-1.5">ID: {season.id}</p>

            <p className="text-white/55 text-xs mt-2">

              {formatSeasonPeriodRange(season)}

            </p>

            <label className="flex items-center gap-2 mt-3 cursor-pointer">

              <input

                type="checkbox"

                className="rounded border-white/20"

                checked={isSeasonShownInRanking(season)}

                disabled={busy}

                onChange={onToggleShowInRanking}

              />

              <span className="text-xs text-white/60">

                ランキング・個人成績のシーズン切替に表示

              </span>

            </label>

          </div>

          {!isEditing && (

            <button

              type="button"

              className="btn-secondary text-xs px-3 py-2 shrink-0"

              disabled={busy}

              onClick={onStartEdit}

            >

              期間を編集

            </button>

          )}

        </div>



        <div className="border-t border-white/[0.06] pt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
              ポイントルール
              {customRules && (
                <span className="ml-2 font-normal text-gold-400/80 normal-case">
                  カスタム
                </span>
              )}
            </p>
            {!editingPointRules ? (
              <button
                type="button"
                className="btn-secondary text-xs px-3 py-1.5"
                disabled={busy}
                onClick={() => {
                  setPointDraft(displayRules)
                  setEditingPointRules(true)
                }}
              >
                編集
              </button>
            ) : (
              <button
                type="button"
                className="text-white/45 text-xs hover:text-white/65"
                disabled={busy}
                onClick={() => {
                  setPointDraft(displayRules)
                  setEditingPointRules(false)
                }}
              >
                キャンセル
              </button>
            )}
          </div>
          {editingPointRules ? (
            <>
              <SeasonPointRulesFields
                value={pointDraft}
                onChange={setPointDraft}
                disabled={busy}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs flex-1 min-w-[6rem]"
                  disabled={busy || submitting === `pt-${season.id}`}
                  onClick={() => onSavePointRules(pointDraft)}
                >
                  {submitting === `pt-${season.id}` ? '保存中...' : 'ルールを保存'}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled={busy}
                  onClick={() => setPointDraft({ ...DEFAULT_SEASON_POINT_RULES })}
                >
                  標準に戻す
                </button>
              </div>
              <p className="text-white/30 text-xs">
                保存済み試合の pt は変わりません。以降の試合追加・編集（順位変更）時に適用されます。
              </p>
            </>
          ) : (
            <PointRulesDisplay rules={displayRules} compact note={null} />
          )}
        </div>

        {isEditing && (

          <div className="border-t border-white/[0.06] pt-3 space-y-3">

            <SeasonPeriodFieldsForm

              value={editPeriod}

              onChange={onChangeEdit}

              idPrefix={`edit-${season.id}`}

            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary flex-1 text-sm min-w-[7rem]"
                disabled={busy}
                onClick={onSavePeriod}
              >
                {submitting === `save-${season.id}` ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={busy}
                onClick={onClearPeriod}
              >
                未設定にする
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={busy}
                onClick={onCancelEdit}
              >
                キャンセル
              </button>
            </div>

          </div>

        )}

      </div>

    </div>

  )

}

