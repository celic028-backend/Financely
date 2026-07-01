import { Sparkles } from 'lucide-react'
import { useProfile, useTransactions } from '../hooks/useData'
import { addToSavings, markLeftoverHandled, monthNet, previousMonthKey } from '../lib/repo'
import { monthKey, today, formatMonthLabel, formatRsd } from '../lib/format'
import { haptic } from '../lib/haptics'

export function LeftoverPrompt() {
  const profile = useProfile()
  const txs = useTransactions()
  if (!profile || !txs) return null

  const prevMk = previousMonthKey(monthKey(today()))
  const handled = profile.settings.lastLeftoverHandledMonth === prevMk
  if (handled) return null

  const leftover = monthNet(txs, prevMk)
  if (leftover <= 0) return null

  async function bank() {
    await addToSavings(leftover, 'monthly_leftover')
    await markLeftoverHandled(prevMk)
    haptic([10, 30, 10])
  }
  async function skip() {
    await markLeftoverHandled(prevMk)
    haptic(10)
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[var(--radius-2xl)]" style={{ background: 'linear-gradient(130deg, #16a34a, #06b6d4)' }}>
      <div className="p-5 text-white">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-[16px] font-bold leading-snug">
              Bravo! {formatMonthLabel(prevMk)} ti je ostalo {formatRsd(leftover)}
            </p>
            <p className="mt-1 text-[13px] text-white/90">
              Hoćeš da prebacimo taj višak u štednju ili da ga preneseš u ovaj mesec?
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={bank}
            className="flex-1 rounded-xl bg-white py-2.5 text-[14px] font-semibold text-[var(--color-income)] active:scale-[0.98]"
          >
            Prebaci u štednju
          </button>
          <button
            type="button"
            onClick={skip}
            className="rounded-xl bg-white/20 px-4 py-2.5 text-[14px] font-semibold text-white active:scale-[0.98]"
          >
            Prenesi
          </button>
        </div>
      </div>
    </section>
  )
}
