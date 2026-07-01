import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { computeTotals, GOAL_ID } from '../lib/repo'
import { computeReminders, type Reminder } from '../lib/recurring'
import { monthKey, today } from '../lib/format'
import type { Category, RecurringItem, SavingsGoal, Transaction } from '../lib/types'

export function useProfile() {
  return useLiveQuery(() => db.profile.toArray().then((r) => r[0]))
}

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() =>
    db.categories
      .filter((c) => c.isActive)
      .toArray()
      .then((r) => r.sort((a, b) => a.sort - b.sort)),
  )
}

/** Sve kategorije (uklj. neaktivne) za podešavanja. */
export function useAllCategories(): Category[] | undefined {
  return useLiveQuery(() =>
    db.categories.toArray().then((r) => r.sort((a, b) => a.sort - b.sort)),
  )
}

export function useCategoryMap(): Map<string, Category> {
  const cats = useLiveQuery(() => db.categories.toArray())
  const map = new Map<string, Category>()
  if (cats) for (const c of cats) map.set(c.id, c)
  return map
}

/** Sve transakcije, najnovije prvo (po datumu pa vremenu unosa). */
export function useTransactions(): Transaction[] | undefined {
  return useLiveQuery(() =>
    db.transactions.toArray().then((r) =>
      r.sort((a, b) => {
        if (a.occurredOn !== b.occurredOn)
          return a.occurredOn < b.occurredOn ? 1 : -1
        return a.createdAt < b.createdAt ? 1 : -1
      }),
    ),
  )
}

export function useTotals() {
  const profile = useProfile()
  const txs = useTransactions()
  if (!profile || !txs) return undefined
  return computeTotals(profile.startingBalance, txs, monthKey(today()))
}

export function useRecurring(): RecurringItem[] | undefined {
  return useLiveQuery(() => db.recurringItems.toArray())
}

export function useSavingsGoal(): SavingsGoal | undefined {
  return useLiveQuery(() => db.savingsGoals.get(GOAL_ID))
}

export function useReminders(): Reminder[] {
  const items = useRecurring()
  const txs = useTransactions()
  if (!items || !txs) return []
  return computeReminders(items, txs, today())
}
