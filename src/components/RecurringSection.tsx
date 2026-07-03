import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useAllCategories, useRecurring } from '../hooks/useData'
import { addRecurring, updateRecurring, deleteRecurring } from '../lib/recurring'
import { CategoryIcon } from './CategoryIcon'
import { formatNumber } from '../lib/format'
import { t } from '../lib/i18n'
import type { RecurringItem, RecurringKind, RecurringSchedule } from '../lib/types'

function scheduleLabel(s: RecurringSchedule): string {
  if (s === 'last_thursday' || s === 'last_day') return 'poslednji dan'
  return `svakog ${s.split(':')[1]}. u mesecu`
}

export function RecurringSection() {
  const items = useRecurring() ?? []
  const cats = useAllCategories() ?? []
  const [editing, setEditing] = useState<RecurringItem | 'new' | null>(null)

  const catMap = new Map(cats.map((c) => [c.id, c]))

  return (
    <div className="card mb-5 px-4 py-2">
      {items.length === 0 && (
        <p className="py-3 text-[13px] text-[var(--color-ink-muted)]">
          {t('recurring.emptyHint')}
        </p>
      )}
      <div className="divide-y divide-[var(--color-line)]">
        {items.map((it) => {
          const cat = catMap.get(it.categoryId)
          const color = cat?.color ?? '#4F46E5'
          return (
            <div key={it.id} className="flex items-center gap-3 py-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}1A`, color }}
              >
                <CategoryIcon name={cat?.icon ?? 'Repeat'} className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{it.name}</p>
                <p className="text-[12px] text-[var(--color-ink-muted)]">
                  {scheduleLabel(it.schedule)} ·{' '}
                  {it.amount ? `${formatNumber(it.amount)} din` : 'promenljiv iznos'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(it)}
                aria-label="Izmeni"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setEditing('new')}
        className="mt-1 flex w-full items-center justify-center gap-2 py-3 text-[14px] font-semibold text-[var(--color-brand)]"
      >
        <Plus className="h-4 w-4" /> {t('recurring.add')}
      </button>

      {editing && (
        <RecurringEditor
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function RecurringEditor({
  initial,
  onClose,
}: {
  initial: RecurringItem | null
  onClose: () => void
}) {
  const cats = useAllCategories() ?? []
  const [kind, setKind] = useState<RecurringKind>(initial?.kind ?? 'bill')
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '')
  const [dayNum, setDayNum] = useState(
    initial && initial.schedule !== 'last_thursday' && initial.schedule !== 'last_day'
      ? initial.schedule.split(':')[1]
      : '1',
  )

  const relevantCats = cats.filter((c) =>
    kind === 'income' ? c.type === 'income' : c.type === 'expense',
  )

  const canSave = name.trim() && categoryId

  async function save() {
    if (!canSave) return
    const schedule: RecurringSchedule = `day:${Math.min(Math.max(parseInt(dayNum || '1', 10), 1), 31)}` as RecurringSchedule
    const cat = cats.find((c) => c.id === categoryId)
    const payload = {
      kind,
      name: name.trim(),
      amount: amount ? parseInt(amount, 10) : null,
      categoryId,
      schedule,
      incomeKind: kind === 'income' ? (cat?.incomeKind ?? 'fixed') : null,
      active: true,
    }
    if (initial) await updateRecurring(initial.id, payload)
    else await addRecurring(payload)
    onClose()
  }

  async function remove() {
    if (initial) await deleteRecurring(initial.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="safe-bottom max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-2xl)] bg-[var(--color-bg)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold">
            {initial ? t('recurring.editTitle') : t('recurring.newTitle')}
          </h3>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Kind */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
          {(['bill', 'income'] as RecurringKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                setCategoryId('')
              }}
              className="rounded-xl py-2 text-[13px] font-semibold transition-all"
              style={{
                background: kind === k ? 'var(--color-surface)' : 'transparent',
                boxShadow: kind === k ? 'var(--shadow-card)' : 'none',
              }}
            >
              {k === 'bill' ? t('recurring.bill') : t('recurring.income')}
            </button>
          ))}
        </div>

        {/* Naziv */}
        <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">{t('recurring.nameLabel')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('recurring.namePlaceholder')}
          className="mb-3 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-[14px] focus:border-[var(--color-brand)] focus:outline-none"
        />

        {/* Kategorija */}
        <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">{t('recurring.categoryLabel')}</label>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {relevantCats.map((c) => {
            const active = c.id === categoryId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className="flex flex-col items-center gap-1 rounded-xl border p-2"
                style={{
                  borderColor: active ? c.color : 'var(--color-line)',
                  background: active ? `${c.color}12` : 'var(--color-surface)',
                }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c.color}1A`, color: c.color }}>
                  <CategoryIcon name={c.icon} className="h-4 w-4" />
                </span>
                <span className="text-center text-[9px] font-medium leading-tight">{c.name}</span>
              </button>
            )
          })}
        </div>

        {/* Iznos */}
        <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
          {t('recurring.amountLabel')}
        </label>
        <div className="mb-3 flex items-center gap-2">
          <input
            value={amount ? formatNumber(parseInt(amount || '0', 10)) : ''}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 9))}
            inputMode="numeric"
            placeholder="0"
            className="tnum w-40 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px] font-semibold focus:border-[var(--color-brand)] focus:outline-none"
          />
          <span className="text-[13px] text-[var(--color-ink-muted)]">din</span>
        </div>

        {/* Raspored */}
        <label className="mb-1 block text-[12px] font-medium text-[var(--color-ink-muted)]">
          {t('recurring.whenLabel')}
        </label>
        <div className="mb-4 flex items-center gap-2">
          <select
            value={dayNum}
            onChange={(e) => setDayNum(e.target.value)}
            className="tnum rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-[14px] font-medium focus:border-[var(--color-brand)] focus:outline-none"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)}>{d}.</option>
            ))}
          </select>
          <span className="text-[13px] text-[var(--color-ink-muted)]">{t('recurring.inMonth')}</span>
        </div>

        <div className="flex items-center gap-2">
          {initial && (
            <button
              type="button"
              onClick={remove}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-expense-soft)] text-[var(--color-expense)] active:scale-95"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="brand-bg flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white disabled:opacity-40"
          >
            <Check className="h-5 w-5" /> {t('recurring.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
