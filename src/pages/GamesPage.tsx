import { Link } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { GameCard } from '../components/GameCard'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { useSeasons } from '../hooks/useSeasons'
import { getSeasonLabelForGame } from '../utils/season'
import { compareGamesByRecency } from '../utils/gameSort'

export function GamesPage() {
  const { isAdmin } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useResults()
  const { seasons, seasonsLoading } = useSeasons()

  const loading = playersLoading || gamesLoading || resultsLoading || seasonsLoading

  const sortedGames = [...games].sort(compareGamesByRecency)

  return (
    <Layout>
      <PageHeader
        title="試合一覧"
        subtitle={`全${games.length}試合`}
        action={
          isAdmin ? (
            <Link to="/games/new" className="btn-primary text-sm">
              ＋ 追加
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <Loading />
      ) : sortedGames.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30 mb-4">まだ試合がありません</p>
          {isAdmin && (
            <Link to="/games/new" className="btn-primary text-sm">
              最初の試合を追加
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {sortedGames.map((game) => {
            const gameResults = results.filter((r) => r.gameId === game.id)
            return (
              <GameCard
                key={game.id}
                game={game}
                results={gameResults}
                players={players}
                seasonLabel={getSeasonLabelForGame(game, seasons)}
              />
            )
          })}
        </div>
      )}
    </Layout>
  )
}
