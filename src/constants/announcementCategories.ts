import type { AnnouncementCategory } from '../types'

export type { AnnouncementCategory }

export interface AnnouncementCategoryMeta {
  id: AnnouncementCategory
  label: string
  shortLabel: string
  description: string
  badgeClass: string
}

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategoryMeta[] = [
  {
    id: 'important',
    label: '重要',
    shortLabel: '重要',
    description: 'メンテ・ルール変更など必読の告知',
    badgeClass:
      'bg-red-500/20 text-red-200 border-red-500/35',
  },
  {
    id: 'update',
    label: 'アップデート',
    shortLabel: '更新',
    description: '新機能・改善のリリース',
    badgeClass:
      'bg-violet-500/20 text-violet-200 border-violet-500/35',
  },
  {
    id: 'bugfix',
    label: '不具合修正',
    shortLabel: '修正',
    description: 'バグ修正・障害復旧の報告',
    badgeClass:
      'bg-emerald-500/20 text-emerald-200 border-emerald-500/35',
  },
]

export const DEFAULT_ANNOUNCEMENT_CATEGORY: AnnouncementCategory = 'update'

export interface AnnouncementTemplate {
  id: string
  category: AnnouncementCategory
  name: string
  title: string
  body: string
}

/** テンプレート本文の冒頭（全テンプレート共通） */
export const ANNOUNCEMENT_TEMPLATE_HEADER =
  '皆さん、こんにちは。\n\nRivalt 運営です。\n\n'

/** テンプレート本文の末尾（全テンプレート共通） */
export const ANNOUNCEMENT_TEMPLATE_FOOTER =
  '\n\nこれからも Rivalt をよろしくお願いします。'

export function wrapAnnouncementTemplateBody(content: string): string {
  return `${ANNOUNCEMENT_TEMPLATE_HEADER}${content.trim()}${ANNOUNCEMENT_TEMPLATE_FOOTER}`
}

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  {
    id: 'important-maintenance',
    category: 'important',
    name: 'メンテナンス予告',
    title: '【重要】メンテナンスのお知らせ',
    body: wrapAnnouncementTemplateBody(
      '以下の日時でメンテナンスを行います。\n\n日時: YYYY/MM/DD HH:mm 〜 HH:mm\n\n作業中は Rivalt にアクセスできない場合があります。ご了承ください。',
    ),
  },
  {
    id: 'important-rules',
    category: 'important',
    name: 'ルール変更',
    title: '【重要】リーグ運用ルールの変更',
    body: wrapAnnouncementTemplateBody(
      'リーグ運用ルールを変更しました。必ず内容をご確認ください。\n\n（変更点を記載）',
    ),
  },
  {
    id: 'update-release',
    category: 'update',
    name: 'バージョンリリース',
    title: 'v0.4.0 をリリースしました',
    body: wrapAnnouncementTemplateBody(
      'Rivalt を更新しました。\n\n【新機能】\n・\n\n【改善】\n・\n\n詳細はランキング・試合画面からご確認ください。',
    ),
  },
  {
    id: 'update-season',
    category: 'update',
    name: 'シーズン開始',
    title: 'Season 2 を開始しました',
    body: wrapAnnouncementTemplateBody(
      '新しいシーズンが始まりました。\n\n・これまでの試合記録は通算ランキングに残ります\n・シーズン別ランキングは「Season 2」で集計されます',
    ),
  },
  {
    id: 'bugfix-generic',
    category: 'bugfix',
    name: '修正のお知らせ',
    title: '不具合を修正しました',
    body: wrapAnnouncementTemplateBody(
      '以下の不具合を修正しました。\n\n・（現象）\n\nご不便をおかけしました。',
    ),
  },
  {
    id: 'bugfix-known',
    category: 'bugfix',
    name: '既知の不具合',
    title: '既知の不具合について',
    body: wrapAnnouncementTemplateBody(
      '現在、以下の事象を確認しています。修正までお待ちください。\n\n・（現象）\n\n回避策がある場合はここに記載します。',
    ),
  },
]

export function getCategoryMeta(
  category: AnnouncementCategory | string | undefined,
): AnnouncementCategoryMeta {
  const found = ANNOUNCEMENT_CATEGORIES.find((c) => c.id === category)
  return found ?? ANNOUNCEMENT_CATEGORIES.find((c) => c.id === DEFAULT_ANNOUNCEMENT_CATEGORY)!
}
