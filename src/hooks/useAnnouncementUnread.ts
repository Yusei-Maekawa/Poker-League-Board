import { useMemo } from 'react'
import { useAppContext } from '../context/AppProvider'
import {
  countUnreadAnnouncements,
  isAnnouncementUnread,
} from '../utils/announcementRead'

export function useAnnouncementUnread() {
  const {
    user,
    announcements,
    announcementReadAtMs,
    announcementReadsLoading,
    markAnnouncementRead,
  } = useAppContext()

  const unreadCount = useMemo(() => {
    if (!user) return 0
    return countUnreadAnnouncements(announcements, announcementReadAtMs)
  }, [user, announcements, announcementReadAtMs])

  const isUnread = (announcementId: string) => {
    if (!user) return false
    const item = announcements.find((a) => a.id === announcementId)
    if (!item) return false
    return isAnnouncementUnread(item, announcementReadAtMs)
  }

  return {
    unreadCount,
    isUnread,
    readsLoading: announcementReadsLoading,
    markAnnouncementRead,
    canTrackUnread: !!user,
  }
}
