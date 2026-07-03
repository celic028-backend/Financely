import { BellRing } from 'lucide-react'
import { useReminders } from '../hooks/useData'
import { CategoryIcon } from '../components/CategoryIcon'
import { useCategoryMap } from '../hooks/useData'
import { formatNumber } from '../lib/format'
import { t } from '../lib/i18n'

export function HomeReminders() {
  const reminders = useReminders()
  const catMap = useCategoryMap()

  if (reminders.length === 0) return null

  return (
    <section className="mt-4">
      <div className="mb-1 flex items-center gap-1.5 px-1 text-[var(--color-ink-muted)]">
        <BellRing className="h-4 w-4" />
        <h2 className="text-[13px] font-semibold">{t('home.reminders')}</h2>
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
              {r.item.amount && (
                <span className="tnum shrink-0 text-[14px] font-semibold" style={{ color }}>
                  {formatNumber(r.item.amount)} din
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function dueLabel(days: number): string {
  if (days < 0) return `${t('home.overdue')} ${Math.abs(days)} ${Math.abs(days) === 1 ? t('home.day') : t('home.days')}`
  if (days === 0) return t('home.dueToday')
  if (days === 1) return t('home.dueTomorrow')
  return `${t('home.dueIn')} ${days} ${t('home.days')}`
}

function dueColor(days: number): string {
  if (days <= 0) return 'var(--color-warn)'
  return 'var(--color-ink-muted)'
}
