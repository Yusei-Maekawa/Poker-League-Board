import { Link } from 'react-router-dom'

type AllTimeReferenceLinkProps = {
  to?: string
  /** 2行目の短いラベル */
  label?: string
  className?: string
}

/** 通算成績（参考）へのコンパクト導線（ページ右上向け） */
export function AllTimeReferenceLink({
  to = '/ranking/all-time',
  label = '通算成績',
  className = '',
}: AllTimeReferenceLinkProps) {
  return (
    <Link
      to={to}
      title="通算成績（参考）— 全シーズン合算・pt は参考値"
      className={`inline-flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/10 bg-white/[0.06] hover:border-gold-500/40 hover:bg-gold-500/10 transition-colors shrink-0 ${className}`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-500/15 text-base leading-none"
        aria-hidden
      >
        📊
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block text-[10px] text-white/45 uppercase tracking-wide">
          参考
        </span>
        <span className="block text-xs font-medium text-gold-400/95 truncate max-w-[5.5rem] sm:max-w-[7rem]">
          {label}
        </span>
      </span>
    </Link>
  )
}

type SeasonScopeLinkProps = {
  to?: string
  label?: string
  className?: string
}

/** シーズンランキングへ戻るコンパクト導線（通算ページ右上向け） */
export function SeasonRankingLink({
  to = '/ranking',
  label = 'シーズン',
  className = '',
}: SeasonScopeLinkProps) {
  return (
    <Link
      to={to}
      title="シーズンランキングへ"
      className={`inline-flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/10 bg-white/[0.06] hover:border-gold-500/40 hover:bg-gold-500/10 transition-colors shrink-0 ${className}`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-base leading-none"
        aria-hidden
      >
        🏆
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block text-[10px] text-white/45 uppercase tracking-wide">
          戻る
        </span>
        <span className="block text-xs font-medium text-white/85 truncate max-w-[5.5rem]">
          {label}
        </span>
      </span>
    </Link>
  )
}
