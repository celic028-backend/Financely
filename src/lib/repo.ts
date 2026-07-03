import { db, LOCAL_USER, newId } from './db'
import { enqueue, flushNow } from './sync'
import { today, monthKey } from './format'
import type {
  Category,
  Transaction,
  TxType,
  IncomeKind,
  Profile,
  SavingsGoal,
  SavingsEntry,
  SavingsMode,
} from './types'

export const GOAL_ID = 'goal'

// ---------- Transakcije ----------

export interface NewTxInput {
  amount: number
  type: TxType
  categoryId: string
  incomeKind?: IncomeKind | null
  description?: string | null
  occurredOn?: string
}

export async function addTransaction(input: NewTxInput): Promise<Transaction> {
  const tx: Transaction = {
    id: newId(),
    userId: LOCAL_USER,
    amount: Math.round(Math.abs(input.amount)),
    type: input.type,
    categoryId: input.categoryId,
    incomeKind: input.incomeKind ?? null,
    description: input.description?.trim() || null,
    occurredOn: input.occurredOn || today(),
    createdAt: new Date().toISOString(),
  }
  await db.transaction('rw', db.transactions, db.profile, db.savingsGoals, db.savingsEntries, db.outbox, async () => {
    await db.transactions.put(tx)
    await enqueue('transactions', 'upsert', tx.id)
    await bumpStreak()
    if (tx.type === 'income') await autoSaveOnIncome(tx)
  })
  flushNow()
  return tx
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  if (patch.amount != null) patch.amount = Math.round(Math.abs(patch.amount))
  await db.transaction('rw', db.transactions, db.outbox, async () => {
    await db.transactions.update(id, patch)
    await enqueue('transactions', 'upsert', id)
  })
  flushNow()
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction('rw', db.transactions, db.outbox, async () => {
    await db.transactions.delete(id)
    await enqueue('transactions', 'delete', id)
  })
  flushNow()
}

// ---------- Profil ----------

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  await db.transaction('rw', db.profile, db.outbox, async () => {
    const p = await db.profile.get(LOCAL_USER)
    if (!p) return
    await db.profile.put({ ...p, ...patch })
    await enqueue('profiles', 'upsert', LOCAL_USER)
  })
  flushNow()
}

export async function setStartingBalance(amount: number): Promise<void> {
  await updateProfile({ startingBalance: Math.round(amount) })
}

export async function adjustBalanceTo(realBalance: number): Promise<void> {
  const profile = await db.profile.get(LOCAL_USER)
  if (!profile) return
  const txs = await db.transactions.toArray()
  const currentBalance = computeBalance(profile.startingBalance, txs)
  const diff = Math.round(realBalance) - currentBalance
  await updateProfile({ startingBalance: profile.startingBalance + diff })
}

/** Streak: uvećaj ako je prvi unos danas; resetuj ako je preskočen dan.
 *  Zove se unutar transakcije addTransaction (deli outbox enqueue). */
async function bumpStreak(): Promise<void> {
  const p = await db.profile.get(LOCAL_USER)
  if (!p) return
  const t = today()
  const last = p.settings.lastEntryDate
  if (last === t) return // već brojano danas

  let streak = p.settings.streakCount
  if (last) {
    const diff = daysBetween(last, t)
    streak = diff === 1 ? streak + 1 : 1
  } else {
    streak = 1
  }
  await db.profile.put({
    ...p,
    settings: { ...p.settings, streakCount: streak, lastEntryDate: t },
  })
  await enqueue('profiles', 'upsert', LOCAL_USER)
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = new Date(ay, am - 1, ad).getTime()
  const db2 = new Date(by, bm - 1, bd).getTime()
  return Math.round((db2 - da) / 86400000)
}

// ---------- Kategorije ----------

export async function upsertCategory(cat: Category): Promise<void> {
  await db.transaction('rw', db.categories, db.outbox, async () => {
    await db.categories.put(cat)
    await enqueue('categories', 'upsert', cat.id)
  })
  flushNow()
}

export async function setCategoryBudget(
  id: string,
  budget: number | null,
): Promise<void> {
  await db.transaction('rw', db.categories, db.outbox, async () => {
    await db.categories.update(id, {
      monthlyBudget: budget == null ? null : Math.round(budget),
    })
    await enqueue('categories', 'upsert', id)
  })
  flushNow()
}

