import { Link } from 'react-router-dom'
import { ArrowLeft, PiggyBank } from 'lucide-react'
import { SavingsSection } from '../components/SavingsSection'
import { t } from '../lib/i18n'

export default function Savings() {
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
        <PiggyBank className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-xl font-bold">{t('settings.savings')}</h1>
      </header>

      <SavingsSection />
    </div>
  )
}
