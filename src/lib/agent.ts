import { supabase } from './supabase'
import { smartParseLocal } from './smartParse'
import { localAnswer } from './localChat'
import { formatRsd, today, parseDay, toDay } from './format'
import type { Category, Transaction, Profile, TxType } from './types'

/** Poruka u razgovoru sa agentom. */
export interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

/** Strukturisana namera koju korisnik potvrđuje pre upisa. */
export interface AddTxAction {
  kind: 'add_transaction'
  amount: number
  type: TxType
  categoryId: string
  description: string | null
  occurredOn: string
}

export interface SuggestBudgetsAction {
  kind: 'suggest_budgets'
  suggestions: { categoryId: string; monthlyBudget: number }[]
}

export type AgentAction = AddTxAction | SuggestBudgetsAction

export interface AgentReply {
  reply: string
  actions: AgentAction[]
  source: 'claude' | 'local'
}

interface RawAction {
  tool: string
  input: Record<string, unknown>
}

/**
 * Pošalji poruku agentu. Prvo pokušava Claude (edge function); ako ključ
 * nije podešen ili je mreža pala, lokalni fallback daje isti oblik
 * odgovora (smartParse za unos, localAnswer za pitanja).
 */
export async function askAgent(
  history: ChatMsg[],
  context: string,
  cats: Category[],
  txs: Transaction[],
  profile: Profile,
): Promise<AgentReply> {
  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content ?? ''

  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages: history, context },
    })
    if (error || data?.error) throw new Error(data?.error ?? 'invoke failed')

    const actions = validateActions((data.actions ?? []) as RawAction[], cats)
    return { reply: data.reply || defaultReply(actions), actions, source: 'claude' }
  } catch {
    return localAgent(lastUser, cats, txs, profile)
  }
}

/** Validiraj Claude akcije: kategorija postoji + tip se slaže + iznos > 0. */
function validateActions(raw: RawAction[], cats: Category[]): AgentAction[] {
  const out: AgentAction[] = []
  for (const a of raw) {
    if (a.tool === 'add_transaction') {
      const amount = Math.round(Number(a.input.amount))
      const type = a.input.type as TxType
      const categoryId = String(a.input.category_id ?? '')
      const cat = cats.find((c) => c.id === categoryId)
      if (!Number.isFinite(amount) || amount <= 0) continue
      if (type !== 'expense' && type !== 'income') continue
      if (!cat || cat.type !== type) continue
      out.push({
        kind: 'add_transaction',
        amount,
        type,
        categoryId,
        description: a.input.description ? String(a.input.description) : null,
        occurredOn: validDate(a.input.occurred_on) ?? today(),
      })
    } else if (a.tool === 'suggest_budgets') {
      const list = Array.isArray(a.input.suggestions) ? a.input.suggestions : []
      const suggestions = list
        .map((s: Record<string, unknown>) => ({
          categoryId: String(s.category_id ?? ''),
          monthlyBudget: Math.round(Number(s.monthly_budget)),
        }))
        .filter(
          (s) =>
            s.monthlyBudget > 0 &&
            cats.some((c) => c.id === s.categoryId && c.type === 'expense'),
        )
      if (suggestions.length) out.push({ kind: 'suggest_budgets', suggestions })
    }
  }
  return out
}

function validDate(v: unknown): string | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const d = parseDay(v)
  if (Number.isNaN(d.getTime())) return null
  const day = toDay(d)
  return day <= today() ? day : today()
}

function defaultReply(actions: AgentAction[]): string {
  const tx = actions.find((a) => a.kind === 'add_transaction')
  if (tx && tx.kind === 'add_transaction') {
    return `Da dodam ${formatRsd(tx.amount)}?`
  }
  return 'Evo predloga.'
}

/** Lokalni agent bez API ključa: parser za unos, localAnswer za pitanja. */
function localAgent(
  question: string,
  cats: Category[],
  txs: Transaction[],
  profile: Profile,
): AgentReply {
  const parsed = smartParseLocal(question, cats)
  if (parsed.amount != null && parsed.categoryId) {
    const cat = cats.find((c) => c.id === parsed.categoryId)
    const action: AddTxAction = {
      kind: 'add_transaction',
      amount: parsed.amount,
      type: parsed.type,
      categoryId: parsed.categoryId,
      description: parsed.description ?? null,
      occurredOn: parsed.occurredOn ?? today(),
    }
    return {
      reply: `Da dodam ${formatRsd(parsed.amount)} — ${cat?.name ?? 'Ostalo'}?`,
      actions: [action],
      source: 'local',
    }
  }
  return {
    reply: localAnswer(question, txs, cats, profile.startingBalance),
    actions: [],
    source: 'local',
  }
}
