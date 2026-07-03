import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, ChevronDown, X, Check, EyeOff } from 'lucide-react'
import { useAllCategories } from '../hooks/useData'
import { upsertCategory, deactivateCategory, reactivateCategory } from '../lib/repo'
import { CategoryIcon, ICON_NAMES } from './CategoryIcon'
import { newId, LOCAL_USER } from '../lib/db'
import { formatNumber } from '../lib/format'
import { hapticIfOn } from '../lib/haptics'
import type { Category, TxType } from '../lib/types'

/** Paleta boja za kategorije (usklađena sa seed bojama). */
const COLORS = [
  '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444',
  '#22C55E', '#6366F1', '#F97316', '#06B6D4', '#A855F7', '#64748B',
]

/** Fallback kategorija koja ne sme da se sakrije. */
const PROTECTED_ID = 'exp-ostalo'

export function CategoryManager() {
  const cats = useAllCategories() ?? []
  const active = cats.filter((c) => c.isActive)
  const inactive = cats.filter((c) => !c.isActive)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  return (
    <div className="card mb-5 px-4">
      <div className="divide-y divide-[var(--color-line)]">
        {active.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${c.color}1A`, color: c.color }}
            >
              <CategoryIcon name={c.icon} className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">{c.name}</p>
              <p className="text-[11px] text-[var(--color-ink-muted)]">
                {c.type === 'expense' ? 'Trošak' : c.incomeKind === 'fixed' ? 'Redovan prihod' : 'Prihod sa strane'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(c)}
              aria-label={`Izmeni ${c.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--color-line)] py-3 text-[13px] font-semibold text-[var(--color-brand)]"
      >
        <Plus className="h-4 w-4" />
        Nova kategorija
      </button>

      {inactive.length > 0 && (
        <div className="border-t border-[var(--color-line)]">
          <button
            type="button"
            onClick={() => setShowInactive(!showInactive)}
            className="flex w-full items-center justify-between py-3 text-[13px] text-[var(--color-ink-muted)]"
          >
            <span>Neaktivne ({inactive.length})</span>
            <ChevronDown
              className="h-4 w-4 transition-transform"
              style={{ transform: showInactive ? 'rotate(180deg)' : undefined }}
            />
          </button>
          {showInactive &&
            inactive.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 opacity-60">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${c.color}1A`, color: c.color }}
                >
                  <CategoryIcon name={c.icon} className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[13px]">{c.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    reactivateCategory(c.id)
                    hapticIfOn(8)
                  }}
                  className="rounded-full border border-[var(--color-brand)] px-3 py-1 text-[12px] font-semibold text-[var(--color-brand)] active:scale-95"
                >
                  Vrati
                </button>
              </div>
            ))}
        </div>
      )}

      <AnimatePresence>
        {(editing || creating) && (
          <CategoryEditSheet
            category={editing}
            maxSort={Math.max(0, ...cats.map((c) => c.sort))}
            onClose={() => {
              setEditing(null)
              setCreating(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CategoryEditSheet({
  category,
  maxSort,
  onClose,
}: {
  category: Category | null
  maxSort: number
  onClose: () => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState<TxType>(category?.type ?? 'expense')
  const [icon, setIcon] = useState(category?.icon ?? 'Tag')
  const [color, setColor] = useState(category?.color ?? COLORS[0])
  const [budget, setBudget] = useState(
    category?.monthlyBudget != null ? String(category.monthlyBudget) : '',
  )
  const [incomeKind, setIncomeKind] = useState<'fixed' | 'extra'>(
    category?.incomeKind ?? 'extra',
  )

  const canSave = name.trim().length > 0

  async function save() {
    if (!canSave) return
    await upsertCategory({
      id: category?.id ?? `cat-${newId()}`,
      userId: LOCAL_USER,
      name: name.trim(),
      type,
      incomeKind: type === 'income' ? incomeKind : null,
      icon,
      color,
      monthlyBudget:
        type === 'expense' && budget ? parseInt(budget, 10) || null : null,
      isActive: true,
      sort: category?.sort ?? maxSort + 10,
    })
    hapticIfOn([10, 30, 10])
    onClose()
  }

  async function hide() {
    if (!category || category.id === PROTECTED_ID) return
    await deactivateCategory(category.id)
    hapticIfOn(10)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-[var(--color-bg)] p-5 pb-8"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {category ? 'Izmeni kategoriju' : 'Nova kategorija'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ime */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder="Ime kategorije"
          autoFocus={!category}
          className="mb-4 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[15px] font-medium placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-brand)] focus:outline-none"
        />

        {/* Tip — zaključan pri izmeni jer transakcije referenciraju kategoriju */}
        {!category && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
            {(['expense', 'income'] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="rounded-xl py-2 text-[13px] font-semibold transition-all"
                style={{
                  background: type === t ? 'var(--color-surface)' : 'transparent',
                  color:
                    type === t
                      ? t === 'expense'
                        ? 'var(--color-expense)'
                        : 'var(--color-income)'
                      : 'var(--color-ink-muted)',
                  boxShadow: type === t ? 'var(--shadow-card)' : 'none',
                }}
              >
                {t === 'expense' ? 'Trošak' : 'Prihod'}
              </button>
            ))}
          </div>
        )}

        {/* Ikonica */}
        <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">Ikonica</p>
        <div className="mb-4 grid grid-cols-7 gap-2">
          {ICON_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setIcon(n)
                hapticIfOn(4)
              }}
              aria-label={n}
              className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-90"
              style={{
                borderColor: icon === n ? color : 'var(--color-line)',
                background: icon === n ? `${color}1A` : 'var(--color-surface)',
                color: icon === n ? color : 'var(--color-ink-muted)',
              }}
            >
              <CategoryIcon name={n} className="h-5 w-5" />
            </button>
          ))}
        </div>

        {/* Boja */}
        <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">Boja</p>
        <div className="mb-4 flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c)
                hapticIfOn(4)
              }}
              aria-label={c}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90"
              style={{
                background: c,
                outline: color === c ? `3px solid ${c}66` : 'none',
                outlineOffset: '2px',
              }}
            >
              {color === c && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>

        {/* Budžet (trošak) / vrsta prihoda */}
        {type === 'expense' ? (
          <>
            <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">
              Mesečni budžet (opciono)
            </p>
            <div className="mb-5 flex items-center gap-2">
              <input
                value={budget ? formatNumber(parseInt(budget, 10)) : ''}
                onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 8))}
                inputMode="numeric"
                placeholder="—"
                className="tnum w-32 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-[14px] focus:border-[var(--color-brand)] focus:outline-none"
              />
              <span className="text-[13px] text-[var(--color-ink-muted)]">din</span>
            </div>
          </>
        ) : (
          <>
            <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-muted)]">
              Vrsta prihoda
            </p>
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
              {(
                [
                  { key: 'fixed', label: 'Redovno' },
                  { key: 'extra', label: 'Sa strane' },
                ] as const
              ).map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => setIncomeKind(k.key)}
                  className="rounded-xl py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background: incomeKind === k.key ? 'var(--color-surface)' : 'transparent',
                    color:
                      incomeKind === k.key ? 'var(--color-brand)' : 'var(--color-ink-muted)',
                    boxShadow: incomeKind === k.key ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Akcije */}
        <div className="flex items-center gap-3">
          {category && category.id !== PROTECTED_ID && (
            <button
              type="button"
              onClick={hide}
              aria-label="Sakrij kategoriju"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-expense-soft)] text-[var(--color-expense)] active:scale-95"
            >
              <EyeOff className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            disabled={!canSave}
            onClick={save}
            className="brand-bg flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
            Sačuvaj
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
