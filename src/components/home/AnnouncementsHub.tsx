import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnnouncementCategoryBadge } from '../AnnouncementCategoryBadge'
import type { Announcement } from '../../types'
import { formatTimestamp } from '../../utils/formatDateTime'

const PREVIEW_MAX = 48

export interface AnnouncementsHubProps {
  announcements: Announcement[]
  loading?: boolean
  fetchError?: string | null
  showAdminLink?: boolean
  /** ログイン時のみ。未読件数（0 ならバッジ非表示） */
  unreadCount?: number
  isUnread?: (announcementId: string) => boolean
  onMarkRead?: (announcementId: string) => void | Promise<void>
  /** icon = ヘッダー用のコンパクト表示（デフォルト） */
  variant?: 'icon' | 'card'
}

export function AnnouncementsHub({
  announcements,
  loading = false,
  fetchError = null,
  showAdminLink = false,
  unreadCount = 0,
  isUnread,
  onMarkRead,
  variant = 'icon',
}: AnnouncementsHubProps) {
  const [listOpen, setListOpen] = useState(false)
  const [detail, setDetail] = useState<Announcement | null>(null)

  const openList = () => {
    setDetail(null)
    setListOpen(true)
  }

  const closeAll = () => {
    setListOpen(false)
    setDetail(null)
  }

  const handleSelect = (item: Announcement) => {
    setDetail(item)
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={openList}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg
            bg-white/[0.06] border border-white/10 text-white/70
            hover:bg-white/10 hover:text-gold-300/90 hover:border-white/15 transition-colors"
          aria-label={
            loading
              ? 'お知らせを読み込み中'
              : unreadCount > 0
                ? `お知らせ 未読 ${unreadCount}件`
                : announcements.length > 0
                  ? `お知らせ ${announcements.length}件`
                  : 'お知らせ'
          }
          title="お知らせ"
        >
          <MegaphoneIcon className="w-[18px] h-[18px]" />
          {!loading && unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                text-[10px] font-bold font-mono flex items-center justify-center leading-none
                bg-gold-500 text-felt-900"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={openList}
          className="card px-4 py-3 w-full flex items-center justify-between gap-3
            hover:border-white/15 transition-colors text-left"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <MegaphoneIcon className="w-5 h-5 text-white/70 shrink-0" />
            <span className="text-white font-semibold text-sm">お知らせ</span>
            {loading ? (
              <span className="text-white/35 text-xs">読み込み中</span>
            ) : unreadCount > 0 ? (
              <span className="text-gold-400/90 text-xs font-mono bg-gold-500/15 px-2 py-0.5 rounded-full shrink-0">
                未読 {unreadCount}件
              </span>
            ) : announcements.length > 0 ? (
              <span className="text-white/35 text-xs shrink-0">
                {announcements.length}件
              </span>
            ) : (
              <span className="text-white/35 text-xs">0件</span>
            )}
          </span>
          <span className="text-white/40 text-xs shrink-0">見る →</span>
        </button>
      )}

      {fetchError && variant === 'card' && (
        <p className="text-red-300/90 text-xs mt-2 px-1">{fetchError}</p>
      )}

      {listOpen && (
        <AnnouncementsListModal
          announcements={announcements}
          loading={loading}
          fetchError={fetchError}
          showAdminLink={showAdminLink}
          isUnread={isUnread}
          onClose={closeAll}
          onSelect={handleSelect}
        />
      )}

      {detail && (
        <AnnouncementDetailModal
          item={detail}
          onClose={() => setDetail(null)}
          onMarkRead={onMarkRead}
        />
      )}
    </>
  )
}

