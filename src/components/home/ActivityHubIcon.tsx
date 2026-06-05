import { useActivityHub } from '../../context/ActivityHubContext'

export function ActivityHubIcon() {
  const { openList, newCount, loading } = useActivityHub()

  return (
    <button
      type="button"
      onClick={openList}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg
        bg-white/[0.06] border border-white/10 text-white/70
        hover:bg-white/10 hover:text-gold-300/90 hover:border-white/15 transition-colors"
      aria-label={
        loading
          ? 'アクティビティを読み込み中'
          : newCount > 0
            ? `アクティビティ 新着 ${newCount}件`
            : 'アクティビティ'
      }
      title="アクティビティ"
    >
      <ActivityClockIcon className="w-[18px] h-[18px]" />
      {!loading && newCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
            text-[10px] font-bold font-mono flex items-center justify-center leading-none
            bg-gold-500 text-felt-900"
        >
          {newCount > 9 ? '9+' : newCount}
        </span>
      )}
    </button>
  )
}

function ActivityClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
