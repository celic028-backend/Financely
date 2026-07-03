import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Plus, AlertTriangle, CalendarClock, PieChart, ReceiptText } from 'lucide-react'
import { useCategoryMap, useMoney, useProfile, useRecurring, useTotals, useTransactions } from '../hooks/useData'
import { TransactionRow } from '../components/TransactionRow'
import { SavingsCard } from '../components/SavingsCard'
import { HomeReminders } from '../components/HomeReminders'
import { LeftoverPrompt } from '../components/LeftoverPrompt'
import { InstallHint } from '../components/InstallHint'
import { NotificationPrompt } from '../components/NotificationPrompt'
import { BalanceSheet } from '../components/BalanceSheet'
import { StreakBadge } from '../components/StreakBadge'
import { formatRsd, formatNumber, formatMonthLabel, currencySymbol, today, monthKey, parseDay } from '../lib/format'
import { nextDueOnOrAfter } from '../lib/recurring'
import { t } from '../lib/i18n'

export default function Home() {
  const navigate = useNavigate()
  const profile = useProfile()
  const totals = useTotals()
  const money = useMoney()
  const txs = useTransactions()
  const catMap = useCategoryMap()
  const recurring = useRecurring()
  const [balanceOpen, setBalanceOpen] = useState(false)

  const streak = profile?.settings.streakCount ?? 0
  const recent = (txs ?? []).slice(0, 6)
  const thisMonth = formatMonthLabel(monthKey(today()))
  const nextPayment = getNextPayment(recurring)

  if (!profile) return <HomeSkeleton />

  return (
    <div className="safe-top">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{greeting()}</p>
          <h1 className="text-xl font-bold brand-gradient">
            {profile.settings.displayName || 'Financely'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge streak={streak} lastEntryDate={profile.settings.lastEntryDate} />
          <Link
            to="/analitika"
            aria-label="Analitika"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
          >
            <PieChart className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to="/istorija"
            aria-label="Istorija"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
          >
            <ReceiptText className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      {/* Hero: dostupno za trošenje */}
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="brand-bg relative cursor-pointer overflow-hidden rounded-[var(--radius-2xl)] p-5 text-white shadow-[var(--shadow-float)] active:scale-[0.98]"
        onClick={() => setBalanceOpen(true)}
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-[13px] font-medium text-white/80">{t('home.available')}</p>
        <p className="tnum mt-1 text-[38px] font-bold leading-none">
          {money ? formatRsd(money.availableToSpend) : '—'}
        </p>
      </motion.section>

      <BalanceSheet
        currentBalance={money?.balance ?? 0}
        open={balanceOpen}
        onClose={() => setBalanceOpen(false)}
      />

      {/* Hint: sledeća uplata + onTrack warning */}
      {(nextPayment || (money && !money.onTrack && money.targetSaveThisMonth > 0)) && (
        <div className="mt-2 space-y-1.5">
          {nextPayment && (
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-income-soft)] px-3.5 py-2">
              <CalendarClock className="h-4 w-4 text-[var(--color-income)]" />
              <p className="text-[12px] font-medium text-[var(--color-income)]">
                Sledeća uplata: {nextPayment.name} · za {nextPayment.days} {nextPayment.days === 1 ? 'dan' : 'dana'}
              </p>
            </div>
          )}
          {money && !money.onTrack && money.targetSaveThisMonth > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-warn-soft)] px-3.5 py-2">
              <AlertTriangle className="h-4 w-4 text-[var(--color-warn)]" />
              <p className="text-[12px] font-medium text-[var(--color-warn)]">
                {t('home.overspend')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Višak prošlog meseca */}
      <LeftoverPrompt />

      {/* Mesečni prihod / trošak */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          tone="income"
          icon={<ArrowUpRight className="h-4 w-4" />}
          label={`${t('home.income')} · ${thisMonth}`}
          value={totals ? formatNumber(totals.monthIncome) : '—'}
        />
        <MiniStat
          tone="expense"
          icon={<ArrowDownRight className="h-4 w-4" />}
          label={`${t('home.expense')} · ${thisMonth}`}
          value={totals ? formatNumber(totals.monthExpense) : '—'}
        />
      </section>

      {/* Podsetnici (ponavljajuća primanja/računi) */}
      <HomeReminders />

      {/* Štednja */}
      <div className="mt-4">
        <SavingsCard />
      </div>

      {/* Push notification prompt */}
      <NotificationPrompt />

      {/* PWA install hint */}
      <InstallHint />

      {/* Poslednje transakcije */}
      <section className="mt-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{t('home.recent')}</h2>
          {recent.length > 0 && (
            <Link to="/istorija" className="text-[13px] font-medium text-[var(--color-brand)]">
              {t('home.all')}
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
        {value} <span className="text-[13px] font-medium">{currencySymbol()}</span>
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
        <p className="font-semibold">{t('home.emptyTitle')}</p>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          {t('home.emptyDesc')}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="brand-bg mt-1 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white active:scale-95"
      >
        {t('home.emptyAction')}
      </button>
    </div>
  )
}

function HomeSkeleton() {
  const shimmer = 'animate-pulse rounded-xl bg-[var(--color-surface-2)]'
  return (
    <div className="safe-top">
      <header className="flex items-center justify-between py-4">
        <div>
          <div className={`${shimmer} mb-1.5 h-4 w-20`} />
          <div className={`${shimmer} h-6 w-28`} />
        </div>
        <div className={`${shimmer} h-9 w-9 rounded-full`} />
      </header>
      <div className={`${shimmer} h-[160px] !rounded-[var(--radius-2xl)]`} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className={`${shimmer} h-[88px]`} />
        <div className={`${shimmer} h-[88px]`} />
      </div>
      <div className={`${shimmer} mt-5 h-[200px]`} />
    </div>
  )
}

function getNextPayment(items: ReturnType<typeof useRecurring>): { name: string; days: number } | null {
  if (!items || items.length === 0) return null
  const t = today()
  let best: { name: string; days: number } | null = null
  for (const item of items) {
    if (!item.active || item.kind !== 'income') continue
    const due = nextDueOnOrAfter(item.schedule, t)
    const days = Math.round((parseDay(due).getTime() - parseDay(t).getTime()) / 86400000)
    if (days < 0) continue
    if (!best || days < best.days) best = { name: item.name, days }
  }
  return best
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return t('greeting.evening')
  if (h < 12) return t('greeting.morning')
  if (h < 18) return t('greeting.day')
  return t('greeting.evening')
}
