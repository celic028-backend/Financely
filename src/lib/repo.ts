import { db, LOCAL_USER, newId } from './db'
import { today, monthKey } from './format'
import type {
  Category,
  Transaction,
  TxType,
  IncomeKind,
  Profile,
  SavingsGoal,
  SavingsEntry,
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
  await db.transactions.put(tx)
  await bumpStreak()
  return tx
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  if (patch.amount != null) patch.amount = Math.round(Math.abs(patch.amount))
  await db.transactions.update(id, patch)
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

// ---------- Profil ----------

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  const p = await db.profile.get(LOCAL_USER)
  if (!p) return
  await db.profile.put({ ...p, ...patch })
}

export async function setStartingBalance(amount: number): Promise<void> {
  await updateProfile({ startingBalance: Math.round(amount) })
}

/** Streak: uvećaj ako je prvi unos danas; resetuj ako je preskočen dan. */
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
  await db.categories.put(cat)
}

export async function setCategoryBudget(
  id: string,
  budget: number | null,
): Promise<void> {
  await db.categories.update(id, {
    monthlyBudget: budget == null ? null : Math.round(budget),
  })
}

export async function deactivateCategory(id: string): Promise<void> {
  await db.categories.update(id, { isActive: false })
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
  targetAmount: number,
  targetDate?: string | null,
): Promise<void> {
  const existing = await db.savingsGoals.get(GOAL_ID)
  const goal: SavingsGoal = {
    id: GOAL_ID,
    userId: LOCAL_USER,
    targetAmount: Math.round(targetAmount),
    targetDate: targetDate ?? null,
    currentSaved: existing?.currentSaved ?? 0,
  }
  await db.savingsGoals.put(goal)
}

export async function addToSavings(
  amount: number,
  source: SavingsEntry['source'],
): Promise<void> {
  const amt = Math.round(amount)
  if (amt === 0) return
  const entry: SavingsEntry = {
    id: newId(),
    userId: LOCAL_USER,
    amount: amt,
    source,
    createdAt: new Date().toISOString(),
  }
  await db.savingsEntries.put(entry)
  const goal = await db.savingsGoals.get(GOAL_ID)
  if (goal) {
    await db.savingsGoals.put({
      ...goal,
      currentSaved: Math.max(0, goal.currentSaved + amt),
    })
  } else {
    // Bez postavljenog cilja i dalje pratimo ukupno ušteđeno.
    await db.savingsGoals.put({
      id: GOAL_ID,
      userId: LOCAL_USER,
      targetAmount: 0,
      targetDate: null,
      currentSaved: Math.max(0, amt),
    })
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
  await db.profile.put({
    ...p,
    settings: { ...p.settings, lastLeftoverHandledMonth: month },
  })
}
