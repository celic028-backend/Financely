import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Wallet,
  PieChart,
  Bot,
  ArrowRight,
  Check,
  Smartphone,
  Mic,
  User,
} from 'lucide-react'
import { useProfile } from '../hooks/useData'
import { setStartingBalance, updateProfile } from '../lib/repo'
import { formatNumber, currencySymbol, CURRENCIES } from '../lib/format'
import { hapticIfOn } from '../lib/haptics'

const STEPS = 4

/** Uvodni tok za nove korisnike: ime → dobrodošlica → početno stanje → vodič. */
export default function Onboarding() {
  const profile = useProfile()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('RSD')

  async function changeCurrency(v: string) {
    setCurrency(v)
    await updateProfile({ currency: v })
  }

  async function next() {
    hapticIfOn(8)
    if (step === 0 && name.trim() && profile) {
      await updateProfile({
        settings: { ...profile.settings, displayName: name.trim() },
      })
    }
    if (step === 2) {
      const n = parseInt(balance || '0', 10)
      if (n > 0) await setStartingBalance(n)
    }
    if (step === STEPS - 1) {
      if (!profile) return
      await updateProfile({
        settings: {
          ...profile.settings,
          displayName: profile.settings.displayName || name.trim() || null,
          onboardedAt: new Date().toISOString(),
        },
      })
      return
    }
    setStep((s) => s + 1)
  }

  const canNext = step !== 0 || name.trim().length > 0

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col px-6">
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <NameStep name={name} setName={setName} />}
            {step === 1 && <Welcome name={name} />}
            {step === 2 && (
              <Balance
                balance={balance}
                setBalance={setBalance}
                currency={currency}
                onCurrency={changeCurrency}
              />
            )}
            {step === 3 && <Guide />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="safe-bottom pb-6">
        {/* Tačkice */}
        <div className="mb-4 flex justify-center gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? '20px' : '6px',
                background: i === step ? 'var(--color-brand)' : 'var(--color-line)',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          disabled={!canNext}
          className="brand-bg flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-40"
        >
          {step === STEPS - 1 ? (
            <>
              <Check className="h-5 w-5" strokeWidth={2.5} />
              Počni
            </>
          ) : (
            <>
              Dalje
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Startni balans je obavezan — 0 je dozvoljeno ali svesno */}
      </div>
    </div>
  )
}

function NameStep({
  name,
  setName,
}: {
  name: string
  setName: (v: string) => void
}) {
  return (
    <div className="text-center">
      <div className="brand-bg mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-[var(--shadow-float)]">
        <User className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold">Kako se zoveš?</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
        Da te pozdravljamo po imenu svaki put kad otvoriš app.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 30))}
        autoFocus
        placeholder="Tvoje ime"
        className="mt-8 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4 text-center text-[20px] font-semibold placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-brand)] focus:outline-none"
      />
    </div>
  )
}

function Welcome({ name }: { name: string }) {
  return (
    <div className="text-center">
      <div className="brand-bg mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-[var(--shadow-float)]">
        <Sparkles className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold">
        {name ? `Zdravo, ${name}!` : 'Dobrodošao u Financely'}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
        Prati troškove, vidi gde ti idu pare i štedi pametnije.
      </p>
      <div className="mt-8 space-y-3 text-left">
        <Feature icon={<Wallet className="h-5 w-5" />} title="Brz unos">
          Zapiši trošak za 3 sekunde — tekstom ili glasom.
        </Feature>
        <Feature icon={<PieChart className="h-5 w-5" />} title="Jasna slika">
          Grafikoni pokazuju tačno gde ti odlaze pare.
        </Feature>
        <Feature icon={<Bot className="h-5 w-5" />} title="AI asistent">
          Pitaj bilo šta o svojim finansijama i dobij iskren savet.
        </Feature>
      </div>
    </div>
  )
}

function Balance({
  balance,
  setBalance,
  currency,
  onCurrency,
}: {
  balance: string
  setBalance: (v: string) => void
  currency: string
  onCurrency: (v: string) => void
}) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Koliko trenutno imaš?</h1>
      <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
        Unesi ukupno stanje (keš + račun) da bilans bude tačan od prvog dana.
      </p>
      <div className="mt-8 flex items-end justify-center gap-2">
        <input
          value={balance ? formatNumber(parseInt(balance, 10)) : ''}
          onChange={(e) => setBalance(e.target.value.replace(/\D/g, '').slice(0, 9))}
          inputMode="numeric"
          autoFocus
          placeholder="0"
          className="tnum w-56 bg-transparent text-center text-[48px] font-bold leading-none placeholder:text-[var(--color-ink-faint)] focus:outline-none"
        />
      </div>
      <p className="mt-1 text-[14px] font-medium text-[var(--color-ink-muted)]">
        {currencySymbol()}
      </p>
      <div className="mt-6">
        <label className="mb-1.5 block text-[12px] font-medium text-[var(--color-ink-muted)]">
          Valuta
        </label>
        <select
          value={currency}
          onChange={(e) => onCurrency(e.target.value)}
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium focus:border-[var(--color-brand)] focus:outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function Guide() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Par caka za početak</h1>
      <div className="mt-8 space-y-3 text-left">
        <Feature icon={<Sparkles className="h-5 w-5" />} title="Pametni unos">
          Napiši „kafa 250" i app sam popuni kategoriju i iznos.
        </Feature>
        <Feature icon={<Mic className="h-5 w-5" />} title="Reci naglas">
          „Juče sam platio kafu 250 dinara" — AI razume i doda trošak.
        </Feature>
        <Feature icon={<Smartphone className="h-5 w-5" />} title="Dodaj na telefon">
          Iz browser menija izaberi „Add to Home Screen" i Financely postaje prava aplikacija.
        </Feature>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="brand-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
        {icon}
      </span>
      <div>
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          {children}
        </p>
      </div>
    </div>
  )
}
