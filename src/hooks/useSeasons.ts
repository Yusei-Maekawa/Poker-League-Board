import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import {
  ALL_SEASONS_SCOPE,
  DEFAULT_SEASON_ID,
  FALLBACK_SEASONS,
  type SeasonScope,
} from '../constants/seasons'
import type { LeagueConfig, Season } from '../types'
import { filterSeasonsForRanking } from '../utils/seasonRanking'
import { resolveActiveSeasonId } from '../utils/seasonPeriod'

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [hasFirestoreSeasons, setHasFirestoreSeasons] = useState(false)
  const [seasonsLoading, setSeasonsLoading] = useState(true)
  const [configActiveSeasonId, setConfigActiveSeasonId] = useState(DEFAULT_SEASON_ID)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, paths.seasons),
      orderBy('order', 'asc'),
    )
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setHasFirestoreSeasons(!snap.empty)
        if (snap.empty) {
          setSeasons([])
        } else {
          setSeasons(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Season),
          )
        }
        setSeasonsLoading(false)
      },
      (err) => {
        console.error(err)
        setSeasonsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const ref = doc(db, paths.leagueConfig)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as LeagueConfig
          if (data.activeSeasonId) {
            setConfigActiveSeasonId(data.activeSeasonId)
          }
        } else {
          setConfigActiveSeasonId(DEFAULT_SEASON_ID)
        }
        setConfigLoading(false)
      },
      (err) => {
        console.error(err)
        setConfigLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const displaySeasons = useMemo(() => {
    if (seasons.length > 0) return seasons
    return FALLBACK_SEASONS as Season[]
  }, [seasons])

  const activeSeasonId = useMemo(
    () => resolveActiveSeasonId(displaySeasons, configActiveSeasonId),
    [displaySeasons, configActiveSeasonId],
  )

  const seasonsForRanking = useMemo(
    () => filterSeasonsForRanking(displaySeasons),
    [displaySeasons],
  )

  return {
    seasons: displaySeasons,
    seasonsForRanking,
    hasFirestoreSeasons,
    seasonsLoading: seasonsLoading || configLoading,
    activeSeasonId,
    configActiveSeasonId,
  }
}

export type { SeasonScope }
export { ALL_SEASONS_SCOPE }
