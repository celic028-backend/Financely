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
 * Redovi su uvek keširani pod LOCAL_USER; pravi userId dobijaju tek pri
 * slanju na Supabase (sync.ts). Izolacija naloga: bindUser briše lokalne
 * podatke kad se na uređaj uloguje drugi korisnik.
 */
export const LOCAL_USER = 'local-user'

/** Tabele koje se sinhronizuju sa Supabase-om. */
export type SyncTable =
  | 'profiles'
  | 'categories'
  | 'transactions'
  | 'recurring_items'
  | 'savings_goals'
  | 'savings_entries'

/** Red u redu čekanja za slanje. Payload se ne snima — flush čita
 *  trenutno stanje reda iz Dexie (prirodno spajanje brzih izmena). */
export interface OutboxEntry {
  seq?: number
  table: SyncTable
  op: 'upsert' | 'delete'
  rowId: string
  queuedAt: string
}

export interface MetaEntry {
  key: string
  value: string
}

class FinancelyDB extends Dexie {
  profile!: EntityTable<Profile, 'userId'>
  categories!: EntityTable<Category, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  recurringItems!: EntityTable<RecurringItem, 'id'>
  savingsGoals!: EntityTable<SavingsGoal, 'id'>
  savingsEntries!: EntityTable<SavingsEntry, 'id'>
  outbox!: EntityTable<OutboxEntry, 'seq'>
  meta!: EntityTable<MetaEntry, 'key'>

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
    this.version(2).stores({
      profile: 'userId',
      categories: 'id, type, isActive, sort',
      transactions: 'id, occurredOn, type, categoryId, createdAt',
      recurringItems: 'id, kind, active',
      savingsGoals: 'id',
      savingsEntries: 'id, createdAt',
      outbox: '++seq, [table+rowId]',
      meta: 'key',
    })
  }
}

export const db = new FinancelyDB()

/** Sve tabele sa podacima (bez outbox/meta) — za wipe pri promeni naloga. */
export const DATA_TABLES = [
  db.profile,
  db.categories,
  db.transactions,
  db.recurringItems,
  db.savingsGoals,
  db.savingsEntries,
] as const

/** Napravi id (koristi crypto.randomUUID kad je dostupan). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function getMeta(key: string): Promise<string | null> {
  const row = await db.meta.get(key)
  return row?.value ?? null
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}

/** Ubaci profil + podrazumevane kategorije + primanja (svež uređaj/nalog). */
export async function seedLocalDefaults(): Promise<void> {
  const existing = await db.profile.get(LOCAL_USER)
  if (existing) return

  await db.transaction(
    'rw',
    db.profile,
    db.categories,
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
          notifyDue: true,
          notifyGoal: true,
          notifyDaily: false,
          notifyMonthly: true,
          lastLeftoverHandledMonth: null,
        },
      })
      const cats = seedCategoriesForUser(LOCAL_USER)
      await db.categories.bulkPut(cats)
      // Ponavljanja se ne seed-uju — korisnik ih sam dodaje (prazno + hint).
    },
  )
}
