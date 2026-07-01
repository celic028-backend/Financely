import { useState } from 'react'
import { PiggyBank, Sparkles, Check } from 'lucide-react'
import { useSavingsGoal, useTransactions } from '../hooks/useData'
import { setSavingsGoal } from '../lib/repo'
import { sumTotals } from '../lib/analytics'
import { formatNumber, formatRsd } from '../lib/format'

export function SavingsSection() {
  const goal = useSavingsGoal()
  const txs = useTransactions()
  const [target, setTarget] = useState('')
  const [date, setDate] = useState('')
  const [editing, setEditing] = useState(false)

  function start() {
    setTarget(goal?.targetAmount ? String(goal.targetAmount) : '')
    setDate(goal?.targetDate ?? '')
    setEditing(true)
  }

  async function save() {
    await setSavingsGoal(parseInt(target || '0', 10), date || null)
    setEditing(false)
  }

  /** AI predlog: ~15% od prosečnih mesečnih prihoda × 6 meseci. */
  function suggest() {
    const totals = sumTotals(txs ?? [])
    const monthlyIncome = totals.income / Math.max(1, monthsSpan(txs))
    const suggestion = Math.round((monthlyIncome * 0.15 * 6) / 1000) * 1000
    setTarget(String(Math.max(suggestion, 5000)))
    setEditing(true)
  }

  return (
    <div className="card mb-5 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-income-soft)] text-[var(--color-income)]">
          <PiggyBank className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[13px] text-[var(--color-ink-muted)]">Ušteđeno do sada</p>
          <p className="tnum text-[20px] font-bold">{formatRsd(goal?.currentSaved ?? 0)}</p>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
              Cilj (koliko želiš da uštediš)
            </label>
            <div className="flex items-center gap-2">
              <input
                value={target ? formatNumber(parseInt(target || '0', 10)) : ''}
                onChange={(e) => setTarget(e.target.value.replace(/\D/g, '').slice(0, 9))}
                inputMode="numeric"
                placeholder="0"
                className="tnum w-40 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-[16px] font-bold focus:border-[var(--color-brand)] focus:outline-none"
              />
              <span className="text-[13px] text-[var(--color-ink-muted)]">din</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
              Rok (opciono)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="brand-bg flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white active:scale-[0.98]"
            >
              <Check className="h-4 w-4" /> Sačuvaj cilj
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl bg-[var(--color-surface-2)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-ink-muted)]"
            >
              Otkaži
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {goal?.targetAmount ? (
            <p className="mb-3 text-[13px] text-[var(--color-ink-muted)]">
              Cilj: <span className="font-semibold text-[var(--color-ink)]">{formatRsd(goal.targetAmount)}</span>
              {goal.targetDate ? ` do ${goal.targetDate}` : ''}
            </p>
          ) : (
            <p className="mb-3 text-[13px] text-[var(--color-ink-muted)]">
              Još nemaš cilj. Postavi ga sam ili neka AI predloži na osnovu tvojih primanja.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={start}
              className="flex-1 rounded-xl border border-[var(--color-line)] bg-white py-2.5 text-[14px] font-semibold text-[var(--color-brand)] active:scale-[0.98]"
            >
              {goal?.targetAmount ? 'Izmeni cilj' : 'Postavi cilj'}
            </button>
            <button
              type="button"
              onClick={suggest}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-soft)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-brand)] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" /> AI predlog
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function monthsSpan(txs?: { occurredOn: string }[]): number {
  if (!txs || txs.length === 0) return 1
  const keys = new Set(txs.map((t) => t.occurredOn.slice(0, 7)))
  return keys.size
}
