import { Layout, PageHeader } from '../components/Layout'
import { SeasonRankingLink } from '../components/AllTimeReferenceLink'
import { RankingCard } from '../components/RankingCard'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { useMemo } from 'react'
import { buildRankingStats } from '../utils/ranking'

export function AllTimeRankingPage() {
  const { players, loading: playersLoading } = usePlayers()
  const { results, loading: resultsLoading } = useResults()

  const loading = playersLoading || resultsLoading

  const stats = useMemo(
    () =>
      buildRankingStats(players, results, {
        participantsOnly: true,
      }),
    [players, results],
  )

  return (
    <Layout>
      <PageHeader
        title="通算成績（参考）"
        subtitle={`${stats.length}名 · 通算pt（参考）順`}
        action={<SeasonRankingLink label="シーズンランキング" />}
      />

      <p className="text-white/45 text-sm leading-relaxed mb-4">
        全シーズンの試合を集計した参考成績です。シーズンごとにポイントルールが異なる場合があるため、pt は参考値として表示します。
      </p>

      {stats.length > 0 && (
        <p className="text-white/40 text-xs mb-3 leading-relaxed">
          優勝率・入賞率・平均順位などもあわせてご覧ください。
        </p>
      )}

      {loading ? (
        <Loading />
      ) : stats.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30">まだデータがありません</p>
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up">
          {stats.map((stat, i) => (
            <RankingCard
              key={stat.player.id}
              stat={stat}
              rank={i + 1}
              allTimeReference
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
