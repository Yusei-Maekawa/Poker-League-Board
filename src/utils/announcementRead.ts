import type { Announcement } from '../types'

/** 新規投稿・編集のどちらが新しいかで未読判定に使う */
export function getAnnouncementRevisionMs(a: Announcement): number {
  const created = a.createdAt?.toMillis?.() ?? 0
  const updated = a.updatedAt?.toMillis?.() ?? created
  return Math.max(created, updated)
}

export function isAnnouncementUnread(
  announcement: Announcement,
  readAtMsById: Record<string, number>,
): boolean {
  const readAt = readAtMsById[announcement.id] ?? 0
  return getAnnouncementRevisionMs(announcement) > readAt
}

export function countUnreadAnnouncements(
  announcements: Announcement[],
  readAtMsById: Record<string, number>,
): number {
  return announcements.filter((a) => isAnnouncementUnread(a, readAtMsById)).length
}
