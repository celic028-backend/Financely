import { CategoryIcon } from './CategoryIcon'
import { formatSigned, formatDayRelative } from '../lib/format'
import type { Category, Transaction } from '../lib/types'

export function TransactionRow({
  tx,
  category,
  onClick,
  showDate = true,
}: {
  tx: Transaction
  category?: Category
  onClick?: () => void
  showDate?: boolean
}) {
  const isIncome = tx.type === 'income'
  const color = category?.color ?? '#64748B'
  const subtitle =
    tx.description?.trim() ||
    (isIncome
      ? tx.incomeKind === 'extra'
        ? 'Zarada sa strane'
        : 'Redovna primanja'
      : (category?.name ?? 'Trošak'))

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors active:bg-[var(--color-surface-2)]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `${color}1A`, color }}
      >
        <CategoryIcon
          name={category?.icon ?? 'CircleEllipsis'}
          className="h-5 w-5"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-[var(--color-ink)]">
          {category?.name ?? 'Nepoznato'}
        </span>
        <span className="block truncate text-[13px] text-[var(--color-ink-muted)]">
          {showDate ? `${formatDayRelative(tx.occurredOn)} · ` : ''}
          {subtitle}
        </span>
      </span>

      <span
        className="tnum shrink-0 text-[15px] font-semibold"
        style={{
          color: isIncome ? 'var(--color-income)' : 'var(--color-ink)',
        }}
      >
        {formatSigned(tx.amount, tx.type)}
      </span>
    </button>
  )
}
