import { useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import { Layout, PageHeader } from '../components/Layout'
import { StickyFeedback } from '../components/StickyFeedback'

import { Loading } from '../components/Loading'

import { LimitedTextField } from '../components/LimitedTextField'

import { AnnouncementCategoryBadge } from '../components/AnnouncementCategoryBadge'

import { useAnnouncements } from '../hooks/useAnnouncements'

import { useAuth } from '../hooks/useAuth'

import {

  ANNOUNCEMENT_CATEGORIES,

  ANNOUNCEMENT_TEMPLATES,

  DEFAULT_ANNOUNCEMENT_CATEGORY,

  type AnnouncementTemplate,

} from '../constants/announcementCategories'

import { normalizeAnnouncementCategory } from '../utils/announcementCategory'

import { ANNOUNCEMENT_LIMITS } from '../utils/validationLimits'

import { formatTimestamp } from '../utils/formatDateTime'

import { getFirebaseErrorMessage } from '../utils/firebaseError'

import type { Announcement, AnnouncementCategory } from '../types'



type FormState = {

  title: string

  body: string

  category: AnnouncementCategory

  isPinned: boolean

}



const emptyForm: FormState = {

  title: '',

  body: '',

  category: DEFAULT_ANNOUNCEMENT_CATEGORY,

  isPinned: false,

}



export function AdminAnnouncementsPage() {

  const { isAdmin, loading: authLoading } = useAuth()

  const {

    announcements,

    loading,

    createAnnouncement,

    updateAnnouncement,

    deleteAnnouncement,

  } = useAnnouncements()



  const [form, setForm] = useState<FormState>(emptyForm)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')



  const templatesForCategory = useMemo(

    () => ANNOUNCEMENT_TEMPLATES.filter((t) => t.category === form.category),

    [form.category],

  )



  if (authLoading || loading) {

    return (

      <Layout>

        <Loading />

      </Layout>

    )

  }



  if (!isAdmin) {

    return (

      <Layout>

        <div className="card py-12 text-center">

          <p className="text-white/50 mb-4">管理者ログインが必要です</p>

          <Link to="/" className="btn-secondary text-sm">

            ホームへ

          </Link>

        </div>

      </Layout>

    )

  }



  const startEdit = (item: Announcement) => {

    setEditingId(item.id)

    setForm({

      title: item.title,

      body: item.body,

      category: normalizeAnnouncementCategory(item.category),

      isPinned: item.isPinned,

    })

    setError('')

  }



  const cancelEdit = () => {

    setEditingId(null)

    setForm(emptyForm)

    setError('')

  }



  const applyTemplate = (template: AnnouncementTemplate) => {

    if (form.title.trim() || form.body.trim()) {

      if (!window.confirm('入力中の内容をテンプレートで上書きしますか？')) return

    }

    setForm((f) => ({

      ...f,

      category: template.category,

      title: template.title,

      body: template.body,

    }))

  }



  const handleSubmit = async () => {

    setError('')
    setMessage('')

    setSubmitting(true)

    try {

      if (editingId) {

        await updateAnnouncement(editingId, form)
        setMessage('お知らせを更新しました')

      } else {

        await createAnnouncement(form)
        setMessage('お知らせを投稿しました')

      }

      cancelEdit()

    } catch (e) {

      setError(getFirebaseErrorMessage(e, '保存に失敗しました'))

    } finally {

      setSubmitting(false)

    }

  }



  const handleDelete = async (id: string) => {

    if (!window.confirm('このお知らせを削除しますか？')) return

    setError('')
    setMessage('')

    try {

      await deleteAnnouncement(id)

      if (editingId === id) cancelEdit()
      setMessage('お知らせを削除しました')

    } catch (e) {

      setError(getFirebaseErrorMessage(e, '削除に失敗しました'))

    }

  }



  return (

    <Layout>

      <Link

        to="/"

        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"

      >

        ← ホーム

      </Link>



      <PageHeader title="お知らせ管理" subtitle="ホームに表示する運営告知" />



      <p className="text-sm mb-5">

        <Link

          to="/admin/seasons"

          className="text-gold-400/70 hover:text-gold-400 font-medium transition-colors"

        >

          シーズン管理 →

        </Link>

      </p>



      <div className="card px-4 py-4 mb-6 space-y-4">

        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">

          {editingId ? 'お知らせを編集' : '新規お知らせ'}

        </h2>



        <div>

          <p className="label mb-2">種別</p>

          <div className="flex flex-wrap gap-2">

            {ANNOUNCEMENT_CATEGORIES.map((cat) => {

              const selected = form.category === cat.id

              return (

                <button

                  key={cat.id}

                  type="button"

                  onClick={() => setForm((f) => ({ ...f, category: cat.id }))}

                  className={`text-left rounded-xl border px-3 py-2 transition-colors min-w-[7rem]

                    ${

                      selected

                        ? 'border-gold-500/50 bg-gold-500/10'

                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'

                    }`}

                >

                  <span className="block text-sm font-semibold text-white">

                    {cat.label}

                  </span>

                  <span className="block text-[10px] text-white/40 mt-0.5 leading-snug">

                    {cat.description}

                  </span>

                </button>

              )

            })}

          </div>

        </div>



        {templatesForCategory.length > 0 && (

          <div>

            <p className="label mb-2">テンプレート</p>

            <div className="flex flex-wrap gap-2">

              {templatesForCategory.map((tpl) => (

                <button

                  key={tpl.id}

                  type="button"

                  onClick={() => applyTemplate(tpl)}

                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10

                    bg-white/[0.04] text-white/70 hover:text-gold-300/90

                    hover:border-white/20 transition-colors"

                >

                  {tpl.name}

                </button>

              ))}

            </div>

          </div>

        )}



        <LimitedTextField

          label="タイトル"

          value={form.title}

          maxLength={ANNOUNCEMENT_LIMITS.title}

          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}

        />



        <div>

          <label className="label">本文</label>

          <textarea

            className="input min-h-[120px] resize-y"

            value={form.body}

            maxLength={ANNOUNCEMENT_LIMITS.body}

            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}

          />

          <p className="text-white/30 text-xs mt-1">

            {form.body.length}/{ANNOUNCEMENT_LIMITS.body}文字

          </p>

        </div>



        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">

          <input

            type="checkbox"

            checked={form.isPinned}

            onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}

            className="rounded border-white/20"

          />

          ピン留め（一覧の先頭に表示）

        </label>






        <div className="flex gap-2">

          <button

            type="button"

            className="btn-primary flex-1"

            disabled={submitting}

            onClick={handleSubmit}

          >

            {submitting ? '保存中...' : editingId ? '更新' : '投稿'}

          </button>

          {editingId && (

            <button type="button" className="btn-secondary" onClick={cancelEdit}>

              キャンセル

            </button>

          )}

        </div>

      </div>



      <div className="space-y-2">

        {announcements.length === 0 ? (

          <div className="card py-8 text-center">

            <p className="text-white/30 text-sm">お知らせはまだありません</p>

          </div>

        ) : (

          announcements.map((item) => (

            <div key={item.id} className="card px-4 py-3">

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2 mb-1">

                    <AnnouncementCategoryBadge category={item.category} />

                    {item.isPinned && (

                      <span className="text-gold-400/80 text-xs">📌 ピン留め</span>

                    )}

                  </div>

                  <p className="text-white font-semibold">{item.title}</p>

                  {item.body && (

                    <p className="text-white/50 text-sm mt-1 line-clamp-2">{item.body}</p>

                  )}

                  <p className="text-white/30 text-xs mt-2">

                    {formatTimestamp(item.createdAt)}

                  </p>

                </div>

                <div className="flex flex-col gap-1 shrink-0">

                  <button

                    type="button"

                    className="text-gold-400/80 text-xs hover:text-gold-300"

                    onClick={() => startEdit(item)}

                  >

                    編集

                  </button>

                  <button

                    type="button"

                    className="text-red-300/80 text-xs hover:text-red-200"

                    onClick={() => handleDelete(item.id)}

                  >

                    削除

                  </button>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

      <StickyFeedback
        success={message}
        error={error}
        onDismissSuccess={() => setMessage('')}
        onDismissError={() => setError('')}
      />

    </Layout>

  )

}

