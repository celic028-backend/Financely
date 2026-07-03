import { LOCAL_USER, type SyncTable } from './db'
import type {
  Category,
  Transaction,
  RecurringItem,
  SavingsGoal,
  SavingsEntry,
  Profile,
} from './types'

/**
 * Mapiranje lokalnih redova (camelCase, userId=LOCAL_USER) na Supabase
 * redove (snake_case, pravi user_id) i nazad. Jedino mesto gde se
 * imena kolona prevode — flush i pull dele iste mapere.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

export function toRow(table: SyncTable, local: AnyRow, userId: string): AnyRow {
  switch (table) {
    case 'profiles': {
      const p = local as Profile
      return {
        user_id: userId,
        currency: p.currency,
        starting_balance: p.startingBalance,
        locale: p.locale,
        streak_count: p.settings.streakCount,
        last_entry_date: p.settings.lastEntryDate ?? null,
        remind_budget: p.settings.remindBudget,
        remind_income: p.settings.remindIncome,
        haptic_on: p.settings.hapticOn,
        notify_due: p.settings.notifyDue ?? true,
        notify_goal: p.settings.notifyGoal ?? true,
        notify_daily: p.settings.notifyDaily ?? false,
        notify_monthly: p.settings.notifyMonthly ?? true,
        last_leftover_handled_month: p.settings.lastLeftoverHandledMonth ?? null,
        onboarded_at: p.settings.onboardedAt ?? null,
        theme: p.settings.theme ?? 'auto',
        display_name: p.settings.displayName ?? null,
        updated_at: new Date().toISOString(),
      }
    }
    case 'categories': {
      const c = local as Category
      return {
        id: c.id,
        user_id: userId,
        name: c.name,
        type: c.type,
        income_kind: c.incomeKind ?? null,
        icon: c.icon,
        color: c.color,
        monthly_budget: c.monthlyBudget ?? null,
        is_active: c.isActive,
        sort: c.sort,
      }
    }
    case 'transactions': {
      const t = local as Transaction
      return {
        id: t.id,
        user_id: userId,
        amount: t.amount,
        type: t.type,
        category_id: t.categoryId,
        income_kind: t.incomeKind ?? null,
        description: t.description ?? null,
        occurred_on: t.occurredOn,
        created_at: t.createdAt,
      }
    }
    case 'recurring_items': {
      const r = local as RecurringItem
      return {
        id: r.id,
        user_id: userId,
        kind: r.kind,
        name: r.name,
        amount: r.amount ?? null,
        category_id: r.categoryId,
        schedule: r.schedule,
        income_kind: r.incomeKind ?? null,
        active: r.active,
      }
    }
    case 'savings_goals': {
      const g = local as SavingsGoal
      return {
        id: g.id,
        user_id: userId,
        target_amount: g.targetAmount,
        target_date: g.targetDate ?? null,
        current_saved: g.currentSaved,
        mode: g.mode ?? 'percent',
        rate: g.rate ?? 0,
        fixed_amount: g.fixedAmount ?? 0,
      }
    }
    case 'savings_entries': {
      const e = local as SavingsEntry
      return {
        id: e.id,
        user_id: userId,
        amount: e.amount,
        source: e.source,
        created_at: e.createdAt,
      }
    }
  }
}

export function fromRow(table: SyncTable, remote: AnyRow): AnyRow {
  switch (table) {
    case 'profiles':
      return {
        userId: LOCAL_USER,
        currency: remote.currency,
        startingBalance: remote.starting_balance,
        locale: remote.locale,
        settings: {
          streakCount: remote.streak_count,
          lastEntryDate: remote.last_entry_date,
          remindBudget: remote.remind_budget,
          remindIncome: remote.remind_income,
          hapticOn: remote.haptic_on,
          notifyDue: remote.notify_due ?? true,
          notifyGoal: remote.notify_goal ?? true,
          notifyDaily: remote.notify_daily ?? false,
          notifyMonthly: remote.notify_monthly ?? true,
          lastLeftoverHandledMonth: remote.last_leftover_handled_month,
          onboardedAt: remote.onboarded_at,
          theme: remote.theme ?? 'auto',
          displayName: remote.display_name ?? null,
        },
      } satisfies Profile
    case 'categories':
      return {
        id: remote.id,
        userId: LOCAL_USER,
        name: remote.name,
        type: remote.type,
        incomeKind: remote.income_kind,
        icon: remote.icon,
        color: remote.color,
        monthlyBudget: remote.monthly_budget,
        isActive: remote.is_active,
        sort: remote.sort,
      } satisfies Category
    case 'transactions':
      return {
        id: remote.id,
        userId: LOCAL_USER,
        amount: remote.amount,
        type: remote.type,
        categoryId: remote.category_id,
        incomeKind: remote.income_kind,
        description: remote.description,
        occurredOn: remote.occurred_on,
        createdAt: remote.created_at,
      } satisfies Transaction
    case 'recurring_items':
      return {
        id: remote.id,
        userId: LOCAL_USER,
        kind: remote.kind,
        name: remote.name,
        amount: remote.amount,
        categoryId: remote.category_id,
        schedule: remote.schedule,
        incomeKind: remote.income_kind,
        active: remote.active,
      } satisfies RecurringItem
    case 'savings_goals':
      return {
        id: remote.id,
        userId: LOCAL_USER,
        targetAmount: remote.target_amount,
        targetDate: remote.target_date,
        currentSaved: remote.current_saved,
        mode: remote.mode ?? 'percent',
        rate: remote.rate ?? 0,
        fixedAmount: remote.fixed_amount ?? 0,
      } satisfies SavingsGoal
    case 'savings_entries':
      return {
        id: remote.id,
        userId: LOCAL_USER,
        amount: remote.amount,
        source: remote.source,
        createdAt: remote.created_at,
      } satisfies SavingsEntry
  }
}
