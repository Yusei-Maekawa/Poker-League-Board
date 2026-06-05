import { useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppProvider'
import { AuthRedirect } from './components/AuthRedirect'
import { SplashScreen } from './components/SplashScreen'
import { useSplash } from './hooks/useSplash'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { AllTimeRankingPage } from './pages/AllTimeRankingPage'
import { GamesPage } from './pages/GamesPage'
import { GameDetailPage } from './pages/GameDetailPage'
import { PlayersPage } from './pages/PlayersPage'
import { PlayerDetailPage } from './pages/PlayerDetailPage'
import { AdminAnnouncementsPage } from './pages/AdminAnnouncementsPage'
import { AdminSeasonsPage } from './pages/AdminSeasonsPage'
import { NewGamePage } from './pages/NewGamePage'
import { EditGamePage } from './pages/EditGamePage'

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

/** スプラッシュ後も URL を維持するパス（replaceState で / に潰さない） */
function shouldPreservePathAfterSplash(pathname: string): boolean {
  if (pathname === '/') return true
  const preserve = ['/register', '/login', '/profile', '/admin', '/games', '/players', '/ranking']
  return preserve.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function AppShell() {
  const splashPhase = useSplash()
  const didNormalizeLaunchUrl = useRef(false)

  if (splashPhase !== 'done') {
    return <SplashScreen phase={splashPhase === 'out' ? 'out' : 'in'} />
  }

  // 起動時のみ: 不明な deep link を / に寄せる（/register 等は維持）
  if (!didNormalizeLaunchUrl.current) {
    didNormalizeLaunchUrl.current = true
    const path = window.location.pathname
    if (!shouldPreservePathAfterSplash(path)) {
      window.history.replaceState(null, '', '/')
    }
  }

  return (
    <BrowserRouter>
      <AuthRedirect>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/ranking/all-time" element={<AllTimeRankingPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/new" element={<NewGamePage />} />
          <Route path="/games/:gameId/edit" element={<EditGamePage />} />
          <Route path="/games/:gameId" element={<GameDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:playerId/all-time" element={<PlayerDetailPage />} />
          <Route path="/players/:playerId" element={<PlayerDetailPage />} />
          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/admin/seasons" element={<AdminSeasonsPage />} />
        </Routes>
      </AuthRedirect>
    </BrowserRouter>
  )
}
