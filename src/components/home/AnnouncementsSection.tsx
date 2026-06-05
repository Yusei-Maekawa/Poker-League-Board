import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnnouncementCategoryBadge } from '../AnnouncementCategoryBadge'
import type { Announcement } from '../../types'
import { formatTimestamp } from '../../utils/formatDateTime'

/** 折りたたみ時のプレビュー上限（文字数） */
const BODY_PREVIEW_MAX = 72

interface AnnouncementsSectionProps {
  announcements: Announcement[]
  loading?: boolean
  fetchError?: string | null
  showAdminLink?: boolean
}

function announcementNeedsExpand(body: string): boolean {
  const trimmed = body.trim()
  if (!trimmed) return false
  return trimmed.length > BODY_PREVIEW_MAX || trimmed.includes('\n')
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const [expanded, setExpanded] = useState(false)
  const body = item.body?.trim() ?? ''
  const canExpand = announcementNeedsExpand(body)

  const toggle = () => {
    if (canExpand) setExpanded((v) => !v)
  }

  return (
    <article
      className={`card px-4 py-3 ${item.isPinned ? 'border-gold-500/25' : ''}`}
    >
      <div className="flex items-start gap-2">
        {item.isPinned && (
          <span className="text-gold-400/80 text-xs shrink-0 mt-0.5" aria-hidden>
            📌
          </span>
        )}
        <div className="min-w-0 flex-1">
          {canExpand ? (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              className="w-full text-left group"
            >
              <AnnouncementContent
                item={item}
                body={body}
                expanded={expanded}
                canExpand
              />
            </button>
          ) : (
            <AnnouncementContent
              item={item}
              body={body}
              expanded={true}
              canExpand={false}
            />
          )}
          {item.createdAt && (
            <p className="text-white/30 text-xs mt-2">
              {formatTimestamp(item.createdAt)}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function AnnouncementContent({
  item,
  body,
  expanded,
  canExpand,
}: {
  item: Announcement
  body: string
  expanded: boolean
  canExpand: boolean
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        <AnnouncementCategoryBadge category={item.category} />
      </div>
      <h3
        className={`text-white font-semibold text-sm ${
          canExpand ? 'group-hover:text-gold-200/95 transition-colors' : ''
        }`}
      >
        {item.title}
      </h3>
      {body && (
        <p
          className={`text-white/55 text-sm mt-1 leading-relaxed ${
            expanded || !canExpand
              ? 'whitespace-pre-wrap'
              : 'line-clamp-2'
          }`}
        >
          {body}
        </p>
      )}
      {canExpand && (
        <p className="text-gold-400/70 group-hover:text-gold-400/90 text-xs font-medium mt-2 transition-colors">
          {expanded ? '閉じる ▲' : '詳細を見る ▼'}
        </p>
      )}
    </>
  )
}

export function AnnouncementsSection({
  announcements,
  loading = false,
  fetchError = null,
  showAdminLink,
}: AnnouncementsSectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg lg:text-xl text-white">
          📢 お知らせ
        </h2>
        {showAdminLink && (
          <Link
            to="/admin/announcements"
            className="text-gold-400/70 hover:text-gold-400 text-xs font-medium transition-colors"
          >
            管理 →
          </Link>
        )}
      </div>

      {fetchError && (
        <div className="card px-4 py-3 mb-2 border-red-500/30">
          <p className="text-red-300/90 text-sm">{fetchError}</p>
        </div>
      )}

      {loading ? (
        <div className="card py-6 text-center">
          <p className="text-white/35 text-sm">読み込み中...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card py-6 text-center px-4">
          <p className="text-white/40 text-sm">お知らせはまだありません</p>
          {showAdminLink && (
            <p className="text-white/35 text-xs mt-2 leading-relaxed">
              管理者は
              <Link to="/admin/announcements" className="text-gold-400/80 hover:text-gold-300 mx-1">
                お知らせ管理
              </Link>
              からアップデート情報などを投稿できます
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {announcements.slice(0, 5).map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
