import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share } from 'lucide-react'

let deferredPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
})

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as Record<string, unknown>).standalone === true
  )
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

const DISMISS_KEY = 'financely-install-dismissed'

export function InstallHint() {
  const [show, setShow] = useState(false)
  const [ios] = useState(isIOS)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return

    if (deferredPrompt || ios) {
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [ios])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    deferredPrompt = null
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
            {ios ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">Instaliraj na telefon</p>
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
              {ios
                ? 'Klikni Share ⬆ pa „Add to Home Screen" za brzi pristup.'
                : 'Dodaj Financely na početni ekran kao pravu aplikaciju.'}
            </p>
            {!ios && (
              <button
                type="button"
                onClick={install}
                className="brand-bg mt-2 rounded-full px-4 py-1.5 text-[12px] font-semibold text-white active:scale-95"
              >
                Instaliraj
              </button>
            )}
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
