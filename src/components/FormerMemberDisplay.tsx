import { Link } from 'react-router-dom'
import type { Player } from '../types'
import {
  DELETED_PLAYER_DISPLAY_NAME,
  getPlayerDisplayName,
  isFormerMember,
} from '../utils/playerAccount'

const sizeStyles = {
  sm: { avatar: 'w-8 h-8', dash: 'text-base' },
  md: { avatar: 'w-10 h-10', dash: 'text-lg' },
} as const

/** 退会済みプレイヤー用（アイコン枠 + 横棒） */
export function FormerMemberAvatar({
  size = 'sm',
  className = '',
}: {
  size?: keyof typeof sizeStyles
  className?: string
}) {
  const s = sizeStyles[size]
  return (
    <div
      className={`${s.avatar} ${className} rounded-full bg-white/[0.05] border border-white/8
        flex items-center justify-center text-white/30 font-light shrink-0 ${s.dash}`}
      aria-hidden
    >
      {DELETED_PLAYER_DISPLAY_NAME}
    </div>
  )
}

/** 退会済みプレイヤー用ラベル（横棒のみ） */
export function FormerMemberLabel({
  size = 'sm',
  className = '',
}: {
  size?: keyof typeof sizeStyles
  className?: string
}) {
  const s = sizeStyles[size]
  return (
    <span
      className={`inline-block text-white/35 font-light tracking-widest ${s.dash} ${className}`}
      title="退会したプレイヤー"
      aria-label="退会したプレイヤー"
    >
      {DELETED_PLAYER_DISPLAY_NAME}
    </span>
  )
}

type PlayerLike = Pick<Player, 'id' | 'name' | 'icon' | 'isActive' | 'deletedAt'>

/** 通常名 or 横棒表示。試合カード・詳細など React 表示向け */
export function PlayerNameDisplay({
  player,
  className = '',
  nameClassName = 'text-white/80',
  size = 'sm',
  linkTo,
  linkClassName = 'hover:text-gold-300 transition-colors',
}: {
  player?: PlayerLike | null
  className?: string
  nameClassName?: string
  size?: keyof typeof sizeStyles
  linkTo?: string
  linkClassName?: string
}) {
  if (isFormerMember(player)) {
    return (
      <span className={className}>
        <FormerMemberLabel size={size} />
      </span>
    )
  }

  const name = getPlayerDisplayName(player ?? undefined)
  if (linkTo) {
    return (
      <Link to={linkTo} className={`${nameClassName} ${linkClassName} ${className}`}>
        {name}
      </Link>
    )
  }

  return <span className={`${nameClassName} ${className}`}>{name}</span>
}
