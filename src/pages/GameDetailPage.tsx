import { useState } from 'react'

import { useParams, Link, useNavigate } from 'react-router-dom'

import { Layout } from '../components/Layout'

import { Loading } from '../components/Loading'

import { GameParticipantName } from '../components/GameParticipantName'

import { usePlayers } from '../hooks/usePlayers'

import { useGames } from '../hooks/useGames'

import { useGameResults } from '../hooks/useResults'

import { useSeasons } from '../hooks/useSeasons'

import { useAuth } from '../hooks/useAuth'

import {

  FormerMemberAvatar,

} from '../components/FormerMemberDisplay'

import { isCpuPlayerId } from '../constants/cpuPlayers'

import { isFormerMember } from '../utils/playerAccount'

import { buildDiscordMessage } from '../utils/discord'

import { formatGameDateTime } from '../utils/formatDateTime'

import { formatGameParticipantCount } from '../utils/gameParticipant'

import { getSeasonLabelForGame } from '../utils/season'

import { getFirebaseErrorMessage } from '../utils/firebaseError'



const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }



export function GameDetailPage() {

  const { gameId } = useParams<{ gameId: string }>()

  const navigate = useNavigate()

  const { isAdmin } = useAuth()

  const { players, loading: playersLoading } = usePlayers()

  const { games, loading: gamesLoading, deleteGame } = useGames()

  const {

    results,

    loading: resultsLoading,

    error: resultsError,

  } = useGameResults(gameId ?? '')

  const { seasons, seasonsLoading } = useSeasons()

  const [copied, setCopied] = useState(false)

  const [copyError, setCopyError] = useState('')

  const [deleting, setDeleting] = useState(false)

  const [deleteError, setDeleteError] = useState('')



  const loading =

    playersLoading || gamesLoading || resultsLoading || seasonsLoading



  const game = games.find((g) => g.id === gameId)

  const playerMap = new Map(players.map((p) => [p.id, p]))



  const sortedResults = [...results].sort((a, b) => a.rank - b.rank)



  const handleDelete = async () => {

    if (!gameId || !game) return

    const confirmed = window.confirm(

      `第${game.gameNo}戦を削除しますか？\nこの操作は取り消せません。`,

    )

    if (!confirmed) return



    setDeleteError('')

    setDeleting(true)



    try {

      await deleteGame(gameId)

      navigate('/games')

    } catch (error) {

      console.error(error)

      setDeleteError(

        getFirebaseErrorMessage(error, '削除に失敗しました。再試行してください。'),

      )

      setDeleting(false)

    }

  }



  const handleCopy = async () => {

    if (!game) return

    const text = buildDiscordMessage(game, sortedResults, players)



    try {

      if (navigator.clipboard?.writeText && window.isSecureContext) {

        await navigator.clipboard.writeText(text)

      } else {

        const textarea = document.createElement('textarea')

        textarea.value = text

        textarea.setAttribute('readonly', 'true')

        textarea.style.position = 'fixed'

        textarea.style.opacity = '0'

        document.body.appendChild(textarea)

        textarea.focus()

        textarea.select()



        const copiedByFallback = document.execCommand('copy')

        document.body.removeChild(textarea)



        if (!copiedByFallback) {

          throw new Error('copy-failed')

        }

      }



      setCopyError('')

      setCopied(true)

      setTimeout(() => setCopied(false), 2000)

    } catch (error) {

      console.error(error)

      setCopyError(

        getFirebaseErrorMessage(

          error,

          'コピーに失敗しました。下の共有文を手動でコピーしてください。',

        ),

      )

    }

  }



  if (loading) return <Layout><Loading /></Layout>



  if (!game) {

    return (

      <Layout>

        <div className="card py-12 text-center">

          <p className="text-white/30 mb-4">試合が見つかりません</p>

          <Link to="/games" className="btn-secondary text-sm">試合一覧へ</Link>

        </div>

      </Layout>

    )

  }



  const discordText = buildDiscordMessage(game, sortedResults, players)

  const formattedDate = formatGameDateTime(game.date, game.time)

  const seasonLabel = getSeasonLabelForGame(game, seasons)

  const participantLabel = formatGameParticipantCount(sortedResults)



  return (

    <Layout>

      <Link to="/games" className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block">

        ← 試合一覧

      </Link>



      <div className="card-gold px-4 py-4 mb-4">

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">

            <div className="flex items-center gap-2 flex-wrap">

              <p className="text-gold-400/60 text-xs font-mono">第{game.gameNo}戦</p>

              <span className="text-white/20 text-xs">·</span>

              <span className="text-gold-400/70 text-xs">{seasonLabel}</span>

            </div>

            <h1 className="font-display font-bold text-xl text-white mt-1">{formattedDate}</h1>

            <p className="text-white/50 text-sm mt-0.5">🎮 {game.appName}</p>

          </div>

          <span className="text-white/30 text-sm bg-white/5 px-3 py-1 rounded-full shrink-0 text-right leading-snug max-w-[10rem]">

            {participantLabel}

          </span>

        </div>

        {game.memo && (

          <p className="text-white/50 text-sm mt-3 pt-3 border-t border-white/[0.08]">

            📝 {game.memo}

          </p>

        )}

      </div>



      {isAdmin && (

        <div className="flex flex-col sm:flex-row gap-3 mb-4">

          <Link

            to={`/games/${gameId}/edit`}

            className="btn-secondary flex-1 text-center text-sm py-2.5"

          >

            編集

          </Link>

          <button

            type="button"

            onClick={handleDelete}

            disabled={deleting}

            className="flex-1 text-sm py-2.5 rounded-lg font-medium border border-red-500/40

                       bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors

                       disabled:opacity-50"

          >

            {deleting ? '削除中...' : '削除'}

          </button>

        </div>

      )}



      {deleteError && (

        <p className="text-red-300 text-sm mb-4">{deleteError}</p>

      )}



      <div className="card px-4 py-4 mb-4">

        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">

          結果

        </h2>

        {resultsError ? (

          <p className="text-red-300 text-sm">{resultsError}</p>

        ) : sortedResults.length === 0 ? (

          <p className="text-white/30 text-sm">結果がありません</p>

        ) : (

          <div className="space-y-2">

            {sortedResults.map((r) => {

              const emoji = RANK_EMOJI[r.rank]

              const pointStr = r.point >= 0 ? `+${r.point}` : `${r.point}`

              const cpu = isCpuPlayerId(r.playerId)

              const player = playerMap.get(r.playerId)

              const former = !cpu && isFormerMember(player)



              return (

                <div

                  key={r.id}

                  className={`flex items-center gap-3 p-2.5 rounded-lg ${

                    r.rank === 1 ? 'bg-gold-500/[0.08]' : 'bg-white/[0.03]'

                  }`}

                >

                  <span className="w-7 text-center text-lg shrink-0">

                    {emoji ?? (

                      <span className="text-white/40 font-mono text-sm">{r.rank}位</span>

                    )}

                  </span>

                  {cpu ? (

                    <div

                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center

                               text-sm flex-shrink-0"

                      aria-hidden

                    >

                      🤖

                    </div>

                  ) : former ? (

                    <FormerMemberAvatar size="sm" />

                  ) : (

                    <div

                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center

                               text-sm font-bold flex-shrink-0"

                    >

                      {player?.icon}

                    </div>

                  )}

                  <GameParticipantName

                    playerId={r.playerId}

                    players={players}

                    className="flex-1 min-w-0"

                    nameClassName={`font-medium text-sm ${

                      cpu ? 'text-white/65' : 'text-white'

                    }`}

                    size="sm"

                    linkTo={

                      cpu || former || !player

                        ? undefined

                        : `/players/${player.id}`

                    }

                  />

                  {!cpu && (

                    <span

                      className={`font-mono font-bold text-base shrink-0 ${

                        r.point >= 0 ? 'text-gold-400' : 'text-red-400'

                      }`}

                    >

                      {pointStr}pt

                    </span>

                  )}

                </div>

              )

            })}

          </div>

        )}

      </div>



      <div className="card px-4 py-4">

        <div className="flex items-center justify-between mb-3">

          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">

            Discord 共有文

          </h2>

          <button

            onClick={handleCopy}

            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${

              copied

                ? 'bg-green-500/20 text-green-400 border border-green-500/30'

                : 'bg-gold-500/15 text-gold-400 border border-gold-500/30 hover:bg-gold-500/25'

            }`}

          >

            {copied ? '✓ コピー済み' : 'コピー'}

          </button>

        </div>

        <pre className="text-white/70 text-xs font-mono whitespace-pre-wrap bg-black/30 rounded-lg p-3 leading-relaxed overflow-x-auto">

          {discordText}

        </pre>

        {copyError && (

          <p className="text-red-300 text-xs mt-3">{copyError}</p>

        )}

      </div>

    </Layout>

  )

}