export async function deactivateCategory(id: string): Promise<void> {
  await db.transaction('rw', db.categories, db.outbox, async () => {
    await db.categories.update(id, { isActive: false })
    await enqueue('categories', 'upsert', id)
  })
  flushNow()
}

export async function reactivateCategory(id: string): Promise<void> {
  await db.transaction('rw', db.categories, db.outbox, async () => {
    await db.categories.update(id, { isActive: true })
    await enqueue('categories', 'upsert', id)
  })
  flushNow()
}

// ---------- Izvedene vrednosti ----------

export interface Totals {
  balance: number // ukupno stanje
  monthIncome: number
  monthExpense: number
  monthLeftover: number // prihodi - troškovi ovog meseca
}

export function computeTotals(
  startingBalance: number,
  txs: Transaction[],
  monthKey: string,
): Totals {
  let balance = startingBalance
  let monthIncome = 0
  let monthExpense = 0
  for (const t of txs) {
    if (t.type === 'income') balance += t.amount
    else balance -= t.amount
    if (t.occurredOn.startsWith(monthKey)) {
      if (t.type === 'income') monthIncome += t.amount
      else monthExpense += t.amount
    }
  }
  return {
    balance,
    monthIncome,
    monthExpense,
    monthLeftover: monthIncome - monthExpense,
  }
}

// ---------- Štednja ----------

export async function setSavingsGoal(
  mode: SavingsMode,
  value: number,
  targetAmount?: number,
  targetDate?: string | null,
): Promise<void> {
  await db.transaction('rw', db.savingsGoals, db.outbox, async () => {
    const existing = await db.savingsGoals.get(GOAL_ID)
    const goal: SavingsGoal = {
      id: GOAL_ID,
      userId: LOCAL_USER,
      targetAmount: targetAmount != null ? Math.round(targetAmount) : (existing?.targetAmount ?? 0),
      targetDate: targetDate !== undefined ? (targetDate ?? null) : (existing?.targetDate ?? null),
      currentSaved: existing?.currentSaved ?? 0,
      mode,
      rate: mode === 'percent' ? value : (existing?.rate ?? 0),
      fixedAmount: mode === 'fixed' ? Math.round(value) : (existing?.fixedAmount ?? 0),
    }
    await db.savingsGoals.put(goal)
    await enqueue('savings_goals', 'upsert', GOAL_ID)
  })
  flushNow()
}

export async function addToSavings(
  amount: number,
  source: SavingsEntry['source'],
): Promise<number> {
  const amt = Math.round(amount)
  if (amt <= 0) return 0
  let saved = 0
  const entry: SavingsEntry = {
    id: newId(),
    userId: LOCAL_USER,
    amount: amt,
    source,
    createdAt: new Date().toISOString(),
  }
  await db.transaction('rw', db.savingsEntries, db.savingsGoals, db.profile, db.transactions, db.outbox, async () => {
    const profile = await db.profile.get(LOCAL_USER)
    if (!profile) return
    const txs = await db.transactions.toArray()
    const balance = computeBalance(profile.startingBalance, txs)
    const goal = await db.savingsGoals.get(GOAL_ID)
    const currentSaved = goal?.currentSaved ?? 0
    const maxCanSave = Math.max(0, balance - currentSaved)
    const clamped = Math.min(amt, maxCanSave)
    if (clamped <= 0) return

    entry.amount = clamped
    saved = clamped
    await db.savingsEntries.put(entry)
    await enqueue('savings_entries', 'upsert', entry.id)
    if (goal) {
      await db.savingsGoals.put({ ...goal, currentSaved: currentSaved + clamped })
    } else {
      await db.savingsGoals.put({
        id: GOAL_ID, userId: LOCAL_USER,
        targetAmount: 0, targetDate: null, currentSaved: clamped,
        mode: 'percent', rate: 0, fixedAmount: 0,
      })
    }
    await enqueue('savings_goals', 'upsert', GOAL_ID)
  })
  flushNow()
  return saved
}

