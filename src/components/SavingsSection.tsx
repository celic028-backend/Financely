import { useState } from 'react'
import {
  PiggyBank,
  Check,
  Plus,
  ArrowDownToLine,
  Percent,
  Coins,
  Target,
  History,
  TriangleAlert,
} from 'lucide-react'
import { useSavingsGoal, useSavingsEntries, useMoney } from '../hooks/useData'
import { setSavingsGoal, addToSavings, withdrawFromSavings } from '../lib/repo'
import { formatNumber, formatRsd, formatDayRelative, formatDayLong, currencySymbol } from '../lib/format'
import { hapticIfOn } from '../lib/haptics'
import { t } from '../lib/i18n'
import type { SavingsEntry, SavingsMode } from '../lib/types'

type Panel = 'none' | 'goal' | 'add' | 'withdraw'

export function SavingsSection() {
  const goal = useSavingsGoal()
  const money = useMoney()
  const entries = useSavingsEntries()
  const [panel, setPanel] = useState<Panel>('none')

  const savedTotal = goal?.currentSaved ?? 0
  const hasRule =
    !!goal && ((goal.mode === 'percent' && goal.rate > 0) || (goal.mode === 'fixed' && goal.fixedAmount > 0))
  const target = money?.targetSaveThisMonth ?? 0
  const savedThisMonth = money?.savedThisMonth ?? 0
  const monthPct = target > 0 ? Math.min((savedThisMonth / target) * 100, 100) : 0

  return (
    <div className="card mb-5 p-4">
      {/* Ušteđeno */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-income-soft)] text-[var(--color-income)]">
          <PiggyBank className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[13px] text-[var(--color-ink-muted)]">{t('savings.inSavings')}</p>
          <p className="tnum text-[22px] font-bold">{formatRsd(savedTotal)}</p>
        </div>
      </div>

      {/* Pravilo automatskog odvajanja */}
      <button
        type="button"
        onClick={() => setPanel(panel === 'goal' ? 'none' : 'goal')}
        className="mt-4 flex w-full items-center gap-2 rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5 text-left active:scale-[0.99]"
      >
        {goal?.mode === 'fixed' ? (
          <Coins className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />
        ) : (
          <Percent className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />
        )}
        <span className="flex-1 text-[13px] font-medium">
          {hasRule ? (
            goal!.mode === 'percent' ? (
              <>{t('savings.autoPercent')} <b>{Math.round(goal!.rate * 100)}%</b> {t('savings.ofEveryIncome')}</>
            ) : (
              <>{t('savings.autoFixed')} <b>{formatRsd(goal!.fixedAmount)}</b> {t('savings.monthly')}</>
            )
          ) : (
            t('savings.setGoalHint')
          )}
        </span>
        <span className="text-[12px] font-semibold text-[var(--color-brand)]">
          {hasRule ? t('savings.edit') : t('savings.set')}
        </span>
      </button>

      {panel === 'goal' && (
        <GoalEditor
          initialMode={goal?.mode ?? 'percent'}
          initialPercent={goal?.rate ? Math.round(goal.rate * 100) : 20}
          initialFixed={goal?.fixedAmount ?? 0}
          initialTarget={goal?.targetAmount ?? 0}
          initialDate={goal?.targetDate ?? ''}
          onDone={() => setPanel('none')}
        />
      )}

      {/* Mesečni napredak ka cilju */}
      {hasRule && target > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-[var(--color-ink-muted)]">{t('savings.savedThisMonth')}</span>
            <span className="tnum font-semibold">
              {formatNumber(savedThisMonth)} / {formatNumber(target)} {currencySymbol()}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--color-income)] transition-all"
              style={{ width: `${monthPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Dugoročni cilj (opciono) */}
      {goal?.targetAmount ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2.5">
          <Target className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <span className="flex-1 text-[13px]">
            {t('savings.longTermGoal')}:{' '}
            <span className="font-semibold">{formatRsd(goal.targetAmount)}</span>
            {goal.targetDate ? ` ${t('savings.by')} ${formatDayLong(goal.targetDate)}` : ''}
          </span>
          <span className="tnum text-[12px] font-semibold text-[var(--color-brand)]">
            {Math.round(Math.min((savedTotal / goal.targetAmount) * 100, 100))}%
          </span>
        </div>
      ) : null}

      {/* Akcije */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setPanel(panel === 'add' ? 'none' : 'add')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-income-soft)] py-2.5 text-[14px] font-semibold text-[var(--color-income)] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> {t('savings.addToSavings')}
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === 'withdraw' ? 'none' : 'withdraw')}
          disabled={savedTotal <= 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-line)] py-2.5 text-[14px] font-semibold text-[var(--color-ink)] active:scale-[0.98] disabled:opacity-40"
        >
          <ArrowDownToLine className="h-4 w-4" /> {t('savings.withdraw')}
        </button>
      </div>

      {panel === 'add' && (
        <AmountForm
          label={t('savings.addLabel')}
          hint={money ? `${t('savings.addHintPrefix')}: ${formatRsd(money.availableToSpend)}` : undefined}
          cta={t('savings.addCta')}
          tone="income"
          max={money ? Math.max(0, money.availableToSpend) : 0}
          onSubmit={async (amt) => {
            const saved = await addToSavings(amt, 'manual')
            if (saved <= 0) return
            hapticIfOn([10, 30, 10])
            setPanel('none')
          }}
        />
      )}

      {panel === 'withdraw' && (
        <AmountForm
          label={t('savings.withdrawLabel')}
          hint={`${t('savings.withdrawHintPrefix')}: ${formatRsd(savedTotal)}`}
          warning={t('savings.withdrawWarning')}
          cta={t('savings.withdrawCta')}
          tone="expense"
          max={savedTotal}
          onSubmit={async (amt) => {
            await withdrawFromSavings(amt)
            hapticIfOn(20)
            setPanel('none')
          }}
        />
      )}

      {/* Istorija */}
      {entries && entries.length > 0 && <EntryHistory entries={entries} />}
    </div>
  )
}

function GoalEditor({
  initialMode,
  initialPercent,
  initialFixed,
  initialTarget,
  initialDate,
  onDone,
}: {
  initialMode: SavingsMode
  initialPercent: number
  initialFixed: number
  initialTarget: number
  initialDate: string
  onDone: () => void
}) {
  const [mode, setMode] = useState<SavingsMode>(initialMode)
  const [percent, setPercent] = useState(String(initialPercent))
  const [fixed, setFixed] = useState(initialFixed ? String(initialFixed) : '')
  const [target, setTarget] = useState(initialTarget ? String(initialTarget) : '')
  const [date, setDate] = useState(initialDate)

  async function save() {
    const value =
      mode === 'percent'
        ? Math.min(Math.max(parseInt(percent || '0', 10), 0), 100) / 100
        : parseInt(fixed || '0', 10)
    await setSavingsGoal(mode, value, parseInt(target || '0', 10), date || null)
    hapticIfOn(10)
    onDone()
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-[var(--color-surface-2)] p-3">
      {/* Mode */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface)] p-1">
        {(['percent', 'fixed'] as SavingsMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="rounded-lg py-2 text-[13px] font-semibold transition-all"
            style={{
              background: mode === m ? 'var(--color-brand-soft)' : 'transparent',
              color: mode === m ? 'var(--color-brand)' : 'var(--color-ink-muted)',
            }}
          >
            {m === 'percent' ? t('savings.percentOfIncome') : t('savings.fixedMonthly')}
          </button>
        ))}
      </div>

      {mode === 'percent' ? (
        <div>
          <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
            {t('savings.percentLabel')}
          </label>
          <div className="flex items-center gap-2">
            <input
              value={percent}
              onChange={(e) => setPercent(e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              placeholder="20"
              className="tnum w-24 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[16px] font-bold focus:border-[var(--color-brand)] focus:outline-none"
            />
            <span className="text-[15px] font-semibold text-[var(--color-ink-muted)]">%</span>
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
            {t('savings.fixedLabel')}
          </label>
          <div className="flex items-center gap-2">
            <input
              value={fixed ? formatNumber(parseInt(fixed || '0', 10)) : ''}
              onChange={(e) => setFixed(e.target.value.replace(/\D/g, '').slice(0, 9))}
              inputMode="numeric"
              placeholder="15.000"
              className="tnum w-36 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[16px] font-bold focus:border-[var(--color-brand)] focus:outline-none"
            />
            <span className="text-[13px] text-[var(--color-ink-muted)]">{currencySymbol()}</span>
          </div>
        </div>
      )}

      {/* Dugoročni cilj (opciono) */}
      <div>
        <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
          {t('savings.longTermOptional')}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              value={target ? formatNumber(parseInt(target || '0', 10)) : ''}
              onChange={(e) => setTarget(e.target.value.replace(/\D/g, '').slice(0, 9))}
              inputMode="numeric"
              placeholder="npr. 300.000"
              className="tnum w-36 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[14px] focus:border-[var(--color-brand)] focus:outline-none"
            />
            <span className="text-[13px] text-[var(--color-ink-muted)]">{currencySymbol()}</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[13px]"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          className="brand-bg flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white active:scale-[0.98]"
        >
          <Check className="h-4 w-4" /> {t('savings.saveGoal')}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-[var(--color-surface)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-ink-muted)]"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

function AmountForm({
  label,
  hint,
  warning,
  cta,
  tone,
  max,
  onSubmit,
}: {
  label: string
  hint?: string
  warning?: string
  cta: string
  tone: 'income' | 'expense'
  max?: number
  onSubmit: (amount: number) => Promise<void>
}) {
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  const amt = parseInt(val || '0', 10)
  const tooMuch = max != null && amt > max
  const noFunds = max != null && max <= 0
  const color = tone === 'income' ? 'var(--color-income)' : 'var(--color-expense)'

  async function submit() {
    if (amt <= 0 || busy || tooMuch) return
    setBusy(true)
    await onSubmit(amt)
    setBusy(false)
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-[var(--color-surface-2)] p-3">
      <label className="block text-[13px] font-medium">{label}</label>
      {hint && <p className="text-[12px] text-[var(--color-ink-muted)]">{hint}</p>}
      {noFunds && (
        <div className="flex items-start gap-1.5 rounded-lg bg-[var(--color-expense-soft)] px-2.5 py-1.5">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-expense)]" />
          <p className="text-[11px] font-medium text-[var(--color-expense)]">
            {t('savings.noFunds')}
          </p>
        </div>
      )}
      {warning && (
        <div className="flex items-start gap-1.5 rounded-lg bg-[var(--color-warn-soft)] px-2.5 py-1.5">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warn)]" />
          <p className="text-[11px] font-medium text-[var(--color-warn)]">{warning}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={val ? formatNumber(amt) : ''}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 9))}
          inputMode="numeric"
          autoFocus
          placeholder="0"
          className="tnum w-40 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[18px] font-bold focus:outline-none"
          style={{ borderColor: tooMuch ? 'var(--color-expense)' : undefined }}
        />
        <span className="text-[13px] text-[var(--color-ink-muted)]">{currencySymbol()}</span>
        <button
          type="button"
          onClick={submit}
          disabled={amt <= 0 || busy || tooMuch}
          className="ml-auto rounded-xl px-4 py-2 text-[14px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          style={{ background: color }}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

function sourceLabel(source: SavingsEntry['source']): string {
  const map: Record<SavingsEntry['source'], string> = {
    auto: t('savings.sourceAuto'),
    manual: t('savings.sourceManual'),
    monthly_leftover: t('savings.sourceLeftover'),
    withdraw: t('savings.sourceWithdraw'),
  }
  return map[source]
}

function EntryHistory({ entries }: { entries: SavingsEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = [...entries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const shown = expanded ? sorted : sorted.slice(0, 4)

  return (
    <div className="mt-4 border-t border-[var(--color-line)] pt-3">
      <div className="mb-1 flex items-center gap-1.5 text-[var(--color-ink-muted)]">
        <History className="h-3.5 w-3.5" />
        <span className="text-[12px] font-semibold uppercase tracking-wide">{t('savings.history')}</span>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {shown.map((e) => {
          const positive = e.amount >= 0
          return (
            <div key={e.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-[13px] font-medium">{sourceLabel(e.source)}</p>
                <p className="text-[11px] text-[var(--color-ink-faint)]">
                  {formatDayRelative(e.createdAt.slice(0, 10))}
                </p>
              </div>
              <p
                className="tnum text-[14px] font-semibold"
                style={{ color: positive ? 'var(--color-income)' : 'var(--color-expense)' }}
              >
                {positive ? '+' : '−'}
                {formatNumber(Math.abs(e.amount))} {currencySymbol()}
              </p>
            </div>
          )
        })}
      </div>
      {sorted.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 w-full py-1.5 text-[12px] font-semibold text-[var(--color-brand)]"
        >
          {expanded ? t('savings.showLess') : `${t('savings.showAll')} (${sorted.length})`}
        </button>
      )}
    </div>
  )
}
