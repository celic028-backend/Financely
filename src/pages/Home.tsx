import { Link, useNavigate } from 'react-router-dom'
import { Settings2, Flame, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react'
import { useCategoryMap, useProfile, useTotals, useTransactions } from '../hooks/useData'
import { TransactionRow } from '../components/TransactionRow'
import { SavingsCard } from '../components/SavingsCard'
import { HomeReminders } from '../components/HomeReminders'
import { LeftoverPrompt } from '../components/LeftoverPrompt'
import { formatRsd, formatNumber, formatMonthLabel, today, monthKey } from '../lib/format'

export default function Home() {
  const navigate = useNavigate()
  const profile = useProfile()
  const totals = useTotals()
  const txs = useTransactions()
  const catMap = useCategoryMap()

  const streak = profile?.settings.streakCount ?? 0
  const recent = (txs ?? []).slice(0, 6)
  const thisMonth = formatMonthLabel(monthKey(today()))

  return (
    <div className="safe-top">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{greeting()}</p>
          <h1 className="text-xl font-bold brand-gradient">Financely</h1>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--color-warn-soft)] px-2.5 py-1 text-[13px] font-semibold text-[var(--color-warn)]">
              <Flame className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
          <Link
            to="/podesavanja"
            aria-label="Podešavanja"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
          >
            <Settings2 className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      {/* Hero: ukupno stanje */}
      <section className="brand-bg relative overflow-hidden rounded-[var(--radius-2xl)] p-5 text-white shadow-[var(--shadow-float)]">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-[13px] font-medium text-white/80">Ukupno stanje</p>
        <p className="tnum mt-1 text-[38px] font-bold leading-none">
          {totals ? formatRsd(totals.balance) : '—'}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <MonthPill
            label="Ovog meseca ostalo"
            value={totals ? formatRsd(totals.monthLeftover) : '—'}
          />
        </div>
      </section>

      {/* Višak prošlog meseca */}
      <LeftoverPrompt />

      {/* Mesečni prihod / trošak */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          tone="income"
          icon={<ArrowUpRight className="h-4 w-4" />}
          label={`Prihod · ${thisMonth}`}
          value={totals ? formatNumber(totals.monthIncome) : '—'}
        />
        <MiniStat
          tone="expense"
          icon={<ArrowDownRight className="h-4 w-4" />}
          label={`Trošak · ${thisMonth}`}
          value={totals ? formatNumber(totals.monthExpense) : '—'}
        />
      </section>

      {/* Podsetnici (ponavljajuća primanja/računi) */}
      <HomeReminders />

      {/* Štednja */}
      <div className="mt-4">
        <SavingsCard />
      </div>

      {/* Poslednje transakcije */}
      <section className="mt-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Poslednje</h2>
          {recent.length > 0 && (
            <Link to="/istorija" className="text-[13px] font-medium text-[var(--color-brand)]">
              Sve
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState onAdd={() => navigate('/dodaj')} />
        ) : (
          <div className="card divide-y divide-[var(--color-line)] px-4">
            {recent.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                category={catMap.get(tx.categoryId)}
                onClick={() => navigate(`/dodaj?edit=${tx.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MonthPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
      <p className="text-[11px] font-medium text-white/75">{label}</p>
      <p className="tnum text-[17px] font-bold leading-tight">{value}</p>
    </div>
  )
}

function MiniStat({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'income' | 'expense'
  icon: React.ReactNode
  label: string
  value: string
}) {
  const color = tone === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
  const soft = tone === 'income' ? 'var(--color-income-soft)' : 'var(--color-expense-soft)'
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: soft, color }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium text-[var(--color-ink-muted)]">
          {label}
        </span>
      </div>
      <p className="tnum mt-2 text-[20px] font-bold" style={{ color }}>
        {value} <span className="text-[13px] font-medium">din</span>
      </p>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-8 text-center">
      <div className="brand-bg flex h-12 w-12 items-center justify-center rounded-2xl text-white">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-semibold">Počni da pratiš svoje pare</p>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Unesi prvi trošak ili prihod — za par sekundi ćeš videti gde ti idu pare.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="brand-bg mt-1 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white active:scale-95"
      >
        Dodaj prvi unos
      </button>
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Dobro veče'
  if (h < 12) return 'Dobro jutro'
  if (h < 18) return 'Dobar dan'
  return 'Dobro veče'
}
