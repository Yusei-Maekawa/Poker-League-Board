import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const SUCCESS_AUTO_DISMISS_MS = 6000
const ERROR_AUTO_DISMISS_MS = 10000

export interface StickyFeedbackProps {
  success?: string | null
  error?: string | null
  onDismissSuccess?: () => void
  onDismissError?: () => void
  /** 成功時の自動消去（ms）。0 で無効。既定 6000 */
  successAutoDismissMs?: number
  /** エラー時の自動消去（ms）。0 で無効。既定 10000 */
  errorAutoDismissMs?: number
}

export function StickyFeedback({
  success,
  error,
  onDismissSuccess,
  onDismissError,
  successAutoDismissMs = SUCCESS_AUTO_DISMISS_MS,
  errorAutoDismissMs = ERROR_AUTO_DISMISS_MS,
}: StickyFeedbackProps) {
  const isError = Boolean(error?.trim())
  const text = isError ? error!.trim() : success?.trim()
  const visible = Boolean(text)

  const onDismiss = isError ? onDismissError : onDismissSuccess
  const autoMs = isError ? errorAutoDismissMs : successAutoDismissMs

  useEffect(() => {
    if (!visible || !onDismiss || autoMs <= 0) return
    const timer = window.setTimeout(onDismiss, autoMs)
    return () => window.clearTimeout(timer)
  }, [visible, text, isError, onDismiss, autoMs])

  if (!visible) return null

  const styles = isError
    ? 'bg-red-950/95 border-red-500/50 text-red-50 shadow-[0_8px_32px_rgba(127,29,29,0.45)]'
    : 'bg-emerald-950/95 border-emerald-500/45 text-emerald-50 shadow-[0_8px_32px_rgba(6,78,59,0.4)]'

  const icon = isError ? '!' : '✓'
  const iconBg = isError ? 'bg-red-500/25' : 'bg-emerald-500/25'

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-[70] pointer-events-none px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-live="polite"
    >
      <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto pointer-events-auto animate-slide-up">
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 backdrop-blur-md ${styles}`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconBg}`}
            aria-hidden
          >
            {icon}
          </span>
          <p className="flex-1 text-sm font-medium leading-snug pt-1 min-w-0">
            {text}
          </p>
          {onDismiss && (
            <button
              type="button"
              aria-label="閉じる"
              className="shrink-0 -mr-1 px-2 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none"
              onClick={onDismiss}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
