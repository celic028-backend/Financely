import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { pushSupported, pushPermission, enablePush } from '../lib/push'
import { useAuth } from '../lib/auth'
import { t } from '../lib/i18n'

const DISMISS_KEY = 'financely-push-prompt-dismissed'
const DELAY_MS = 3000

export function NotificationPrompt() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!pushSupported()) return
    if (pushPermission() !== 'default') return
    if (localStorage.getItem(DISMISS_KEY)) return

    const timer = setTimeout(() => setShow(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  async function enable() {
    if (!user) return
    setBusy(true)
    const result = await enablePush(user.id)
    setBusy(false)
    if (result.ok || result.reason === 'denied') {
      dismiss()
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="card mt-4 flex items-start gap-3 p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{t('pushPrompt.title')}</p>
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
              {t('pushPrompt.desc')}
            </p>
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="brand-bg mt-2 rounded-full px-4 py-1.5 text-[12px] font-semibold text-white active:scale-95 disabled:opacity-60"
            >
              {busy ? t('pushPrompt.enabling') : t('pushPrompt.enable')}
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Zatvori"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-faint)] active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
