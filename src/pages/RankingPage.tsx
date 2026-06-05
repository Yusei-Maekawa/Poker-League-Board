import { useEffect, useMemo, useState } from 'react'
import { Layout, PageHeader } from '../components/Layout'
import { RankingCard } from '../components/RankingCard'
import { Loading } from '../components/Loading'
import { SeasonScopeSection } from '../components/SeasonUserDisplay'
import { formatSeasonPeriodCompact } from '../utils/seasonPeriod'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { useGames } from '../hooks/useGames'
import { useSeasons } from '../hooks/useSeasons'
import type { SeasonScope } from '../constants/seasons'
import { AllTimeReferenceLink } from '../components/AllTimeReferenceLink'
import { PointRulesDisplay } from '../components/PointRulesDisplay'
import { buildRankingStats } from '../utils/ranking'
import { filterResultsBySeason } from '../utils/season'
import { getPointRulesForSeason } from '../utils/seasonPointRules'

export function RankingPage() {
  const { players, loading: playersLoading } = usePlayers()
  const { results, loading: resultsLoading } = useResults()
  const { games, loading: gamesLoading } = useGames()
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

  const loading = playersLoading || resultsLoading || gamesLoading || seasonsLoading

  const scopedResults = useMemo(() => {
    if (!scope) return []
    return filterResultsBySeason(games, results, scope)
  }, [games, results, scope])

  const stats = useMemo(
    () =>
      buildRankingStats(players, scopedResults, {
        participantsOnly: true,
      }),
    [players, scopedResults],
  )

  const scopedSeason =
    scope != null ? seasonsForRanking.find((s) => s.id === scope) : null
  const scopeLabel = scopedSeason?.label ?? scope ?? ''
  const scopePeriod = scopedSeason
    ? formatSeasonPeriodCompact(scopedSeason)
    : null
  const pointRules = getPointRulesForSeason(scopedSeason ?? undefined)

  const subtitle = scopePeriod
    ? `${scopeLabel}（${scopePeriod}）· ${stats.length}名参加`
    : scope
      ? `${scopeLabel} · ${stats.length}名参加`
      : undefined

  return (
    <Layout>
      <PageHeader
        title="ランキング"
        subtitle={subtitle}
        action={<AllTimeReferenceLink />}
      />

      {seasonsForRanking.length > 0 && scope ? (
        <SeasonScopeSection
          seasons={seasonsForRanking}
          value={scope}
          onChange={setScopeOverride}
          className="mb-5"
        />
      ) : !seasonsLoading ? (
        <div className="card px-4 py-4 mb-5">
          <p className="text-white/50 text-sm">
            表示できるシーズンがありません。管理者がシーズンを登録すると、ここにランキングが表示されます。
          </p>
        </div>
      ) : null}

      {loading ? (
        <Loading />
      ) : !scope ? (
        <div className="card py-12 text-center">
          <p className="text-white/30 text-sm mb-4">シーズンランキングは準備中です</p>
        </div>
      ) : stats.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30">このシーズンにはまだデータがありません</p>
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up">
          {stats.map((stat, i) => (
            <RankingCard key={stat.player.id} stat={stat} rank={i + 1} />
          ))}
        </div>
      )}

      {scope && (
        <div className="mt-8 card px-4 py-4">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            {scopeLabel} のポイントルール
          </h3>
          <PointRulesDisplay
            rules={pointRules}
            note="※ 最下位は順位ポイントより最下位ペナルティが優先されます"
          />
        </div>
      )}

    </Layout>
  )
}
