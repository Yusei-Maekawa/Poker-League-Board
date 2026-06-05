import { useEffect, useMemo, useState } from 'react'
import { Link, useMatch, useParams } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { SeasonRankingLink } from '../components/AllTimeReferenceLink'
import { SeasonScopeSection } from '../components/SeasonUserDisplay'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useResults } from '../hooks/useResults'
import { useSeasons } from '../hooks/useSeasons'
import { useAuth } from '../hooks/useAuth'
import { ALL_SEASONS_SCOPE, type SeasonScope } from '../constants/seasons'
import { isPlayerAccountDeleted } from '../utils/playerAccount'
import {
  computePodiumStreaks,
  formatWinRate,
  getPlayerRankingStat,
  getPlayerRecentGames,
} from '../utils/playerStats'
import { formatGameDateTime } from '../utils/formatDateTime'
import { formatGameParticipantCount } from '../utils/gameParticipant'
import { formatPoint } from '../utils/ranking'
import { getSeasonLabelForGame } from '../utils/season'

export function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const isAllTime = Boolean(
    useMatch({ path: '/players/:playerId/all-time', end: true }),
  )
  const { myPlayer } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useResults()
  const { seasons, seasonsForRanking, activeSeasonId, seasonsLoading } =
    useSeasons()
  const [scopeOverride, setScopeOverride] = useState<SeasonScope | null>(null)

  const defaultSeasonScope = useMemo((): SeasonScope | null => {
    if (seasonsForRanking.some((s) => s.id === activeSeasonId)) {
      return activeSeasonId
    }
    if (seasonsForRanking.length > 0) return seasonsForRanking[0].id
    return null
  }, [activeSeasonId, seasonsForRanking])

  const seasonScope = scopeOverride ?? defaultSeasonScope
  const scope = isAllTime ? ALL_SEASONS_SCOPE : seasonScope ?? ALL_SEASONS_SCOPE

  useEffect(() => {
    if (isAllTime) return
    if (seasonScope && !seasonsForRanking.some((s) => s.id === seasonScope)) {
      setScopeOverride(
        seasonsForRanking.length > 0 ? seasonsForRanking[0].id : null,
      )
    }
  }, [isAllTime, seasonScope, seasonsForRanking])

  const loading =
    playersLoading || gamesLoading || resultsLoading || seasonsLoading
  const player = players.find((p) => p.id === playerId)

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    )
  }

  if (!player) {
    return (
      <Layout>
        <div className="card py-12 text-center">
          <p className="text-white/30 mb-4">プレイヤーが見つかりません</p>
          <Link to="/players" className="btn-secondary text-sm">
            プレイヤー一覧へ
          </Link>
        </div>
      </Layout>
    )
  }

  const isMe = myPlayer?.id === player.id
  const isDeleted = isPlayerAccountDeleted(player)

  if (isDeleted) {
    return (
      <Layout>
        <Link
          to="/players"
          className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"
        >
          ← プレイヤー一覧
        </Link>
        <div className="card py-14 text-center px-6 max-w-md mx-auto">
          <p className="text-white/25 text-4xl font-light tracking-[0.3em] mb-5" aria-hidden>
            —
          </p>
          <p className="text-white/75 font-medium">プロフィール非公開</p>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            このプレイヤーは Rivalt を退会しました。
            <br />
            過去の試合記録はリーグに残っています。
          </p>
          <Link to="/players" className="btn-secondary text-sm mt-6 inline-block">
            プレイヤー一覧へ
          </Link>
        </div>
      </Layout>
    )
  }

  const stat = getPlayerRankingStat(
    player.id,
    players,
    results,
    games,
    scope,
  )
  const recent = getPlayerRecentGames(
    player.id,
    games,
    results,
    5,
    scope,
  )
  const streaks = computePodiumStreaks(player.id, games, results, scope)

  const backTo = isAllTime ? `/players/${player.id}` : '/players'
  const backLabel = isAllTime ? '← シーズン成績' : '← プレイヤー一覧'

  return (
    <Layout>
      <Link
        to={backTo}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"
      >
        {backLabel}
      </Link>

      <div className="card px-4 py-4 mb-4 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold shrink-0">
          {player.icon || player.name.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-xl text-white truncate">
            {player.name}
            {isMe && (
              <span className="text-gold-400/80 text-sm font-normal ml-2">（あなた）</span>
            )}
          </h1>
          {isAllTime && (
            <p className="text-gold-400/75 text-xs mt-1">通算成績（参考）</p>
          )}
          {!player.isActive && (
            <p className="text-amber-400/85 text-xs mt-1">
              このプレイヤーは現在リーグ参加を停止されています
            </p>
          )}
          {player.memo && (
            <p className="text-white/50 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
              {player.memo}
            </p>
          )}
        </div>
        {isAllTime && playerId ? (
          <SeasonRankingLink
            to={`/players/${playerId}`}
            label="シーズン成績"
          />
        ) : null}
      </div>

      {!isAllTime && seasonsForRanking.length > 0 && seasonScope ? (
        <SeasonScopeSection
          seasons={seasonsForRanking}
          value={seasonScope}
          onChange={setScopeOverride}
          className="mb-4"
        />
      ) : !isAllTime && !seasonsLoading ? (
        <p className="text-white/45 text-xs mb-4 leading-relaxed">
          シーズン成績は準備中です。
        </p>
      ) : null}

      {isAllTime && (
        <p className="text-white/45 text-xs mb-4 leading-relaxed">
          全シーズン合算の参考成績です。pt はルール混在のため参考値として表示します。
        </p>
      )}

      {stat ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <StatCard
              label={isAllTime ? '通算pt（参考）' : '合計ポイント'}
              value={`${formatPoint(stat.totalPoint)}pt`}
            />
            <StatCard label="参加" value={`${stat.playCount}戦`} />
            <StatCard label="優勝" value={`${stat.winCount}回`} />
            <StatCard
              label="優勝率"
              value={formatWinRate(stat.winCount, stat.playCount)}
            />
            <StatCard label="入賞率" value={`${stat.podiumRate}%`} />
            <StatCard
              label="平均順位"
              value={stat.playCount > 0 ? `${stat.avgRank}位` : '—'}
            />
            <StatCard
              label="最下位"
              value={`${stat.lastPlaceCount}回`}
            />
            {isAllTime && (
              <StatCard
                label="平均参加人数"
                value={stat.playCount > 0 ? `${stat.avgTableSize}人` : '—'}
              />
            )}
          </div>

          <div className="card px-4 py-4 mb-4">
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
              連続入賞
            </h2>
            <p className="text-white text-sm">
              最長 <span className="text-gold-400 font-semibold">{streaks.longest}</span> 試合
              <span className="text-white/30 mx-2">·</span>
              現在 <span className="text-gold-400 font-semibold">{streaks.current}</span> 試合
            </p>
          </div>
        </>
      ) : (
        <div className="card py-8 text-center mb-4">
          <p className="text-white/30 text-sm">
            {isAllTime
              ? 'まだ試合に参加していません'
              : 'このシーズンではまだ試合に参加していません'}
          </p>
        </div>
      )}

      <section>
        <PageHeader title={isAllTime ? '直近5試合（通算）' : '直近5試合'} />
        {recent.length === 0 ? (
          <div className="card py-8 text-center">
            <p className="text-white/30 text-sm">データがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(({ game, result }) => {
              const pointStr = formatPoint(result.point) + 'pt'
              const gameResults = results.filter((r) => r.gameId === game.id)
              const participantLabel = formatGameParticipantCount(gameResults)
              const seasonLabel = getSeasonLabelForGame(game, seasons)
              return (
                <Link
                  key={result.id}
                  to={`/games/${game.id}`}
                  className="card px-4 py-3 flex items-center gap-3 hover:border-white/15 transition-colors block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white/40 text-xs font-mono">第{game.gameNo}戦</p>
                      <span className="text-gold-400/55 text-xs">{seasonLabel}</span>
                    </div>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {formatGameDateTime(game.date, game.time)}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{participantLabel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold">{result.rank}位</p>
                    <p
                      className={`font-mono text-xs ${
                        result.point >= 0 ? 'text-gold-400/70' : 'text-red-400/70'
                      }`}
                    >
                      {pointStr}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <div className="mt-6 text-center">
        <Link to="/games" className="text-gold-400/70 hover:text-gold-400 text-sm font-medium">
          試合一覧を見る →
        </Link>
      </div>
    </Layout>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white font-semibold text-sm mt-1 font-mono">{value}</p>
    </div>
  )
}
