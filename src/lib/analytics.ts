import { monthKey, today, toDay } from './format'
import type { Category, Transaction } from './types'

export type Period = 'month' | 'prev' | '3m' | 'year'

export const PERIODS: { key: Period; label: string }[] = [
  { key: 'month', label: 'Ovaj mesec' },
  { key: 'prev', label: 'Prošli mesec' },
  { key: '3m', label: '3 meseca' },
  { key: 'year', label: 'Godina' },
]

/** Vrati [odDatum, doDatum] (inkluzivno, YYYY-MM-DD) za dati period. */
export function periodRange(period: Period): [string, string] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (period) {
    case 'month':
      return [toDay(new Date(y, m, 1)), toDay(new Date(y, m + 1, 0))]
    case 'prev':
      return [toDay(new Date(y, m - 1, 1)), toDay(new Date(y, m, 0))]
    case '3m':
      return [toDay(new Date(y, m - 2, 1)), toDay(new Date(y, m + 1, 0))]
    case 'year':
      return [toDay(new Date(y, 0, 1)), toDay(new Date(y, 11, 31))]
  }
}

export function inRange(day: string, [from, to]: [string, string]): boolean {
  return day >= from && day <= to
}

export interface Totals {
  income: number
  expense: number
  net: number
}

export function sumTotals(txs: Transaction[]): Totals {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, net: income - expense }
}

export interface CategorySlice {
  category: Category | undefined
  categoryId: string
  total: number
  pct: number // 0..100
}

/** Zbir po kategoriji za dati tip, sortirano opadajuće. */
export function categoryBreakdown(
  txs: Transaction[],
  catMap: Map<string, Category>,
  type: 'expense' | 'income',
): CategorySlice[] {
  const sums = new Map<string, number>()
  let grand = 0
  for (const t of txs) {
    if (t.type !== type) continue
    sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amount)
    grand += t.amount
  }
  const slices: CategorySlice[] = []
  for (const [categoryId, total] of sums) {
    slices.push({
      categoryId,
      category: catMap.get(categoryId),
      total,
      pct: grand > 0 ? (total / grand) * 100 : 0,
    })
  }
  return slices.sort((a, b) => b.total - a.total)
}

/** Podela prihoda: redovna primanja vs zarada sa strane. */
export function incomeSplit(txs: Transaction[]): {
  fixed: number
  extra: number
} {
  let fixed = 0
  let extra = 0
  for (const t of txs) {
    if (t.type !== 'income') continue
    if (t.incomeKind === 'extra') extra += t.amount
    else fixed += t.amount
  }
  return { fixed, extra }
}

export interface MonthPoint {
  key: string // YYYY-MM
  income: number
  expense: number
}

/** Trend za poslednjih N meseci (uključujući tekući), stariji -> noviji. */
export function monthlyTrend(txs: Transaction[], months: number): MonthPoint[] {
  const now = new Date()
  const points: MonthPoint[] = []
  const idx = new Map<string, MonthPoint>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(toDay(d))
    const p = { key, income: 0, expense: 0 }
    points.push(p)
    idx.set(key, p)
  }
  for (const t of txs) {
    const p = idx.get(monthKey(t.occurredOn))
    if (!p) continue
    if (t.type === 'income') p.income += t.amount
    else p.expense += t.amount
  }
  return points
}

/** Potrošeno po kategoriji za tekući mesec (za budžet progress). */
export function spentThisMonthByCategory(
  txs: Transaction[],
): Map<string, number> {
  const mk = monthKey(today())
  const map = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    if (!t.occurredOn.startsWith(mk)) continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return map
}
