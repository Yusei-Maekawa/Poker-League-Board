import { getCategoryMeta } from '../constants/announcementCategories'
import { normalizeAnnouncementCategory } from '../utils/announcementCategory'
import type { AnnouncementCategory } from '../types'

export function AnnouncementCategoryBadge({
  category,
  size = 'sm',
}: {
  category: AnnouncementCategory | string | undefined
  size?: 'sm' | 'md'
}) {
  const meta = getCategoryMeta(normalizeAnnouncementCategory(category))
  const sizeClass =
    size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-[10px] px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center shrink-0 font-semibold rounded-full border
        ${meta.badgeClass} ${sizeClass}`}
    >
      {meta.label}
    </span>
  )
}
