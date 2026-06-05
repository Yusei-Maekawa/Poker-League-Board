import {
  ANNOUNCEMENT_CATEGORIES,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
} from '../constants/announcementCategories'
import type { Announcement, AnnouncementCategory } from '../types'

const VALID = new Set(ANNOUNCEMENT_CATEGORIES.map((c) => c.id))

export function normalizeAnnouncementCategory(
  value: string | undefined,
): AnnouncementCategory {
  if (value && VALID.has(value as AnnouncementCategory)) {
    return value as AnnouncementCategory
  }
  return DEFAULT_ANNOUNCEMENT_CATEGORY
}

export function sortAnnouncements(items: Announcement[]): Announcement[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}
