import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { adjustBalanceTo } from '../lib/repo'
import { formatNumber, formatRsd, currencySymbol } from '../lib/format'
import { hapticIfOn } from '../lib/haptics'
import { t } from '../lib/i18n'

interface Props {
  currentBalance: number
  open: boolean
  onClose: () => void
}

export function BalanceSheet({ currentBalance, open, onClose }: Props) {
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  function handleOpen() {
    setInput(String(Math.max(0, currentBalance)))
  }

  async function save() {
    if (saving) return
    setSaving(true)
    const val = parseInt(input || '0', 10)
    await adjustBalanceTo(val)
    hapticIfOn([10, 30, 10])
    setSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            onAnimationStart={() => handleOpen()}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-[var(--color-surface)] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('balance.title')}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-1 text-[13px] text-[var(--color-ink-muted)]">
              {t('balance.current')}
            </p>
            <p className="tnum mb-4 text-[22px] font-bold">{formatRsd(currentBalance)}</p>

            <label className="mb-2 block text-[13px] font-medium text-[var(--color-ink-muted)]">
              {t('balance.howMuch')}
            </label>
            <div className="mb-6 flex items-center gap-2">
              <input
                value={input ? formatNumber(parseInt(input || '0', 10)) : ''}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
                inputMode="numeric"
                autoFocus
                placeholder="0"
                className="tnum w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[20px] font-bold focus:border-[var(--color-brand)] focus:outline-none"
              />
              <span className="text-[14px] text-[var(--color-ink-muted)]">{currencySymbol()}</span>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="brand-bg flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-40"
            >
              <Check className="h-5 w-5" strokeWidth={2.5} />
              {t('balance.adjust')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
