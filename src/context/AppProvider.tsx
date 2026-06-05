import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  deleteUser,
  type User,
} from 'firebase/auth'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, googleProvider, LEAGUE_ID, paths } from '../firebase'
import { DEFAULT_SEASON_ID } from '../constants/seasons'
import {
  normalizeSeasonLabel,
  planNextSeason,
  validateSeasonLabel,
} from '../utils/seasonAdmin'
import {
  resolveActiveSeasonId,
  resolveSeasonPeriodFromFields,
  type SeasonPeriodFields,
} from '../utils/seasonPeriod'
import type {
  Activity,
  Announcement,
  Game,
  LeagueConfig,
  Player,
  Result,
  Season,
  SeasonPointRules,
} from '../types'
import { DEFAULT_SEASON_POINT_RULES } from '../constants/pointRules'
import {
  normalizeSeasonPointRules,
  validateSeasonPointRules,
} from '../utils/seasonPointRules'
import { allocateGameNo } from '../utils/allocateGameNo'
import {
  normalizeAnnouncementCategory,
  sortAnnouncements,
} from '../utils/announcementCategory'
import { isBootstrapAdminUid } from '../utils/admin'
import { canBootstrapAdminWithdraw } from '../config/environment'
import {
  DELETED_PLAYER_ICON,
  DELETED_PLAYER_NAME,
  isPlayerAccountDeleted,
} from '../utils/playerAccount'
import { getDefaultGameTime } from '../utils/formatDateTime'
import { sanitizeUserText } from '../utils/sanitizeUserText'
import { ANNOUNCEMENT_LIMITS } from '../utils/validationLimits'

function sanitizeGameText(params: { appName: string; memo: string }) {
  return {
    appName: sanitizeUserText(params.appName).trim(),
    memo: sanitizeUserText(params.memo).trim(),
  }
}