export async function withdrawFromSavings(amount: number): Promise<void> {
  const amt = Math.round(amount)
  if (amt <= 0) return
  await db.transaction('rw', db.savingsEntries, db.savingsGoals, db.outbox, async () => {
    const goal = await db.savingsGoals.get(GOAL_ID)
    if (!goal || goal.currentSaved <= 0) return
    const withdrawn = Math.min(amt, goal.currentSaved)
    const entry: SavingsEntry = {
      id: newId(), userId: LOCAL_USER,
      amount: -withdrawn, source: 'withdraw',
      createdAt: new Date().toISOString(),
    }
    await db.savingsEntries.put(entry)
    await enqueue('savings_entries', 'upsert', entry.id)
    await db.savingsGoals.put({ ...goal, currentSaved: goal.currentSaved - withdrawn })
    await enqueue('savings_goals', 'upsert', GOAL_ID)
  })
  flushNow()
}

async function autoSaveOnIncome(tx: Transaction): Promise<void> {
  const goal = await db.savingsGoals.get(GOAL_ID)
  if (!goal || (goal.mode === 'percent' && goal.rate <= 0) || (goal.mode === 'fixed' && goal.fixedAmount <= 0)) return

  let contribution: number
  if (goal.mode === 'percent') {
    contribution = Math.round(tx.amount * goal.rate)
  } else {
    const mk = tx.occurredOn.slice(0, 7)
    const entries = await db.savingsEntries.toArray()
    const savedThisMonth = entries
      .filter((e) => e.source === 'auto' && e.createdAt.slice(0, 7) === mk)
      .reduce((s, e) => s + e.amount, 0)
    contribution = Math.max(0, goal.fixedAmount - savedThisMonth)
  }
  if (contribution <= 0) return

  const profile = await db.profile.get(LOCAL_USER)
  if (!profile) return
  const txs = await db.transactions.toArray()
  const balance = computeBalance(profile.startingBalance, txs)
  const maxCanSave = Math.max(0, balance - goal.currentSaved)
  const clamped = Math.min(contribution, maxCanSave)
  if (clamped <= 0) return

  const entry: SavingsEntry = {
    id: newId(), userId: LOCAL_USER,
    amount: clamped, source: 'auto',
    createdAt: new Date().toISOString(),
  }
  await db.savingsEntries.put(entry)
  await enqueue('savings_entries', 'upsert', entry.id)
  await db.savingsGoals.put({ ...goal, currentSaved: goal.currentSaved + clamped })
  await enqueue('savings_goals', 'upsert', GOAL_ID)
}

function computeBalance(startingBalance: number, txs: Transaction[]): number {
  let balance = startingBalance
  for (const t of txs) {
    if (t.type === 'income') balance += t.amount
    else balance -= t.amount
  }
  return balance
}

// ---------- Izvedeni novčani model ----------

export interface MoneyState {
  balance: number
  savedTotal: number
  availableToSpend: number
  monthIncome: number
  monthExpense: number
  targetSaveThisMonth: number
  savedThisMonth: number
  onTrack: boolean
}

export function computeMoney(
  startingBalance: number,
  txs: Transaction[],
  goal: SavingsGoal | undefined,
  mk: string,
): MoneyState {
  let balance = startingBalance
  let monthIncome = 0
  let monthExpense = 0
  for (const t of txs) {
    if (t.type === 'income') balance += t.amount
    else balance -= t.amount
    if (t.occurredOn.startsWith(mk)) {
      if (t.type === 'income') monthIncome += t.amount
      else monthExpense += t.amount
    }
  }
  const savedTotal = goal?.currentSaved ?? 0
  const availableToSpend = balance - savedTotal

  let targetSaveThisMonth = 0
  if (goal) {
    targetSaveThisMonth = goal.mode === 'percent'
      ? Math.round(monthIncome * goal.rate)
      : goal.fixedAmount
  }

  return {
    balance,
    savedTotal,
    availableToSpend,
    monthIncome,
    monthExpense,
    targetSaveThisMonth,
    savedThisMonth: 0, // populated by hook with entries data
    onTrack: (monthIncome - monthExpense) >= targetSaveThisMonth,
  }
}

// ---------- Višak na kraju meseca ----------

export function previousMonthKey(mk: string): string {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return monthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
}

/** Neto (prihod - trošak) za dati mesec. */
export function monthNet(txs: Transaction[], mk: string): number {
  let net = 0
  for (const t of txs) {
    if (!t.occurredOn.startsWith(mk)) continue
    net += t.type === 'income' ? t.amount : -t.amount
  }
  return net
}

export async function markLeftoverHandled(month: string): Promise<void> {
  const p = await db.profile.get(LOCAL_USER)
  if (!p) return
  await updateProfile({
    settings: { ...p.settings, lastLeftoverHandledMonth: month },
  })
}
