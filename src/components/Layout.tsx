import type { ReactNode } from 'react'
import { APP_NAME } from '../constants/app'
import { APP_VERSION_LABEL } from '../constants/version'
import { ActivityHubProvider } from '../context/ActivityHubContext'
import { Header } from './Header'
import { BannedParticipationBanner } from './BannedParticipationBanner'
import { DevEnvironmentBanner } from './DevEnvironmentBanner'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-felt-texture">
      <DevEnvironmentBanner />
      <BannedParticipationBanner />
      <ActivityHubProvider>
        <Header />
        <main className="app-container py-6 lg:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-fade-in">
          {children}
          <footer className="mt-10 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-white/30 text-xs font-medium tracking-wide">
              {APP_NAME} {APP_VERSION_LABEL}
            </p>
          </footer>
        </main>
      </ActivityHubProvider>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-white">{title}</h1>
        {subtitle && (
          <p className="text-white/50 text-sm lg:text-base mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}
