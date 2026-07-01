import Dexie, { type EntityTable } from 'dexie'
import type {
  Category,
  Transaction,
  RecurringItem,
  SavingsGoal,
  SavingsEntry,
  Profile,
} from './types'
import { seedCategoriesForUser } from './categories'

/**
 * Lokalna baza (IndexedDB preko Dexie) — offline-first sloj.
 * Kasnije se sinhronizuje sa Supabase-om; do tada koristimo LOCAL_USER.
 */
export const LOCAL_USER = 'local-user'

class FinancelyDB extends Dexie {
  profile!: EntityTable<Profile, 'userId'>
  categories!: EntityTable<Category, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  recurringItems!: EntityTable<RecurringItem, 'id'>
  savingsGoals!: EntityTable<SavingsGoal, 'id'>
  savingsEntries!: EntityTable<SavingsEntry, 'id'>

  constructor() {
    super('financely')
    this.version(1).stores({
      profile: 'userId',
      categories: 'id, type, isActive, sort',
      transactions: 'id, occurredOn, type, categoryId, createdAt',
      recurringItems: 'id, kind, active',
      savingsGoals: 'id',
      savingsEntries: 'id, createdAt',
    })
  }
}

export const db = new FinancelyDB()

/** Napravi id (koristi crypto.randomUUID kad je dostupan). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Prvi put: ubaci profil + podrazumevane kategorije ako baza je prazna. */
export async function bootstrap(): Promise<void> {
  const existing = await db.profile.get(LOCAL_USER)
  if (existing) return

  await db.transaction(
    'rw',
    db.profile,
    db.categories,
    db.recurringItems,
    async () => {
      await db.profile.put({
        userId: LOCAL_USER,
        currency: 'RSD',
        startingBalance: 0,
        locale: 'sr',
        settings: {
          streakCount: 0,
          lastEntryDate: null,
          remindBudget: true,
          remindIncome: true,
          hapticOn: true,
          lastLeftoverHandledMonth: null,
        },
      })
      const cats = seedCategoriesForUser(LOCAL_USER)
      await db.categories.bulkPut(cats)
      await db.recurringItems.bulkPut(seedRecurring())
    },
  )
}

/** Podrazumevana ponavljajuća primanja korisnika. */
function seedRecurring(): RecurringItem[] {
  return [
    {
      id: 'rec-stipendija',
      userId: LOCAL_USER,
      kind: 'income',
      name: 'Stipendija',
      amount: null, // varira
      categoryId: 'inc-stipendija',
      schedule: 'last_thursday',
      incomeKind: 'fixed',
      active: true,
    },
    {
      id: 'rec-fiksno',
      userId: LOCAL_USER,
      kind: 'income',
      name: 'Fiksna uplata',
      amount: 33000,
      categoryId: 'inc-fiksno',
      schedule: 'day:10',
      incomeKind: 'fixed',
      active: true,
    },
  ]
}
