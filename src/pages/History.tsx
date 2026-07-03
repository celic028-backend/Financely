import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ReceiptText } from 'lucide-react'
import { useCategoryMap, useTransactions } from '../hooks/useData'
import { TransactionRow } from '../components/TransactionRow'
import { formatMonthLabel, formatSigned, monthKey } from '../lib/format'
import type { Transaction, TxType } from '../lib/types'

type Filter = 'all' | TxType

export default function History() {
  const navigate = useNavigate()
  const txs = useTransactions()
  const catMap = useCategoryMap()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    const list = txs ?? []
    const query = q.trim().toLowerCase()
    return list.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (!query) return true
      const cat = catMap.get(t.categoryId)
      const hay = `${cat?.name ?? ''} ${t.description ?? ''}`.toLowerCase()
      return hay.includes(query)
    })
  }, [txs, q, filter, catMap])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  return (
    <div className="safe-top">
      <header className="py-4">
        <h1 className="text-xl font-bold">Istorija</h1>
      </header>

      {/* Pretraga */}
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5">
        <Search className="h-[18px] w-[18px] shrink-0 text-[var(--color-ink-faint)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pretraži po opisu ili kategoriji"
          className="min-w-0 flex-1 bg-transparent text-[14px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
        />
      </div>

      {/* Filter po tipu */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
        <SegBtn active={filter === 'all'} onClick={() => setFilter('all')}>
          Sve
        </SegBtn>
        <SegBtn active={filter === 'expense'} onClick={() => setFilter('expense')} tone="expense">
          Troškovi
        </SegBtn>
        <SegBtn active={filter === 'income'} onClick={() => setFilter('income')} tone="income">
          Prihodi
        </SegBtn>
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-2 px-6 py-10 text-center">
          <ReceiptText className="h-8 w-8 text-[var(--color-ink-faint)]" />
          <p className="font-semibold">Nema transakcija</p>
          <p className="text-[13px] text-[var(--color-ink-muted)]">
            {q || filter !== 'all'
              ? 'Nema rezultata za ovaj filter.'
              : 'Kad dodaš prvu transakciju, pojaviće se ovde.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="mb-1 flex items-center justify-between px-1">
                <h2 className="text-[13px] font-semibold text-[var(--color-ink-muted)]">
                  {formatMonthLabel(g.key)}
                </h2>
                <span
                  className="tnum text-[13px] font-semibold"
                  style={{
                    color:
                      g.net >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
                  }}
                >
                  {formatSigned(Math.abs(g.net), g.net >= 0 ? 'income' : 'expense')}
                </span>
              </div>
              <div className="card divide-y divide-[var(--color-line)] px-4">
                {g.items.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    category={catMap.get(tx.categoryId)}
                    onClick={() => navigate(`/dodaj?edit=${tx.id}`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function SegBtn({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  tone?: TxType
  children: React.ReactNode
}) {
  const color =
    tone === 'income'
      ? 'var(--color-income)'
      : tone === 'expense'
        ? 'var(--color-expense)'
        : 'var(--color-brand)'
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl py-2 text-[13px] font-semibold transition-all"
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

interface MonthGroup {
  key: string
  net: number
  items: Transaction[]
}

function groupByMonth(txs: Transaction[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>()
  for (const t of txs) {
    const key = monthKey(t.occurredOn)
    let g = map.get(key)
    if (!g) {
      g = { key, net: 0, items: [] }
      map.set(key, g)
    }
    g.items.push(t)
    g.net += t.type === 'income' ? t.amount : -t.amount
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
}
