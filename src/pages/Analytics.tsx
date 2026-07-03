import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from 'recharts'

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: Array<{ dataKey?: string | number; value?: number; color?: string; payload?: unknown }>
}
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useCategoryMap, useTransactions, useAllCategories } from '../hooks/useData'
import { CategoryIcon } from '../components/CategoryIcon'
import { formatRsd, formatNumber, formatMonthLabel } from '../lib/format'
import { t } from '../lib/i18n'
import {
  PERIODS,
  type Period,
  periodRange,
  inRange,
  sumTotals,
  categoryBreakdown,
  incomeSplit,
  monthlyTrend,
  spentThisMonthByCategory,
} from '../lib/analytics'

export default function Analytics() {
  const txs = useTransactions()
  const catMap = useCategoryMap()
  const allCats = useAllCategories() ?? []
  const [period, setPeriod] = useState<Period>('month')

  const range = useMemo(() => periodRange(period), [period])
  const scoped = useMemo(
    () => (txs ?? []).filter((t) => inRange(t.occurredOn, range)),
    [txs, range],
  )

  const totals = useMemo(() => sumTotals(scoped), [scoped])
  const expenseSlices = useMemo(
    () => categoryBreakdown(scoped, catMap, 'expense'),
    [scoped, catMap],
  )
  const split = useMemo(() => incomeSplit(scoped), [scoped])
  const trend = useMemo(() => monthlyTrend(txs ?? [], 6), [txs])
  const spentByCat = useMemo(
    () => spentThisMonthByCategory(txs ?? []),
    [txs],
  )

  const budgeted = allCats.filter(
    (c) => c.type === 'expense' && c.isActive && (c.monthlyBudget ?? 0) > 0,
  )

  return (
    <div className="safe-top">
      <header className="py-4">
        <h1 className="text-xl font-bold">{t('analytics.title')}</h1>
      </header>

      {/* Period */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className="shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              borderColor:
                period === p.key ? 'var(--color-brand)' : 'var(--color-line)',
              background:
                period === p.key ? 'var(--color-brand)' : 'var(--color-surface)',
              color: period === p.key ? '#fff' : 'var(--color-ink)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Prihod vs trošak */}
      <section className="mb-4 grid grid-cols-3 gap-3">
        <SumCard tone="income" icon={<TrendingUp className="h-4 w-4" />} label={t('home.income')} value={totals.income} />
        <SumCard tone="expense" icon={<TrendingDown className="h-4 w-4" />} label={t('home.expense')} value={totals.expense} />
        <SumCard tone="net" icon={<Wallet className="h-4 w-4" />} label={t('nav.home') === 'Početna' ? 'Ostaje' : 'Net'} value={totals.net} />
      </section>

      {/* Gde ide najviše */}
      <section className="card mb-4 p-4">
        <h2 className="mb-1 text-[15px] font-semibold">{t('nav.home') === 'Početna' ? 'Gde ti idu pare' : 'Where your money goes'}</h2>
        {expenseSlices.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[var(--color-ink-muted)]">
            {t('nav.home') === 'Početna' ? 'Nema troškova u ovom periodu.' : 'No expenses in this period.'}
          </p>
        ) : (
          <>
            <div className="relative mx-auto h-48 w-48">
              <PieChart width={192} height={192}>
                <Pie
                  data={expenseSlices}
                  dataKey="total"
                  nameKey="categoryId"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {expenseSlices.map((s) => (
                    <Cell key={s.categoryId} fill={s.category?.color ?? '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-[var(--color-ink-muted)]">Ukupno</span>
                <span className="tnum text-[18px] font-bold">{formatNumber(totals.expense)}</span>
                <span className="text-[11px] text-[var(--color-ink-faint)]">din</span>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {expenseSlices.slice(0, 6).map((s) => (
                <div key={s.categoryId} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${s.category?.color ?? '#94A3B8'}1A`, color: s.category?.color ?? '#94A3B8' }}
                  >
                    <CategoryIcon name={s.category?.icon ?? 'CircleEllipsis'} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{s.category?.name ?? 'Ostalo'}</span>
                      <span className="tnum shrink-0 text-[13px] font-semibold">{formatNumber(s.total)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.pct}%`, background: s.category?.color ?? '#94A3B8' }}
                      />
                    </div>
                  </div>
                  <span className="tnum w-9 shrink-0 text-right text-[12px] text-[var(--color-ink-muted)]">
                    {Math.round(s.pct)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Podela prihoda */}
      {(split.fixed > 0 || split.extra > 0) && (
        <section className="card mb-4 p-4">
          <h2 className="mb-3 text-[15px] font-semibold">{t('nav.home') === 'Početna' ? 'Odakle ti prihodi' : 'Income sources'}</h2>
          <SplitBar fixed={split.fixed} extra={split.extra} />
        </section>
      )}

      {/* Trend */}
      <section className="card mb-4 p-4">
        <h2 className="mb-3 text-[15px] font-semibold">{t('nav.home') === 'Početna' ? 'Trend (6 meseci)' : 'Trend (6 months)'}</h2>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} barGap={2} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="key"
                tickFormatter={(k: string) => shortMonth(k)}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
              <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[12px]">
          <Legend color="#22C55E" label={t('home.income')} />
          <Legend color="#F43F5E" label={t('home.expense')} />
        </div>
      </section>

      {/* Budžet progress (tekući mesec) */}
      {budgeted.length > 0 && (
        <section className="card mb-4 p-4">
          <h2 className="mb-3 text-[15px] font-semibold">{t('nav.home') === 'Početna' ? 'Budžet ovog meseca' : 'This month\'s budget'}</h2>
          <div className="space-y-3">
            {budgeted.map((c) => {
              const spent = spentByCat.get(c.id) ?? 0
              const budget = c.monthlyBudget ?? 0
              const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
              const over = spent > budget
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="tnum" style={{ color: over ? 'var(--color-expense)' : 'var(--color-ink-muted)' }}>
                      {formatNumber(spent)} / {formatNumber(budget)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: over ? 'var(--color-expense)' : c.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function SumCard({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'income' | 'expense' | 'net'
  icon: React.ReactNode
  label: string
  value: number
}) {
  const color =
    tone === 'income'
      ? 'var(--color-income)'
      : tone === 'expense'
        ? 'var(--color-expense)'
        : value >= 0
          ? 'var(--color-brand)'
          : 'var(--color-expense)'
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[11px] font-medium text-[var(--color-ink-muted)]">{label}</span>
      </div>
      <p className="tnum mt-1.5 text-[15px] font-bold leading-tight" style={{ color }}>
        {formatNumber(value)}
      </p>
    </div>
  )
}

function SplitBar({ fixed, extra }: { fixed: number; extra: number }) {
  const total = fixed + extra || 1
  const fixedPct = (fixed / total) * 100
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div style={{ width: `${fixedPct}%`, background: 'var(--color-brand)' }} />
        <div style={{ width: `${100 - fixedPct}%`, background: 'var(--color-brand-2)' }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--color-surface-2)] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-brand)' }} />
            <span className="text-[12px] text-[var(--color-ink-muted)]">{t('tx.regularIncome')}</span>
          </div>
          <p className="tnum mt-1 text-[15px] font-bold">{formatRsd(fixed)}</p>
        </div>
        <div className="rounded-xl bg-[var(--color-surface-2)] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-brand-2)' }} />
            <span className="text-[12px] text-[var(--color-ink-muted)]">{t('tx.extraIncome')}</span>
          </div>
          <p className="tnum mt-1 text-[15px] font-bold">{formatRsd(extra)}</p>
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function shortMonth(k: string): string {
  const [, m] = k.split('-').map(Number)
  return ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'][m - 1]
}

function DonutTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const slice = p.payload as { category?: { name: string }; total: number; pct: number }
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] shadow-lg">
      <p className="font-semibold">{slice.category?.name ?? 'Ostalo'}</p>
      <p className="tnum text-[var(--color-ink-muted)]">
        {formatRsd(slice.total)} · {Math.round(slice.pct)}%
      </p>
    </div>
  )
}

function TrendTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] shadow-lg">
      <p className="mb-1 font-semibold">{formatMonthLabel(String(label))}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="tnum" style={{ color: p.color }}>
          {p.dataKey === 'income' ? t('home.income') : t('home.expense')}: {formatNumber(Number(p.value))}
        </p>
      ))}
    </div>
  )
}
