import { NavLink, useNavigate } from 'react-router-dom'
import { Home, PieChart, ReceiptText, Sparkles, Plus } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Početna', icon: Home, end: true },
  { to: '/analitika', label: 'Analitika', icon: PieChart, end: false },
  { to: '/istorija', label: 'Istorija', icon: ReceiptText, end: false },
  { to: '/ai', label: 'Saveti', icon: Sparkles, end: false },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="safe-bottom z-40 shrink-0 border-t border-[var(--color-line)] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        <TabItem {...tabs[0]} />
        <TabItem {...tabs[1]} />

        {/* Centralno + dugme */}
        <div className="relative flex w-16 shrink-0 items-start justify-center">
          <button
            type="button"
            aria-label="Dodaj transakciju"
            onClick={() => navigate('/dodaj')}
            className="brand-bg -mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-float)] transition-transform active:scale-90"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        <TabItem {...tabs[2]} />
        <TabItem {...tabs[3]} />
      </div>
    </nav>
  )
}

function TabItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof Home
  end: boolean
}) {
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
