import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, BellRing, Tags, Check, Pencil, Repeat, LogOut, Cloud, Loader2, Palette, User } from 'lucide-react'
import { useAllCategories, useProfile } from '../hooks/useData'
import { updateProfile, setCategoryBudget } from '../lib/repo'
import { CategoryIcon } from '../components/CategoryIcon'
import { RecurringSection } from '../components/RecurringSection'
import { CategoryManager } from '../components/CategoryManager'
import { formatNumber, CURRENCIES } from '../lib/format'
import { useAuth } from '../lib/auth'
import { syncNow, usePendingCount } from '../lib/sync'
import { enablePush, disablePush, pushSupported, pushPermission } from '../lib/push'
import { applyTheme, type ThemeMode } from '../lib/theme'
import { t, LANGUAGES } from '../lib/i18n'
import { Languages } from 'lucide-react'
import type { ProfileSettings } from '../lib/types'

export default function Settings() {
  const profile = useProfile()
  const cats = useAllCategories() ?? []
  const expenseCats = cats.filter((c) => c.type === 'expense' && c.isActive)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  if (!profile) return null
  const settings = profile.settings

  async function toggle(key: keyof ProfileSettings) {
    await updateProfile({
      settings: { ...settings, [key]: !settings[key] },
    })
  }

  async function toggleNotify(key: keyof ProfileSettings, def: boolean) {
    await updateProfile({
      settings: { ...settings, [key]: !(settings[key] ?? def) },
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
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
      </header>

      {/* Profil */}
      <SectionTitle icon={<User className="h-4 w-4" />}>{t('settings.profile')}</SectionTitle>
      <div className="card mb-5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[var(--color-ink-muted)]">Ime</p>
            {editingName ? (
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
                autoFocus
                placeholder="Tvoje ime"
                className="mt-1 w-48 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-[16px] font-semibold focus:border-[var(--color-brand)] focus:outline-none"
              />
            ) : (
              <p className="mt-0.5 text-[18px] font-semibold">
                {settings.displayName || '—'}
              </p>
            )}
          </div>
          {editingName ? (
            <button
              type="button"
              onClick={async () => {
                await updateProfile({
                  settings: { ...settings, displayName: nameInput.trim() || null },
                })
                setEditingName(false)
              }}
              className="brand-bg flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-90"
            >
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameInput(settings.displayName ?? '')
                setEditingName(true)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90"
            >
              <Pencil className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Jezik i valuta */}
      <SectionTitle icon={<Languages className="h-4 w-4" />}>
        {t('settings.language')} · {t('settings.currency')}
      </SectionTitle>
      <div className="card mb-5 divide-y divide-[var(--color-line)] px-4">
        <PickerRow
          label={t('settings.language')}
          value={profile.locale === 'en' ? 'en' : 'sr'}
          options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
          onChange={(v) => updateProfile({ locale: v })}
        />
        <PickerRow
          label={t('settings.currency')}
          value={profile.currency}
          options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
          onChange={(v) => updateProfile({ currency: v })}
        />
      </div>

      {/* Ponavljanja */}
      <SectionTitle icon={<Repeat className="h-4 w-4" />}>{t('settings.recurring')}</SectionTitle>
      <RecurringSection />

      {/* Kategorije */}
      <SectionTitle icon={<Tags className="h-4 w-4" />}>{t('settings.categories')}</SectionTitle>
      <CategoryManager />

      {/* Budžeti po kategoriji */}
      <SectionTitle icon={<Tags className="h-4 w-4" />}>{t('settings.budgets')}</SectionTitle>
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

      {/* Izgled */}
      <SectionTitle icon={<Palette className="h-4 w-4" />}>{t('settings.appearance')}</SectionTitle>
      <div className="card mb-5 p-2">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-2)] p-1">
          {(
            [
              { key: 'auto', label: 'Auto' },
              { key: 'light', label: 'Svetla' },
              { key: 'dark', label: 'Tamna' },
            ] as { key: ThemeMode; label: string }[]
          ).map((t) => {
            const active = (settings.theme ?? 'auto') === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={async () => {
                  applyTheme(t.key)
                  await updateProfile({ settings: { ...settings, theme: t.key } })
                }}
                className="rounded-lg py-2 text-[13px] font-semibold transition-all"
                style={{
                  background: active ? 'var(--color-surface)' : 'transparent',
                  color: active ? 'var(--color-brand)' : 'var(--color-ink-muted)',
                  boxShadow: active ? 'var(--shadow-card)' : 'none',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifikacije */}
      <SectionTitle icon={<Bell className="h-4 w-4" />}>{t('settings.notifications')}</SectionTitle>
      <div className="card mb-5 px-4">
        <PushControl />
        <div className="divide-y divide-[var(--color-line)]">
          <ToggleRow
            label="Kad stižu ponavljanja"
            desc="Podsetnik za primanja i račune koji dospevaju"
            on={settings.notifyDue ?? true}
            onToggle={() => toggleNotify('notifyDue', true)}
          />
          <ToggleRow
            label="Kad ugrožavaš cilj štednje"
            desc="Kad trošiš brže nego što cilj dozvoljava"
            on={settings.notifyGoal ?? true}
            onToggle={() => toggleNotify('notifyGoal', true)}
          />
          <ToggleRow
            label="Dnevni podsetnik"
            desc="Blag podsetnik uveče ako nisi ništa uneo"
            on={settings.notifyDaily ?? false}
            onToggle={() => toggleNotify('notifyDaily', false)}
          />
          <ToggleRow
            label="Mesečni rezime"
            desc="Kratak pregled prošlog meseca 1. u mesecu"
            on={settings.notifyMonthly ?? true}
            onToggle={() => toggleNotify('notifyMonthly', true)}
          />
          <ToggleRow
            label="Vibracija"
            desc="Lagana vibracija na uspešan unos"
            on={settings.hapticOn}
            onToggle={() => toggle('hapticOn')}
          />
        </div>
      </div>

      <SyncAndLogout />
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
          className="tnum w-20 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-right text-[13px] focus:border-[var(--color-brand)] focus:outline-none"
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
          className="absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-surface)] shadow transition-all"
          style={{ left: on ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}

function PickerRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <p className="text-[14px] font-medium">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium focus:border-[var(--color-brand)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function PushControl() {
  const { user } = useAuth()
  const [perm, setPerm] = useState(pushPermission())
  const [busy, setBusy] = useState(false)

  if (!pushSupported()) {
    return (
      <div className="flex items-start gap-2 border-b border-[var(--color-line)] py-3.5 text-[12px] text-[var(--color-ink-muted)]">
        <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Push obaveštenja rade u instaliranoj aplikaciji. Dodaj Financely na početni ekran
          (na iPhone-u je push dostupan od iOS 16.4).
        </p>
      </div>
    )
  }

  const enabled = perm === 'granted'

  async function enable() {
    if (!user) return
    setBusy(true)
    await enablePush(user.id)
    setPerm(pushPermission())
    setBusy(false)
  }
  async function disable() {
    setBusy(true)
    await disablePush()
    setPerm(pushPermission())
    setBusy(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium">Push obaveštenja</p>
        <p className="text-[12px] text-[var(--color-ink-muted)]">
          {perm === 'denied'
            ? 'Blokirano — uključi u podešavanjima browsera'
            : enabled
              ? 'Uključeno na ovom uređaju'
              : 'Dozvoli da te podsećamo'}
        </p>
      </div>
      <button
        type="button"
        onClick={enabled ? disable : enable}
        disabled={busy || perm === 'denied'}
        className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold active:scale-95 disabled:opacity-50"
        style={
          enabled
            ? { background: 'var(--color-surface-2)', color: 'var(--color-ink-muted)' }
            : { background: 'var(--color-brand)', color: '#fff' }
        }
      >
        {busy ? '…' : enabled ? 'Isključi' : 'Uključi'}
      </button>
    </div>
  )
}

function SyncAndLogout() {
  const { user, signOut } = useAuth()
  const pending = usePendingCount()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  async function handleSync() {
    if (!user) return
    setSyncing(true)
    setSyncMsg(null)
    const result = await syncNow(user.id)
    setSyncMsg(result.ok ? 'Sinhronizovano!' : `Greška: ${result.error}`)
    setSyncing(false)
  }

  return (
    <div className="mt-6 space-y-3 pb-4">
      <p className="text-center text-[12px] text-[var(--color-ink-muted)]">
        {pending === 0
          ? 'Sve sinhronizovano ✓'
          : `${pending} ${pending === 1 ? 'promena čeka' : 'promene čekaju'} mrežu…`}
      </p>
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] py-3 text-[14px] font-semibold text-[var(--color-brand)] active:scale-[0.98] disabled:opacity-60"
      >
        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
        Sinhronizuj sa cloud-om
      </button>
      {syncMsg && (
        <p className="text-center text-[12px] text-[var(--color-ink-muted)]">{syncMsg}</p>
      )}
      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-expense)] bg-[var(--color-surface)] py-3 text-[14px] font-semibold text-[var(--color-expense)] active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        Odjavi se
      </button>
      <p className="text-center text-[12px] text-[var(--color-ink-faint)]">
        {user?.email} · Financely
      </p>
    </div>
  )
}
