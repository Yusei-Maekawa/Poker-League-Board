import { Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '../constants/app'
import { ActivityHubIcon } from './home/ActivityHubIcon'
import { AnnouncementsHub } from './home/AnnouncementsHub'
import { useAnnouncementUnread } from '../hooks/useAnnouncementUnread'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/games', label: 'Games' },
  { to: '/players', label: 'Players' },
]

export function Header() {
  const { user, myPlayer, hasPlayerProfile, isAdmin, logout } = useAuth()
  const {
    announcements,
    loading: announcementsLoading,
    error: announcementsError,
  } = useAnnouncements()
  const {
    unreadCount,
    isUnread,
    markAnnouncementRead,
    canTrackUnread,
  } = useAnnouncementUnread()
  const { pathname } = useLocation()

  const hideNav = pathname === '/login' || pathname === '/register'

  return (
    <header className="sticky top-0 z-50 bg-felt-900/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="app-container">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link to="/" className="font-display font-bold text-lg lg:text-xl leading-none">
            <span className="text-gold-400">Rival</span>
            <span className="text-white/80">t</span>
            <span className="sr-only">{APP_NAME}</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {!hideNav && (
                <>
                  <AnnouncementsHub
                    variant="icon"
                    announcements={announcements}
                    loading={announcementsLoading}
                    fetchError={announcementsError}
                    showAdminLink={isAdmin}
                    unreadCount={canTrackUnread ? unreadCount : 0}
                    isUnread={canTrackUnread ? isUnread : undefined}
                    onMarkRead={canTrackUnread ? markAnnouncementRead : undefined}
                  />
                  <ActivityHubIcon />
                </>
              )}
              {hasPlayerProfile && (
                <Link
                  to="/profile"
                  className="text-white/50 hover:text-gold-400 text-xs transition-colors hidden sm:inline"
                >
                  {myPlayer?.name ?? 'プロフィール'}
                </Link>
              )}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? ''}
                  className={`w-7 h-7 rounded-full ring-1 ${
                    isAdmin ? 'ring-gold-500/50' : 'ring-white/20'
                  }`}
                />
              ) : (
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isAdmin ? 'bg-gold-500/20 text-gold-400' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {(myPlayer?.name ?? user.displayName ?? '?').slice(0, 1)}
                </div>
              )}
              <div className="text-right">
                <p
                  className={`text-[10px] ${
                    isAdmin ? 'text-gold-400/80' : 'text-white/35'
                  }`}
                >
                  {isAdmin ? '管理者' : hasPlayerProfile ? 'プレイヤー' : '登録待ち'}
                </p>
                <button
                  onClick={logout}
                  className="text-white/50 hover:text-white/80 text-xs transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              {!hideNav && (
                <>
                  <AnnouncementsHub
                    variant="icon"
                    announcements={announcements}
                    loading={announcementsLoading}
                    fetchError={announcementsError}
                  />
                  <ActivityHubIcon />
                </>
              )}
              <Link
                to="/login"
                className="text-white/50 hover:text-gold-400 transition-colors"
              >
                ログイン
              </Link>
              <Link
                to="/register"
                className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
              >
                新規登録
              </Link>
            </div>
          )}
        </div>

        {!hideNav && (
          <nav className="flex gap-1 pb-2 overflow-x-auto scrollbar-none -mx-1 px-1">
            {NAV.map((item) => {
              const active =
                item.to === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-md text-sm lg:text-base font-medium transition-all duration-150 ${
                    active
                      ? 'bg-gold-500/15 text-gold-400'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
