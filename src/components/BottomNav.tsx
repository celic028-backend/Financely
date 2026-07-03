import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Sparkles, PiggyBank, Settings2, Plus } from 'lucide-react'
import { t } from '../lib/i18n'

const tabs = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/ai', labelKey: 'nav.assistant', icon: Sparkles, end: false },
  { to: '/stednja', labelKey: 'nav.savings', icon: PiggyBank, end: false },
  { to: '/podesavanja', labelKey: 'nav.settings', icon: Settings2, end: false },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="safe-bottom z-40 shrink-0 border-t border-[var(--color-line)] backdrop-blur-xl"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 85%, transparent)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        <TabItem {...tabs[0]} />
        <TabItem {...tabs[1]} />

        {/* Centralno + dugme */}
        <div className="relative flex w-16 shrink-0 items-start justify-center">
          <motion.button
            type="button"
            aria-label="Dodaj transakciju"
            onClick={() => navigate('/dodaj')}
            whileTap={{ scale: 0.88 }}
            className="brand-bg -mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-float)]"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </motion.button>
        </div>

        <TabItem {...tabs[2]} />
        <TabItem {...tabs[3]} />
      </div>
    </nav>
  )
}

function TabItem({
  to,
  labelKey,
  icon: Icon,
  end,
}: {
  to: string
  labelKey: string
  icon: typeof Home
  end: boolean
}) {
  const label = t(labelKey)
  return (
    <NavLink
      to={to}
      end={end}
      className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[var(--color-ink-faint)] transition-colors"
    >
      {({ isActive }) => (
        <>
          <Icon
            className="h-[22px] w-[22px]"
            strokeWidth={isActive ? 2.4 : 2}
            style={{ color: isActive ? 'var(--color-brand)' : undefined }}
          />
          <span
            className="text-[10px] font-medium"
            style={{ color: isActive ? 'var(--color-brand)' : undefined }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
