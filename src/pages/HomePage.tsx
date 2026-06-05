import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RankingCard } from '../components/RankingCard'
import { GameCard } from '../components/GameCard'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { useSeasons } from '../hooks/useSeasons'
import { ActivityHomeNotice } from '../components/home/ActivityHomeNotice'
import {
  ActiveSeasonHero,
  SeasonsScheduleCard,
} from '../components/SeasonUserDisplay'
import { APP_NAME } from '../constants/app'
import { buildRankingStats } from '../utils/ranking'
import { filterResultsBySeason, getSeasonLabelForGame } from '../utils/season'

export function HomePage() {
  const { user, isAdmin, myPlayer } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useResults()
  const { seasons, activeSeasonId, hasFirestoreSeasons } = useSeasons()

  const loading = playersLoading || gamesLoading || resultsLoading
  const activeSeason = seasons.find((s) => s.id === activeSeasonId)

  const top3Stats = useMemo(() => {
    const scoped = filterResultsBySeason(games, results, activeSeasonId)
    return buildRankingStats(players, scoped, {
      participantsOnly: true,
    }).slice(0, 3)
  }, [players, games, results, activeSeasonId])

  const rankingSectionTitle = activeSeason
    ? `🏆 ${activeSeason.label}`
    : '🏆 ランキング'

  // 直近3試合（gameNo降順）
  const recentGames = [...games]
    .sort((a, b) => b.gameNo - a.gameNo)
    .slice(0, 3)

  return (
    <Layout>
      {/* ヒーロー */}
      <div className="text-center mb-8 mt-2">
        <h1 className="font-display font-black text-3xl lg:text-4xl tracking-tight">
          <span className="text-gold-400">Rival</span>
          <span className="text-white/80">t</span>
          <span className="sr-only">{APP_NAME}</span>
        </h1>
        <ActiveSeasonHero season={activeSeason} />
        <p className="text-white/55 text-sm lg:text-base mt-3 max-w-md lg:max-w-xl mx-auto leading-relaxed">
          ポーカーチェイスなどで友達と遊んだ試合結果を記録し、Discord内のランキングとして共有できるWebアプリです。
        </p>
        {!user && (
          <div className="mt-4 max-w-md mx-auto">
            <p className="text-white/50 text-sm leading-relaxed">
              ゲストとして閲覧中です。ランキングや試合の閲覧はこのままお楽しみください。
            </p>
            <p className="text-white/45 text-sm mt-2 leading-relaxed">
              リーグに<strong className="text-white/70">参加して試合結果にエントリー</strong>
              するには、右上の
              <Link to="/register" className="text-gold-400/90 hover:text-gold-300 mx-1">
                新規登録
              </Link>
              または
              <Link to="/login" className="text-gold-400/90 hover:text-gold-300 mx-1">
                ログイン
              </Link>
              からプロフィールを登録してください。
            </p>
          </div>
        )}
        {user && myPlayer && (
          <p className="text-gold-400/80 text-sm mt-2">
            ようこそ、{myPlayer.name} さん
          </p>
        )}
        {user && !myPlayer && !isAdmin && (
          <p className="text-amber-400/85 text-sm mt-2">
            プレイヤー登録が未完了です。
            <Link to="/register" className="underline ml-1 hover:text-amber-300">
              登録へ進む
            </Link>
          </p>
        )}
      </div>

      <ActivityHomeNotice />

      {hasFirestoreSeasons && seasons.length > 0 && (
        <SeasonsScheduleCard seasons={seasons} />
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            {/* ランキング上位 */}
            <section className="mb-8 lg:mb-0">
              <SectionHeader
                title={rankingSectionTitle}
                link="/ranking"
                linkLabel="全て見る"
              />
              {top3Stats.length === 0 ? (
                <EmptyState
                  text={
                    activeSeason
                      ? 'このシーズンにはまだデータがありません'
                      : 'まだデータがありません'
                  }
                />
              ) : (
                <div className="space-y-2">
                  {top3Stats.map((stat, i) => (
                    <RankingCard key={stat.player.id} stat={stat} rank={i + 1} compact />
                  ))}
                </div>
              )}
            </section>

            {/* 直近の試合 */}
            <section className="mb-8 lg:mb-0">
              <SectionHeader title="🎮 直近の試合" link="/games" linkLabel="全て見る" />
              {recentGames.length === 0 ? (
                <EmptyState text="まだ試合がありません" />
              ) : (
                <div className="space-y-2">
                  {recentGames.map((game) => {
                    const gameResults = results.filter((r) => r.gameId === game.id)
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        results={gameResults}
                        players={players}
                        seasonLabel={getSeasonLabelForGame(game, seasons)}
                        compact
                      />
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* 管理者向けアクション */}
          {isAdmin && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/games/new"
                className="btn-primary w-full flex items-center justify-center gap-2 text-base sm:col-span-2"
              >
                <span>＋</span>
                <span>試合結果を追加</span>
              </Link>
              <Link
                to="/admin/seasons"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-base"
              >
                <span>📅</span>
                <span>シーズン管理</span>
              </Link>
              <Link
                to="/admin/announcements"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-base"
              >
                <span>📢</span>
                <span>お知らせを投稿</span>
              </Link>
              <Link
                to="/players"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-base"
              >
                <span>👤</span>
                <span>プレイヤー管理</span>
              </Link>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}

function SectionHeader({
  title,
  link,
  linkLabel,
}: {
  title: string
  link: string
  linkLabel: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display font-bold text-lg lg:text-xl text-white">{title}</h2>
      <Link
        to={link}
        className="text-gold-400/70 hover:text-gold-400 text-xs font-medium transition-colors"
      >
        {linkLabel} →
      </Link>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card py-8 text-center">
      <p className="text-white/30 text-sm">{text}</p>
    </div>
  )
}
