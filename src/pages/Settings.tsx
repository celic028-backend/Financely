import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wallet, Bell, Tags, Check, Pencil, PiggyBank, Repeat } from 'lucide-react'
import { useAllCategories, useProfile } from '../hooks/useData'
import { setStartingBalance, updateProfile, setCategoryBudget } from '../lib/repo'
import { CategoryIcon } from '../components/CategoryIcon'
import { SavingsSection } from '../components/SavingsSection'
import { RecurringSection } from '../components/RecurringSection'
import { formatNumber, formatRsd } from '../lib/format'
import type { ProfileSettings } from '../lib/types'

export default function Settings() {
  const profile = useProfile()
  const cats = useAllCategories() ?? []
  const expenseCats = cats.filter((c) => c.type === 'expense' && c.isActive)

  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')

  if (!profile) return null
  const settings = profile.settings

  function startEditBalance() {
    setBalanceInput(String(profile!.startingBalance || ''))
    setEditingBalance(true)
  }
  async function saveBalance() {
    await setStartingBalance(parseInt(balanceInput || '0', 10))
    setEditingBalance(false)
  }
  async function toggle(key: keyof ProfileSettings) {
    await updateProfile({
      settings: { ...settings, [key]: !settings[key] },
    })
  }

  return (
    <div className="safe-top pb-4">
      <header className="flex items-center gap-3 py-4">
        <Link
          to="/"
          aria-label="Nazad"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Podešavanja</h1>
      </header>

      {/* Početno stanje */}
      <SectionTitle icon={<Wallet className="h-4 w-4" />}>Novac</SectionTitle>
      <div className="card mb-5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[var(--color-ink-muted)]">Trenutno stanje na startu</p>
            {editingBalance ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={balanceInput ? formatNumber(parseInt(balanceInput || '0', 10)) : ''}
                  onChange={(e) =>
                    setBalanceInput(e.target.value.replace(/\D/g, '').slice(0, 9))
                  }
                  inputMode="numeric"
                  autoFocus
                  placeholder="0"
                  className="tnum w-32 rounded-xl border border-[var(--color-line)] bg-white px-3 py-1.5 text-[18px] font-bold focus:border-[var(--color-brand)] focus:outline-none"
                />
                <span className="text-[13px] text-[var(--color-ink-muted)]">din</span>
              </div>
            ) : (
              <p className="tnum mt-0.5 text-[22px] font-bold">
                {formatRsd(profile.startingBalance)}
              </p>
            )}
          </div>
          {editingBalance ? (
            <button
              type="button"
              onClick={saveBalance}
              className="brand-bg flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-90"
            >
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={startEditBalance}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
            >
              <Pencil className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Štednja */}
      <SectionTitle icon={<PiggyBank className="h-4 w-4" />}>Štednja</SectionTitle>
      <SavingsSection />

      {/* Ponavljanja */}
      <SectionTitle icon={<Repeat className="h-4 w-4" />}>Ponavljajuća primanja i računi</SectionTitle>
      <RecurringSection />

      {/* Budžeti po kategoriji */}
      <SectionTitle icon={<Tags className="h-4 w-4" />}>Budžet po kategoriji</SectionTitle>
      <p className="mb-2 px-1 text-[12px] text-[var(--color-ink-muted)]">
        Postavi mesečni limit i upozorićemo te kad se približiš. (AI će predložiti limite u sledećoj fazi.)
      </p>
      <div className="card mb-5 divide-y divide-[var(--color-line)] px-4">
        {expenseCats.map((c) => (
          <BudgetRow
            key={c.id}
            color={c.color}
            icon={c.icon}
            name={c.name}
            budget={c.monthlyBudget ?? null}
            onSave={(v) => setCategoryBudget(c.id, v)}
          />
        ))}
      </div>

      {/* Podsetnici */}
      <SectionTitle icon={<Bell className="h-4 w-4" />}>Podsetnici</SectionTitle>
      <div className="card mb-5 divide-y divide-[var(--color-line)] px-4">
        <ToggleRow
          label="Kad pređem budžet"
          desc="Upozorenje kad potrošiš više nego što treba"
          on={settings.remindBudget}
          onToggle={() => toggle('remindBudget')}
        />
        <ToggleRow
          label="Kad stižu primanja"
          desc="Podsetnik za stipendiju i fiksne uplate"
          on={settings.remindIncome}
          onToggle={() => toggle('remindIncome')}
        />
        <ToggleRow
          label="Vibracija"
          desc="Lagana vibracija na uspešan unos"
          on={settings.hapticOn}
          onToggle={() => toggle('hapticOn')}
        />
      </div>

      <p className="mt-6 text-center text-[12px] text-[var(--color-ink-faint)]">
        Financely · lokalni podaci (uskoro sinhronizacija sa nalogom)
      </p>
    </div>
  )
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 px-1 text-[var(--color-ink-muted)]">
      {icon}
      <h2 className="text-[13px] font-semibold uppercase tracking-wide">{children}</h2>
    </div>
  )
}

function BudgetRow({
  color,
  icon,
  name,
  budget,
  onSave,
}: {
  color: string
  icon: string
  name: string
  budget: number | null
  onSave: (v: number | null) => void
}) {
  const [val, setVal] = useState(budget != null ? String(budget) : '')

  function commit() {
    const n = val ? parseInt(val, 10) : null
    onSave(n && n > 0 ? n : null)
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1A`, color }}
      >
        <CategoryIcon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 text-[14px] font-medium">{name}</span>
      <div className="flex items-center gap-1">
        <input
          value={val ? formatNumber(parseInt(val || '0', 10)) : ''}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onBlur={commit}
          inputMode="numeric"
          placeholder="—"
          className="tnum w-20 rounded-lg border border-[var(--color-line)] bg-white px-2 py-1 text-right text-[13px] focus:border-[var(--color-brand)] focus:outline-none"
        />
        <span className="text-[12px] text-[var(--color-ink-faint)]">din</span>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string
  desc: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{label}</p>
        <p className="text-[12px] text-[var(--color-ink-muted)]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: on ? 'var(--color-brand)' : 'var(--color-line)' }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: on ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}
