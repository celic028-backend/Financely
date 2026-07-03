import { Link } from 'react-router-dom'
import { PiggyBank, ChevronRight } from 'lucide-react'
import { useSavingsGoal } from '../hooks/useData'
import { formatRsd, formatNumber } from '../lib/format'

export function SavingsCard() {
  const goal = useSavingsGoal()

  // Nema ni cilja ni ušteđevine → poziv da postavi
  if (!goal || (goal.currentSaved === 0 && goal.targetAmount === 0)) {
    return (
      <Link
        to="/stednja"
        className="card flex items-center gap-3 p-4 active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <PiggyBank className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[14px] font-semibold">Postavi cilj štednje</p>
          <p className="text-[12px] text-[var(--color-ink-muted)]">
            Odredi koliko želiš da uštediš pa prati napredak
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-[var(--color-ink-faint)]" />
      </Link>
    )
  }

  const hasTarget = goal.targetAmount > 0
  const pct = hasTarget
    ? Math.min((goal.currentSaved / goal.targetAmount) * 100, 100)
    : 0

  return (
    <Link to="/stednja" className="card block p-4 active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-income-soft)] text-[var(--color-income)]">
          <PiggyBank className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[13px] text-[var(--color-ink-muted)]">Ušteđeno</p>
          <p className="tnum text-[20px] font-bold">{formatRsd(goal.currentSaved)}</p>
        </div>
        {hasTarget && (
          <div className="text-right">
            <p className="tnum text-[13px] font-semibold text-[var(--color-brand)]">
              {Math.round(pct)}%
            </p>
            <p className="text-[11px] text-[var(--color-ink-faint)]">
              od {formatNumber(goal.targetAmount)}
            </p>
          </div>
        )}
      </div>
      {hasTarget && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="brand-bg h-full rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </Link>
  )
}