type AppContextValue = {
  user: User | null
  myPlayer: Player | null
  hasPlayerProfile: boolean
  authLoading: boolean
  isAdmin: boolean
  isBootstrapAdmin: boolean
  canManageAdmins: boolean
  isPlayerParticipationSuspended: boolean
  login: () => Promise<void>
  logout: () => Promise<void>

  players: Player[]
  playersLoading: boolean
  playersError: string | null
  registerPlayer: (
    uid: string,
    params: { name: string; icon: string; memo: string },
  ) => Promise<void>
  updateOwnPlayer: (
    uid: string,
    params: { name: string; icon: string; memo: string },
  ) => Promise<void>
  deleteOwnAccount: (uid: string) => Promise<void>
  banPlayer: (uid: string) => Promise<void>
  unbanPlayer: (uid: string) => Promise<void>

  games: Game[]
  gamesLoading: boolean
  gamesError: string | null
  addGame: (params: {
    date: string
    appName: string
    memo: string
  }) => Promise<{ id: string; gameNo: number }>
  addGameWithResults: (params: {
    date: string
    appName: string
    memo: string
    entries: { playerId: string; rank: number; point: number }[]
  }) => Promise<{ id: string; gameNo: number }>
  updateGameWithResults: (
    gameId: string,
    params: {
      date: string
      appName: string
      memo: string
      entries: { playerId: string; rank: number; point: number }[]
    },
  ) => Promise<void>
  deleteGame: (gameId: string) => Promise<void>

  results: Result[]
  resultsLoading: boolean
  resultsError: string | null
  addResults: (
    entries: { gameId: string; playerId: string; rank: number; point: number }[],
  ) => Promise<void>

  announcements: Announcement[]
  announcementsLoading: boolean
  announcementsError: string | null
  createAnnouncement: (params: {
    title: string
    body: string
    category: Announcement['category']
    isPinned: boolean
  }) => Promise<void>
  updateAnnouncement: (
    id: string,
    params: {
      title: string
      body: string
      category: Announcement['category']
      isPinned: boolean
    },
  ) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>

  /** お知らせID → 既読時刻(ms)。ログイン時のみ Firestore 同期 */
  announcementReadAtMs: Record<string, number>
  announcementReadsLoading: boolean
  markAnnouncementRead: (announcementId: string) => Promise<void>

  bootstrapLeagueSeasons: () => Promise<void>
  createSeasonWithPeriod: (params: {
    period: SeasonPeriodFields
    label: string
  }) => Promise<{ id: string; label: string }>
  updateSeasonLabel: (seasonId: string, label: string) => Promise<void>
  updateSeasonPeriod: (
    seasonId: string,
    period: SeasonPeriodFields,
  ) => Promise<void>
  updateSeasonShowInRanking: (
    seasonId: string,
    showInRanking: boolean,
  ) => Promise<void>
  updateSeasonPointRules: (
    seasonId: string,
    rules: Partial<SeasonPointRules>,
  ) => Promise<void>

  activities: Activity[]
  activitiesLoading: boolean

  /** ホーム表示用: 主要データの初回取得が終わったか */
  homeDataReady: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isManagedAdmin, setIsManagedAdmin] = useState(false)
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [playerLoading, setPlayerLoading] = useState(false)

  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [playersError, setPlayersError] = useState<string | null>(null)

  const [games, setGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [gamesError, setGamesError] = useState<string | null>(null)

  const [results, setResults] = useState<Result[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [resultsError, setResultsError] = useState<string | null>(null)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null)
  const [announcementReadAtMs, setAnnouncementReadAtMs] = useState<
    Record<string, number>
  >({})
  const [announcementReadsLoading, setAnnouncementReadsLoading] = useState(false)

  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  const [leagueSeasons, setLeagueSeasons] = useState<Season[]>([])
  const configActiveSeasonIdRef = useRef(DEFAULT_SEASON_ID)
  const activeSeasonIdRef = useRef(DEFAULT_SEASON_ID)

  const syncActiveSeasonForNewGames = useCallback((seasons: Season[]) => {
    activeSeasonIdRef.current = resolveActiveSeasonId(
      seasons,
      configActiveSeasonIdRef.current,
    )
  }, [])

  useEffect(() => {
    const configRef = doc(db, paths.leagueConfig)
    const unsubscribe = onSnapshot(
      configRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as LeagueConfig
          if (data.activeSeasonId) {
            configActiveSeasonIdRef.current = data.activeSeasonId
          }
        } else {
          configActiveSeasonIdRef.current = DEFAULT_SEASON_ID
        }
        syncActiveSeasonForNewGames(leagueSeasons)
      },
      (err) => console.error('league config:', err),
    )
    return unsubscribe
  }, [leagueSeasons, syncActiveSeasonForNewGames])

  useEffect(() => {
    const q = query(collection(db, paths.seasons), orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Season,
        )
        setLeagueSeasons(items)
        syncActiveSeasonForNewGames(items)
      },
      (err) => console.error('seasons:', err),
    )
    return unsubscribe
  }, [syncActiveSeasonForNewGames])

  // --- Auth（スプラッシュ中から開始） ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) {
      setIsManagedAdmin(false)
      return
    }

    if (isBootstrapAdminUid(user.uid)) {
      setIsManagedAdmin(false)
      return
    }

    const adminRef = doc(db, paths.admins, user.uid)
    const unsubscribe = onSnapshot(
      adminRef,
      (snapshot) => {
        setIsManagedAdmin(snapshot.exists())
      },
      (err) => {
        console.error(err)
        setIsManagedAdmin(false)
      },
    )
    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user?.uid) {
      setMyPlayer(null)
      setPlayerLoading(false)
      return
    }

    setPlayerLoading(true)
    const playerRef = doc(db, paths.players, user.uid)
    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // 登録直後の楽観更新を、伝播遅延で誤って消さない
          setMyPlayer((prev) =>
            prev?.id === user.uid ? prev : null,
          )
        } else {
          setMyPlayer({ id: snapshot.id, ...snapshot.data() } as Player)
        }
        setPlayerLoading(false)
      },
      (err) => {
        console.error('player snapshot error:', err)
        setPlayerLoading(false)
      },
    )
    return unsubscribe
  }, [user?.uid])

  // --- League データ（スプラッシュ中から並行プリロード） ---
  useEffect(() => {
    const q = query(collection(db, paths.players), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPlayers(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Player),
        )
        setPlayersLoading(false)
      },
      (err) => {
        console.error(err)
        setPlayersError('プレイヤーの取得に失敗しました')
        setPlayersLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const q = query(collection(db, paths.games), orderBy('gameNo', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setGames(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Game))
        setGamesLoading(false)
      },
      (err) => {
        console.error(err)
        setGamesError('試合データの取得に失敗しました')
        setGamesLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const q = query(collection(db, paths.results), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setResults(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Result))
        setResultsLoading(false)
      },
      (err) => {
        console.error(err)
        setResultsError('結果データの取得に失敗しました')
        setResultsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const q = query(collection(db, paths.announcements), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Announcement,
        )
        setAnnouncements(sortAnnouncements(items))
        setAnnouncementsError(null)
        setAnnouncementsLoading(false)
      },
      (err) => {
        console.error(err)
        setAnnouncementsError('お知らせの取得に失敗しました')
        setAnnouncementsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const uid = user?.uid
    if (!uid) {
      setAnnouncementReadAtMs({})
      setAnnouncementReadsLoading(false)
      return
    }
    setAnnouncementReadsLoading(true)
    const readsCol = collection(db, paths.players, uid, 'announcementReads')
    const unsubscribe = onSnapshot(
      readsCol,
      (snapshot) => {
        const next: Record<string, number> = {}
        for (const d of snapshot.docs) {
          const readAt = d.data().readAt
          next[d.id] = readAt?.toMillis?.() ?? 0
        }
        setAnnouncementReadAtMs(next)
        setAnnouncementReadsLoading(false)
      },
      (err) => {
        console.error(err)
        setAnnouncementReadsLoading(false)
      },
    )
    return unsubscribe
  }, [user?.uid])

  useEffect(() => {
    const q = query(
      collection(db, paths.activities),
      orderBy('createdAt', 'desc'),
      limit(30),
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setActivities(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity),
        )
        setActivitiesLoading(false)
      },
      (err) => {
        console.error(err)
        setActivitiesLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const login = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const registerPlayer = useCallback(
    async (uid: string, params: { name: string; icon: string; memo: string }) => {
      const name = sanitizeUserText(params.name).trim()
      const icon = sanitizeUserText(params.icon).trim() || name.slice(0, 2)
      const memo = sanitizeUserText(params.memo).trim()
      if (icon.length > 4) {
        throw new Error('アイコンは4文字以内で選んでください')
      }
      const playerRef = doc(db, paths.players, uid)
      const now = Timestamp.now()
      const existing = await getDoc(playerRef)

      if (existing.exists()) {
        const prev = existing.data()
        if (prev.deletedAt != null) {
          // 退会後の再登録
          await updateDoc(playerRef, {
            authUid: uid,
            name,
            icon,
            memo,
            isActive: true,
            deletedAt: deleteField(),
            updatedAt: serverTimestamp(),
          })
        } else {
          await updateDoc(playerRef, {
            name,
            icon,
            memo,
            updatedAt: serverTimestamp(),
          })
        }
      } else {
        await setDoc(playerRef, {
          authUid: uid,
          name,
          icon,
          memo,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // onSnapshot より先に UI を更新（登録直後の AuthRedirect 競合を防ぐ）
      setMyPlayer({
        id: uid,
        authUid: uid,
        name,
        icon,
        memo,
        isActive: true,
        createdAt: (existing.data()?.createdAt as Timestamp | undefined) ?? now,
        updatedAt: now,
      })
      setPlayerLoading(false)

      if (!existing.exists() || existing.data()?.deletedAt != null) {
        // アクティビティは失敗しても登録自体は成功させる（Rules 未デプロイ時など）
        try {
          await addDoc(collection(db, paths.activities), {
            type: 'member_joined',
            playerId: uid,
            playerName: name,
            createdAt: serverTimestamp(),
          })
        } catch (activityErr) {
          console.error('member_joined activity write failed:', activityErr)
        }
      }
    },
    [],
  )

  const updateOwnPlayer = useCallback(
    async (uid: string, params: { name: string; icon: string; memo: string }) => {
      const name = sanitizeUserText(params.name).trim()
      const icon = sanitizeUserText(params.icon).trim() || name.slice(0, 2)
      const memo = sanitizeUserText(params.memo).trim()
      await updateDoc(doc(db, paths.players, uid), {
        name,
        icon,
        memo,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const deleteOwnAccount = useCallback(async (uid: string) => {
    if (isBootstrapAdminUid(uid) && !canBootstrapAdminWithdraw()) {
      throw new Error('初期管理者は退会できません。')
    }

    const playerRef = doc(db, paths.players, uid)
    const playerSnap = await getDoc(playerRef)
    if (!playerSnap.exists()) {
      throw new Error(
        `このリーグ（${LEAGUE_ID}）にプレイヤー登録がありません。VITE_LEAGUE_ID を変えた場合は /register から登録し直してください。`,
      )
    }

    const prev = playerSnap.data()
    const withdrawPatch: Record<string, unknown> = {
      name: DELETED_PLAYER_NAME,
      icon: DELETED_PLAYER_ICON,
      memo: '',
      isActive: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    if (!prev.authUid) {
      withdrawPatch.authUid = uid
    }
    await updateDoc(playerRef, withdrawPatch)

    setMyPlayer(null)
    setPlayerLoading(false)

    try {
      const adminRef = doc(db, paths.admins, uid)
      const adminSnap = await getDoc(adminRef)
      if (adminSnap.exists()) {
        await deleteDoc(adminRef)
      }
    } catch (adminErr) {
      console.error('admin doc remove on account delete:', adminErr)
    }

    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error('ログイン状態を確認してください。')
    }
    await reauthenticateWithPopup(currentUser, googleProvider)
    await deleteUser(currentUser)
  }, [])

  const banPlayer = useCallback(async (uid: string) => {
    await updateDoc(doc(db, paths.players, uid), {
      isActive: false,
      updatedAt: serverTimestamp(),
    })
  }, [])

  const unbanPlayer = useCallback(async (uid: string) => {
    await updateDoc(doc(db, paths.players, uid), {
      isActive: true,
      updatedAt: serverTimestamp(),
    })
  }, [])

  const addGame = useCallback(
    async (params: { date: string; appName: string; memo: string }) => {
      const gameNo = await allocateGameNo(db, paths.games, paths.gameCounter)
      const { appName, memo } = sanitizeGameText(params)
      const time = getDefaultGameTime()
      const docRef = await addDoc(collection(db, paths.games), {
        gameNo,
        seasonId: activeSeasonIdRef.current,
        date: params.date,
        time,
        appName,
        memo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { id: docRef.id, gameNo }
    },
    [],
  )

  const addGameWithResults = useCallback(
    async (params: {
      date: string
      appName: string
      memo: string
      entries: { playerId: string; rank: number; point: number }[]
    }) => {
      const gameNo = await allocateGameNo(db, paths.games, paths.gameCounter)
      const gamesRef = collection(db, paths.games)
      const resultsRef = collection(db, paths.results)
      const gameRef = doc(gamesRef)
      const batch = writeBatch(db)
      const { appName, memo } = sanitizeGameText(params)
      const time = getDefaultGameTime()
      batch.set(gameRef, {
        gameNo,
        seasonId: activeSeasonIdRef.current,
        date: params.date,
        time,
        appName,
        memo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      for (const entry of params.entries) {
        const resultRef = doc(resultsRef)
        batch.set(resultRef, {
          gameId: gameRef.id,
          ...entry,
          createdAt: serverTimestamp(),
        })
      }
      const actorUid = auth.currentUser?.uid
      if (!actorUid) throw new Error('ログインが必要です')
      const activityRef = doc(collection(db, paths.activities))
      batch.set(activityRef, {
        type: 'game_added',
        gameId: gameRef.id,
        gameNo,
        gameDate: params.date,
        gameTime: time,
        actorUid,
        createdAt: serverTimestamp(),
      })
      await batch.commit()
      return { id: gameRef.id, gameNo }
    },
    [],
  )

  const updateGameWithResults = useCallback(
    async (
      gameId: string,
      params: {
        date: string
        appName: string
        memo: string
        entries: { playerId: string; rank: number; point: number }[]
      },
    ) => {
      const resultsRef = collection(db, paths.results)
      const existingResults = await getDocs(
        query(resultsRef, where('gameId', '==', gameId)),
      )
      const batch = writeBatch(db)
      const gameRef = doc(db, paths.games, gameId)
      const { appName, memo } = sanitizeGameText(params)
      batch.update(gameRef, {
        date: params.date,
        appName,
        memo,
        updatedAt: serverTimestamp(),
      })
      for (const resultDoc of existingResults.docs) {
        batch.delete(resultDoc.ref)
      }
      for (const entry of params.entries) {
        const resultRef = doc(resultsRef)
        batch.set(resultRef, {
          gameId,
          ...entry,
          createdAt: serverTimestamp(),
        })
      }
      await batch.commit()
    },
    [],
  )

  const deleteGame = useCallback(async (gameId: string) => {
    const resultsRef = collection(db, paths.results)
    const existingResults = await getDocs(
      query(resultsRef, where('gameId', '==', gameId)),
    )
    const batch = writeBatch(db)
    batch.delete(doc(db, paths.games, gameId))
    for (const resultDoc of existingResults.docs) {
      batch.delete(resultDoc.ref)
    }
    await batch.commit()
  }, [])

  const addResults = useCallback(
    async (
      entries: { gameId: string; playerId: string; rank: number; point: number }[],
    ) => {
      await Promise.all(
        entries.map((entry) =>
          addDoc(collection(db, paths.results), {
            ...entry,
            createdAt: serverTimestamp(),
          }),
        ),
      )
    },
    [],
  )

  const sanitizeAnnouncement = (params: {
    title: string
    body: string
  }) => ({
    title: sanitizeUserText(params.title).trim(),
    body: sanitizeUserText(params.body).trim(),
  })

  const createAnnouncement = useCallback(
    async (params: {
      title: string
      body: string
      category: Announcement['category']
      isPinned: boolean
    }) => {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('ログインが必要です')
      const { title, body } = sanitizeAnnouncement(params)
      const category = normalizeAnnouncementCategory(params.category)
      if (!title) throw new Error('タイトルを入力してください')
      if (title.length > ANNOUNCEMENT_LIMITS.title) {
        throw new Error(`タイトルは${ANNOUNCEMENT_LIMITS.title}文字以内です`)
      }
      if (body.length > ANNOUNCEMENT_LIMITS.body) {
        throw new Error(`本文は${ANNOUNCEMENT_LIMITS.body}文字以内です`)
      }
      await addDoc(collection(db, paths.announcements), {
        title,
        body,
        category,
        isPinned: params.isPinned,
        authorUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const updateAnnouncement = useCallback(
    async (
      id: string,
      params: {
        title: string
        body: string
        category: Announcement['category']
        isPinned: boolean
      },
    ) => {
      const { title, body } = sanitizeAnnouncement(params)
      const category = normalizeAnnouncementCategory(params.category)
      if (!title) throw new Error('タイトルを入力してください')
      if (title.length > ANNOUNCEMENT_LIMITS.title) {
        throw new Error(`タイトルは${ANNOUNCEMENT_LIMITS.title}文字以内です`)
      }
      if (body.length > ANNOUNCEMENT_LIMITS.body) {
        throw new Error(`本文は${ANNOUNCEMENT_LIMITS.body}文字以内です`)
      }
      await updateDoc(doc(db, paths.announcements, id), {
        title,
        body,
        category,
        isPinned: params.isPinned,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const deleteAnnouncement = useCallback(async (id: string) => {
    await deleteDoc(doc(db, paths.announcements, id))
  }, [])

  const markAnnouncementRead = useCallback(
    async (announcementId: string) => {
      const uid = user?.uid
      if (!uid) return
      const readRef = doc(
        db,
        paths.players,
        uid,
        'announcementReads',
        announcementId,
      )
      await setDoc(readRef, { readAt: serverTimestamp() }, { merge: true })
    },
    [user?.uid],
  )

  const bootstrapLeagueSeasons = useCallback(async () => {
    const seasonRef = doc(db, paths.seasons, DEFAULT_SEASON_ID)
    const configRef = doc(db, paths.leagueConfig)
    const existing = await getDoc(seasonRef)
    const batch = writeBatch(db)
    const now = serverTimestamp()
    if (!existing.exists()) {
      batch.set(seasonRef, {
        label: 'Season 1',
        order: 1,
        createdAt: now,
        updatedAt: now,
      })
    }
    batch.set(
      configRef,
      { activeSeasonId: DEFAULT_SEASON_ID, updatedAt: now },
      { merge: true },
    )
    await batch.commit()
    configActiveSeasonIdRef.current = DEFAULT_SEASON_ID
    syncActiveSeasonForNewGames(
      existing.exists()
        ? leagueSeasons
        : [
            {
              id: DEFAULT_SEASON_ID,
              label: 'Season 1',
              order: 1,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            },
          ],
    )
  }, [leagueSeasons, syncActiveSeasonForNewGames])

  const createSeasonWithPeriod = useCallback(
    async (params: { period: SeasonPeriodFields; label: string }) => {
      const labelErr = validateSeasonLabel(params.label)
      if (labelErr) throw new Error(labelErr)
      const label = normalizeSeasonLabel(params.label)
      const snap = await getDocs(
        query(collection(db, paths.seasons), orderBy('order', 'asc')),
      )
      const existing = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Season[]
      const resolved = resolveSeasonPeriodFromFields(
        params.period,
        existing,
      )
      if ('error' in resolved) {
        throw new Error(resolved.error)
      }
      const planned = planNextSeason(existing)
      const newRef = doc(db, paths.seasons, planned.id)
      if ((await getDoc(newRef)).exists()) {
        throw new Error(`${label} はすでに存在します`)
      }
      const now = serverTimestamp()
      const batch = writeBatch(db)
      const seasonData: Record<string, unknown> = {
        label,
        order: planned.order,
        showInRanking: true,
        createdAt: now,
        updatedAt: now,
      }
      if (resolved.ok.kind === 'set') {
        seasonData.startsAt = resolved.ok.startsAt
        seasonData.endsAt = resolved.ok.endsAt
      }
      batch.set(newRef, seasonData)
      batch.set(
        doc(db, paths.leagueConfig),
        { activeSeasonId: planned.id, updatedAt: now },
        { merge: true },
      )
      await batch.commit()
      configActiveSeasonIdRef.current = planned.id
      const newSeason: Season = {
        id: planned.id,
        label,
        order: planned.order,
        showInRanking: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      if (resolved.ok.kind === 'set') {
        newSeason.startsAt = resolved.ok.startsAt
        newSeason.endsAt = resolved.ok.endsAt
      }
      syncActiveSeasonForNewGames([...existing, newSeason])
      return { id: planned.id, label }
    },
    [syncActiveSeasonForNewGames],
  )

  const updateSeasonLabel = useCallback(async (seasonId: string, label: string) => {
    const labelErr = validateSeasonLabel(label)
    if (labelErr) throw new Error(labelErr)
    const normalized = normalizeSeasonLabel(label)
    const seasonRef = doc(db, paths.seasons, seasonId)
    const snap = await getDoc(seasonRef)
    if (!snap.exists()) {
      throw new Error('シーズンが見つかりません')
    }
    await updateDoc(seasonRef, {
      label: normalized,
      updatedAt: serverTimestamp(),
    })
  }, [])

  const updateSeasonPeriod = useCallback(
    async (seasonId: string, period: SeasonPeriodFields) => {
      const snap = await getDocs(
        query(collection(db, paths.seasons), orderBy('order', 'asc')),
      )
      const existing = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Season[]
      const resolved = resolveSeasonPeriodFromFields(
        period,
        existing,
        seasonId,
      )
      if ('error' in resolved) {
        throw new Error(resolved.error)
      }
      const seasonRef = doc(db, paths.seasons, seasonId)
      const seasonSnap = await getDoc(seasonRef)
      if (!seasonSnap.exists()) {
        throw new Error('シーズンが見つかりません')
      }
      if (resolved.ok.kind === 'unset') {
        await updateDoc(seasonRef, {
          startsAt: deleteField(),
          endsAt: deleteField(),
          updatedAt: serverTimestamp(),
        })
        return
      }
      await updateDoc(seasonRef, {
        startsAt: resolved.ok.startsAt,
        endsAt: resolved.ok.endsAt,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const updateSeasonShowInRanking = useCallback(
    async (seasonId: string, showInRanking: boolean) => {
      const seasonRef = doc(db, paths.seasons, seasonId)
      const snap = await getDoc(seasonRef)
      if (!snap.exists()) {
        throw new Error('シーズンが見つかりません')
      }
      await updateDoc(seasonRef, {
        showInRanking,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const updateSeasonPointRules = useCallback(
    async (seasonId: string, rules: Partial<SeasonPointRules>) => {
      const err = validateSeasonPointRules(rules)
      if (err) throw new Error(err)
      const normalized = normalizeSeasonPointRules(rules)
      const d = DEFAULT_SEASON_POINT_RULES
      const isDefault =
        normalized.rank1 === d.rank1 &&
        normalized.rank2 === d.rank2 &&
        normalized.rank3 === d.rank3 &&
        normalized.rank4 === d.rank4 &&
        normalized.rank5Plus === d.rank5Plus &&
        normalized.lastPlace === d.lastPlace
      const seasonRef = doc(db, paths.seasons, seasonId)
      const snap = await getDoc(seasonRef)
      if (!snap.exists()) {
        throw new Error('シーズンが見つかりません')
      }
      if (isDefault) {
        await updateDoc(seasonRef, {
          pointRules: deleteField(),
          updatedAt: serverTimestamp(),
        })
        return
      }
      await updateDoc(seasonRef, {
        pointRules: normalized,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const isBootstrapAdmin = isBootstrapAdminUid(user?.uid)
  const isAdmin = isBootstrapAdmin || isManagedAdmin
  const hasPlayerProfile =
    !!myPlayer && !isPlayerAccountDeleted(myPlayer)
  // 管理者 doc の確認は画面全体をブロックしない（登録画面が Loading で固まるのを防ぐ）
  const authLoadingCombined =
    authLoading || (user ? playerLoading && !myPlayer : false)
  const homeDataReady =
    !playersLoading &&
    !gamesLoading &&
    !resultsLoading &&
    !announcementsLoading &&
    !activitiesLoading

  const isPlayerParticipationSuspended =
    !!user &&
    !!myPlayer &&
    !isPlayerAccountDeleted(myPlayer) &&
    !myPlayer.isActive &&
    !isAdmin

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      myPlayer,
      hasPlayerProfile,
      authLoading: authLoadingCombined,
      isAdmin,
      isBootstrapAdmin,
      canManageAdmins: isBootstrapAdmin,
      isPlayerParticipationSuspended,
      login,
      logout,
      players,
      playersLoading,
      playersError,
      registerPlayer,
      updateOwnPlayer,
      deleteOwnAccount,
      banPlayer,
      unbanPlayer,
      games,
      gamesLoading,
      gamesError,
      addGame,
      addGameWithResults,
      updateGameWithResults,
      deleteGame,
      results,
      resultsLoading,
      resultsError,
      addResults,
      announcements,
      announcementsLoading,
      announcementsError,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      announcementReadAtMs,
      announcementReadsLoading,
      markAnnouncementRead,
      bootstrapLeagueSeasons,
      createSeasonWithPeriod,
      updateSeasonLabel,
      updateSeasonPeriod,
      updateSeasonShowInRanking,
      updateSeasonPointRules,
      activities,
      activitiesLoading,
      homeDataReady,
    }),
    [
      user,
      myPlayer,
      hasPlayerProfile,
      authLoadingCombined,
      isAdmin,
      isBootstrapAdmin,
      isPlayerParticipationSuspended,
      login,
      logout,
      players,
      playersLoading,
      playersError,
      registerPlayer,
      updateOwnPlayer,
      deleteOwnAccount,
      banPlayer,
      unbanPlayer,
      games,
      gamesLoading,
      gamesError,
      addGame,
      addGameWithResults,
      updateGameWithResults,
      deleteGame,
      results,
      resultsLoading,
      resultsError,
      addResults,
      announcements,
      announcementsLoading,
      announcementsError,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      announcementReadAtMs,
      announcementReadsLoading,
      markAnnouncementRead,
      bootstrapLeagueSeasons,
      createSeasonWithPeriod,
      updateSeasonLabel,
      updateSeasonPeriod,
      updateSeasonShowInRanking,
      updateSeasonPointRules,
      activities,
      activitiesLoading,
      homeDataReady,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return ctx
}
