// ---------- Tipovi podataka za Financely ----------

export type TxType = 'expense' | 'income'

/** Redovna primanja (stipendija, fiksno) vs zarada sa strane. */
export type IncomeKind = 'fixed' | 'extra'

export interface Category {
  id: string
  userId: string
  name: string
  type: TxType
  /** Samo za prihode: da li je redovno ili sa strane. */
  incomeKind?: IncomeKind | null
  icon: string // lucide ime ikonice
  color: string // hex
  monthlyBudget?: number | null // limit u dinarima (samo za troškove)
  isActive: boolean
  sort: number
}

export interface Transaction {
  id: string
  userId: string
  amount: number // uvek pozitivan ceo broj (dinari)
  type: TxType
  categoryId: string
  incomeKind?: IncomeKind | null
  description?: string | null
  occurredOn: string // YYYY-MM-DD
  createdAt: string // ISO
}

export type RecurringKind = 'bill' | 'income'

/** 'day:10' = svakog 10. u mesecu; 'last_thursday' = poslednji četvrtak. */
export type RecurringSchedule = `day:${number}` | 'last_thursday'

export interface RecurringItem {
  id: string
  userId: string
  kind: RecurringKind
  name: string
  amount?: number | null // null = varijabilno (npr. stipendija)
  categoryId: string
  schedule: RecurringSchedule
  incomeKind?: IncomeKind | null
  active: boolean
}

export interface SavingsGoal {
  id: string
  userId: string
  targetAmount: number
  targetDate?: string | null
  currentSaved: number
}

export interface SavingsEntry {
  id: string
  userId: string
  amount: number
  source: 'monthly_leftover' | 'manual'
  createdAt: string
}

export interface Profile {
  userId: string
  currency: string // 'RSD'
  startingBalance: number
  locale: string // 'sr'
  settings: ProfileSettings
}

export interface ProfileSettings {
  streakCount: number
  lastEntryDate?: string | null // YYYY-MM-DD
  remindBudget: boolean
  remindIncome: boolean
  hapticOn: boolean
  /** Poslednji mesec (YYYY-MM) za koji je višak obrađen (prebačen ili preskočen). */
  lastLeftoverHandledMonth?: string | null
}