function AnnouncementsListModal({
  announcements,
  loading,
  fetchError,
  showAdminLink,
  isUnread,
  onClose,
  onSelect,
}: {
  announcements: Announcement[]
  loading: boolean
  fetchError: string | null
  showAdminLink: boolean
  isUnread?: (announcementId: string) => boolean
  onClose: () => void
  onSelect: (item: Announcement) => void
}) {
  return (
    <ModalShell onClose={onClose} title="お知らせ">
      {fetchError && (
        <p className="text-red-300/90 text-sm mb-3">{fetchError}</p>
      )}
      {loading ? (
        <p className="text-white/40 text-sm text-center py-8">読み込み中...</p>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8 px-2">
          <p className="text-white/40 text-sm">お知らせはまだありません</p>
          {showAdminLink && (
            <Link
              to="/admin/announcements"
              onClick={onClose}
              className="text-gold-400/80 hover:text-gold-300 text-xs mt-3 inline-block"
            >
              お知らせを投稿する →
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2 max-h-[min(60vh,420px)] overflow-y-auto">
          {announcements.map((item) => {
            const unread = isUnread?.(item.id) ?? false
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`w-full text-left card px-3 py-3 hover:border-white/15 transition-colors
                    ${unread ? 'border-gold-500/25' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <AnnouncementCategoryBadge category={item.category} />
                        {item.isPinned && (
                          <span className="text-gold-400/80 text-[10px]" aria-hidden>
                            📌
                          </span>
                        )}
                        {unread && (
                          <span className="text-[10px] font-semibold text-gold-400/90">
                            未読
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm truncate ${
                          unread ? 'text-white font-semibold' : 'text-white font-medium'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.body?.trim() && (
                        <p className="text-white/45 text-xs mt-1 line-clamp-1">
                          {previewBody(item.body)}
                        </p>
                      )}
                      {item.createdAt && (
                        <p className="text-white/30 text-xs mt-1.5">
                          {formatTimestamp(item.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {showAdminLink && announcements.length > 0 && (
        <Link
          to="/admin/announcements"
          onClick={onClose}
          className="block text-center text-gold-400/70 hover:text-gold-400 text-xs font-medium mt-4"
        >
          お知らせを管理 →
        </Link>
      )}
    </ModalShell>
  )
}

function AnnouncementDetailModal({
  item,
  onClose,
  onMarkRead,
}: {
  item: Announcement
  onClose: () => void
  onMarkRead?: (announcementId: string) => void | Promise<void>
}) {
  useEffect(() => {
    void onMarkRead?.(item.id)
  }, [item.id, onMarkRead])

  return (
    <ModalShell
      onClose={onClose}
      title={item.title}
      pinned={item.isPinned}
      category={item.category}
    >
      {item.body?.trim() ? (
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
          {item.body.trim()}
        </p>
      ) : (
        <p className="text-white/40 text-sm">（本文なし）</p>
      )}
      {item.createdAt && (
        <p className="text-white/30 text-xs mt-4">
          {formatTimestamp(item.createdAt)}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="btn-secondary w-full text-sm mt-6"
      >
        一覧に戻る
      </button>
    </ModalShell>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
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
      <path d="M3 11v2a2 2 0 0 0 2 2h1l4 4V7L6 11H5a2 2 0 0 0-2 2z" />
      <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
      <path d="M17.5 6.5a7 7 0 0 1 0 11" />
    </svg>
  )
}

function previewBody(body: string): string {
  const oneLine = body.trim().replace(/\s+/g, ' ')
  if (oneLine.length <= PREVIEW_MAX) return oneLine
  return `${oneLine.slice(0, PREVIEW_MAX)}…`
}

function ModalShell({
  onClose,
  title,
  pinned,
  category,
  children,
}: {
  onClose: () => void
  title: string
  pinned?: boolean
  category?: Announcement['category']
  children: ReactNode
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] grid place-items-center p-4 sm:p-6 bg-black/65"
      style={{ minHeight: '100dvh' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-modal-title"
        className="relative card w-full max-w-md border border-white/10 shadow-xl
          max-h-[min(85dvh,640px)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center
            w-9 h-9 rounded-full bg-white/10 border border-white/15
            text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="閉じる"
        >
          <span className="text-xl leading-none font-light" aria-hidden>
            ×
          </span>
        </button>

        <div className="shrink-0 px-5 pt-5 pb-4 pr-14 border-b border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {category && <AnnouncementCategoryBadge category={category} size="md" />}
            {pinned && (
              <span className="text-gold-400/80 text-xs" aria-hidden>
                📌 ピン留め
              </span>
            )}
          </div>
          <h2
            id="announcement-modal-title"
            className="font-display font-bold text-lg text-white leading-snug"
          >
            {title}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
