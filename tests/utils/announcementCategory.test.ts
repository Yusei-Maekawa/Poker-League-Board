import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import type { Announcement } from '../../src/types'
import { sortAnnouncements } from '../../src/utils/announcementCategory'

function item(
  partial: Partial<Announcement> & Pick<Announcement, 'id' | 'createdAt'>,
): Announcement {
  return {
    title: 't',
    body: 'b',
    isPinned: false,
    authorUid: 'u1',
    updatedAt: partial.createdAt,
    ...partial,
  }
}

describe('sortAnnouncements', () => {
  const t1 = Timestamp.fromMillis(1000)
  const t2 = Timestamp.fromMillis(2000)
  const t3 = Timestamp.fromMillis(3000)

  it('puts pinned first, each group newest first', () => {
    const sorted = sortAnnouncements([
      item({ id: 'a', createdAt: t2, isPinned: false, category: 'update' }),
      item({ id: 'b', createdAt: t3, isPinned: true, category: 'important' }),
      item({ id: 'c', createdAt: t1, isPinned: true, category: 'bugfix' }),
      item({ id: 'd', createdAt: t3, isPinned: false, category: 'important' }),
    ])
    expect(sorted.map((a) => a.id)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('sorts unpinned by createdAt only (not category)', () => {
    const sorted = sortAnnouncements([
      item({ id: 'old-important', createdAt: t1, category: 'important' }),
      item({ id: 'new-update', createdAt: t3, category: 'update' }),
      item({ id: 'mid-bugfix', createdAt: t2, category: 'bugfix' }),
    ])
    expect(sorted.map((a) => a.id)).toEqual([
      'new-update',
      'mid-bugfix',
      'old-important',
    ])
  })
})
