import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X, Trash2, Sparkles, Check } from 'lucide-react'
import { db } from '../lib/db'
import { useCategories } from '../hooks/useData'
import { addTransaction, updateTransaction, deleteTransaction } from '../lib/repo'
import { smartParseLocal } from '../lib/smartParse'
import { CategoryIcon } from '../components/CategoryIcon'
import { haptic } from '../lib/haptics'
import { formatNumber, today, toDay, parseDay } from '../lib/format'
import type { TxType } from '../lib/types'

export default function AddTransaction() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const allCats = useCategories() ?? []

  // Prefill iz podsetnika: ?type=income&cat=inc-fiksno&amount=33000
  const prefillType = (params.get('type') as TxType) || 'expense'
  const prefillCat = params.get('cat')
  const prefillAmount = params.get('amount')

  const [type, setType] = useState<TxType>(prefillType)
  const [amount, setAmount] = useState(prefillAmount ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(prefillCat)
  const [occurredOn, setOccurredOn] = useState(today())
  const [description, setDescription] = useState('')
  const [smart, setSmart] = useState('')
  const [loaded, setLoaded] = useState(!editId)

  // Učitaj postojeću transakciju u edit modu
  useEffect(() => {
    if (!editId) return
    let active = true
    db.transactions.get(editId).then((tx) => {
      if (!active || !tx) return
      setType(tx.type)
      setAmount(String(tx.amount))
      setCategoryId(tx.categoryId)
      setOccurredOn(tx.occurredOn)
      setDescription(tx.description ?? '')
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [editId])

  const cats = useMemo(
    () => allCats.filter((c) => c.type === type),
    [allCats, type],
  )

  function switchType(t: TxType) {
    if (t === type) return
    setType(t)
    setCategoryId(null)
    haptic(8)
  }

  function applySmart() {
    const parsed = smartParseLocal(smart, allCats)
    if (parsed.type !== type) {
      setType(parsed.type)
    }
    if (parsed.amount != null) setAmount(String(parsed.amount))
    if (parsed.categoryId) setCategoryId(parsed.categoryId)
    if (parsed.description) setDescription(parsed.description)
    haptic(10)
  }

  const amountNum = parseInt(amount || '0', 10)
  const canSave = amountNum > 0 && !!categoryId

  async function save() {
    if (!canSave || !categoryId) return
    const cat = allCats.find((c) => c.id === categoryId)
    const incomeKind = type === 'income' ? (cat?.incomeKind ?? 'extra') : null
    if (editId) {
      await updateTransaction(editId, {
        amount: amountNum,
        type,
        categoryId,
        incomeKind,
        description: description.trim() || null,
        occurredOn,
      })
    } else {
      await addTransaction({
        amount: amountNum,
        type,
        categoryId,
        incomeKind,
        description: description.trim() || null,
        occurredOn,
      })
    }
    haptic([10, 30, 10])
    navigate(-1)
  }

  async function remove() {
    if (!editId) return
    await deleteTransaction(editId)
    haptic(20)
    navigate(-1)
  }

  const dateOptions = quickDates()

  if (!loaded) return null

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-8">
      {/* Header */}
      <div className="safe-top flex items-center justify-between py-4">
        <h1 className="text-lg font-semibold">
          {editId ? 'Izmeni transakciju' : 'Nova transakcija'}
        </h1>
        <button
          type="button"
          aria-label="Zatvori"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Pametni unos */}
      {!editId && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-brand-soft)] p-2 pl-3.5">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <input
            value={smart}
            onChange={(e) => setSmart(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && smart && applySmart()}
            placeholder={'Npr. „kafa 250" ili „juče 3000 patike"'}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
          />
          <button
            type="button"
            disabled={!smart}
            onClick={applySmart}
            className="brand-bg shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Popuni
          </button>
        </div>
      )}

      {/* Toggle trošak / prihod */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
        <ToggleBtn active={type === 'expense'} onClick={() => switchType('expense')} tone="expense">
          Trošak
        </ToggleBtn>
        <ToggleBtn active={type === 'income'} onClick={() => switchType('income')} tone="income">
          Prihod
        </ToggleBtn>
      </div>

      {/* Iznos */}
      <div className="mb-5 text-center">
        <div className="flex items-end justify-center gap-1">
          <input
            value={amount ? formatNumber(amountNum) : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
              setAmount(digits)
            }}
            inputMode="numeric"
            autoFocus={!editId}
            placeholder="0"
            className="tnum w-full bg-transparent text-center text-[52px] font-bold leading-none text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
            style={{
              color:
                type === 'income'
                  ? 'var(--color-income)'
                  : 'var(--color-ink)',
            }}
          />
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--color-ink-muted)]">dinara</p>
      </div>

      {/* Kategorije */}
      <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">Kategorija</p>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {cats.map((c) => {
          const active = c.id === categoryId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategoryId(c.id)
                haptic(6)
              }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all active:scale-95"
              style={{
                borderColor: active ? c.color : 'var(--color-line)',
                background: active ? `${c.color}12` : 'var(--color-surface)',
              }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${c.color}1A`, color: c.color }}
              >
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="text-center text-[10px] font-medium leading-tight text-[var(--color-ink)]">
                {c.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Datum */}
      <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">Datum</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {dateOptions.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setOccurredOn(d.value)}
            className="rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              borderColor:
                occurredOn === d.value ? 'var(--color-brand)' : 'var(--color-line)',
              background:
                occurredOn === d.value ? 'var(--color-brand-soft)' : 'var(--color-surface)',
              color:
                occurredOn === d.value ? 'var(--color-brand)' : 'var(--color-ink)',
            }}
          >
            {d.label}
          </button>
        ))}
        <input
          type="date"
          value={occurredOn}
          max={today()}
          onChange={(e) => e.target.value && setOccurredOn(e.target.value)}
          className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] text-[var(--color-ink)]"
        />
      </div>

      {/* Opis */}
      <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">Opis (opciono)</p>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="npr. ručak sa drugom"
        className="mb-6 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[14px] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-brand)] focus:outline-none"
      />

      {/* Akcije */}
      <div className="mt-auto flex items-center gap-3">
        {editId && (
          <button
            type="button"
            onClick={remove}
            aria-label="Obriši"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-expense-soft)] text-[var(--color-expense)] active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          disabled={!canSave}
          onClick={save}
          className="brand-bg flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white shadow-[var(--shadow-float)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
          {editId ? 'Sačuvaj izmene' : 'Sačuvaj'}
        </button>
      </div>
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  tone: 'income' | 'expense'
  children: React.ReactNode
}) {
  const color = tone === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl py-2.5 text-[14px] font-semibold transition-all"
      style={{
        background: active ? 'var(--color-surface)' : 'transparent',
        color: active ? color : 'var(--color-ink-muted)',
        boxShadow: active ? 'var(--shadow-card)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function quickDates() {
  const t = new Date()
  const y = new Date(t)
  y.setDate(t.getDate() - 1)
  const p = new Date(t)
  p.setDate(t.getDate() - 2)
  return [
    { value: toDay(t), label: 'Danas' },
    { value: toDay(y), label: 'Juče' },
    { value: toDay(p), label: prekjuceLabel(p) },
  ]
}

function prekjuceLabel(d: Date): string {
  return parseDay(toDay(d)).getDate() + '.'
}
