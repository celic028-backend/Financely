import { useNavigate } from 'react-router-dom'
import { BellRing } from 'lucide-react'
import { useReminders } from '../hooks/useData'
import { CategoryIcon } from '../components/CategoryIcon'
import { useCategoryMap } from '../hooks/useData'
import type { Reminder } from '../lib/recurring'

export function HomeReminders() {
  const reminders = useReminders()
  const catMap = useCategoryMap()
  const navigate = useNavigate()

  if (reminders.length === 0) return null

  function enter(r: Reminder) {
    const it = r.item
    const q = new URLSearchParams({ type: it.kind === 'income' ? 'income' : 'expense', cat: it.categoryId })
    if (it.amount) q.set('amount', String(it.amount))
    navigate(`/dodaj?${q.toString()}`)
  }

  return (
    <section className="mt-4">
      <div className="mb-1 flex items-center gap-1.5 px-1 text-[var(--color-ink-muted)]">
        <BellRing className="h-4 w-4" />
        <h2 className="text-[13px] font-semibold">Podsetnici</h2>
      </div>
      <div className="card divide-y divide-[var(--color-line)] px-4">
        {reminders.map((r) => {
          const cat = catMap.get(r.item.categoryId)
          const color = cat?.color ?? '#4F46E5'
          return (
            <div key={r.item.id} className="flex items-center gap-3 py-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${color}1A`, color }}
              >
                <CategoryIcon name={cat?.icon ?? 'Banknote'} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{r.item.name}</p>
                <p className="text-[12px]" style={{ color: dueColor(r.daysUntil) }}>
                  {dueLabel(r.daysUntil)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => enter(r)}
                className="brand-bg shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95"
              >
                Unesi
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function dueLabel(days: number): string {
  if (days < 0) return `Kasni ${Math.abs(days)} ${plural(Math.abs(days))}`
  if (days === 0) return 'Stiže danas'
  if (days === 1) return 'Stiže sutra'
  return `Stiže za ${days} dana`
}

function dueColor(days: number): string {
  if (days <= 0) return 'var(--color-warn)'
  return 'var(--color-ink-muted)'
}

function plural(n: number): string {
  return n === 1 ? 'dan' : 'dana'
}
