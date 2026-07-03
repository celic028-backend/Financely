import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Send,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Loader2,
  Mic,
  Check,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAllCategories, useProfile, useTransactions, useCategoryMap } from '../hooks/useData'
import { useVoice } from '../hooks/useVoice'
import { buildInsight, type Insight } from '../lib/insights'
import { hapticIfOn } from '../lib/haptics'
import { askAgent, type AgentAction, type ChatMsg, type AddTxAction } from '../lib/agent'
import { addTransaction, setCategoryBudget, computeTotals } from '../lib/repo'
import { CategoryIcon } from '../components/CategoryIcon'
import {
  formatRsd,
  formatNumber,
  formatDayRelative,
  monthKey,
  today,
} from '../lib/format'
import type { Category, Transaction, Profile } from '../lib/types'

interface UiMsg {
  role: 'user' | 'ai'
  text: string
  actions?: AgentAction[]
  /** Ishod po indeksu akcije: 'done' | 'cancelled'. */
  outcomes?: Record<number, 'done' | 'cancelled'>
}

const CHAT_KEY = 'financely-chat'

function buildContext(
  txs: Transaction[],
  cats: Category[],
  profile: Profile,
): string {
  const mk = monthKey(today())
  const totals = computeTotals(profile.startingBalance, txs, mk)

  const monthTxs = txs.filter((t) => t.occurredOn.startsWith(mk))
  const catMap = new Map(cats.map((c) => [c.id, c]))

  const expByCat = new Map<string, number>()
  for (const t of monthTxs) {
    if (t.type !== 'expense') continue
    const name = catMap.get(t.categoryId)?.name ?? 'Ostalo'
    expByCat.set(name, (expByCat.get(name) ?? 0) + t.amount)
  }

  const catLines = [...expByCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amt]) => `  - ${name}: ${formatNumber(amt)} din`)
    .join('\n')

  const activeCats = cats
    .filter((c) => c.isActive)
    .map((c) => `${c.id}=${c.name} (${c.type})`)
    .join(', ')

  return `Ukupno stanje: ${formatRsd(totals.balance)}
Ovaj mesec prihodi: ${formatRsd(totals.monthIncome)}
Ovaj mesec troškovi: ${formatRsd(totals.monthExpense)}
Ovaj mesec ostaje: ${formatRsd(totals.monthLeftover)}
Valuta: RSD (srpski dinar)

Kategorije (id=ime): ${activeCats}

Troškovi po kategoriji ovog meseca:
${catLines || '  (nema troškova)'}

Poslednjih 5 transakcija:
${txs.slice(0, 5).map((t) => `  - ${t.occurredOn}: ${t.type === 'income' ? '+' : '-'}${formatNumber(t.amount)} din (${catMap.get(t.categoryId)?.name ?? '?'})${t.description ? ` — ${t.description}` : ''}`).join('\n') || '  (nema)'}`
}

function loadChat(): UiMsg[] {
  try {
    const raw = sessionStorage.getItem(CHAT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function Assistant() {
  const txs = useTransactions()
  const cats = useAllCategories()
  const catMap = useCategoryMap()
  const profile = useProfile()
  const [nonce, setNonce] = useState(0)
  const [messages, setMessages] = useState<UiMsg[]>(loadChat)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      // sessionStorage pun/nedostupan — istorija ostaje samo u memoriji
    }
  }, [messages])

  const insight = useMemo<Insight | null>(() => {
    if (!txs || !cats) return null
    void nonce
    return buildInsight(txs, cats)
  }, [txs, cats, nonce])

  const voice = useVoice((text) => {
    void send(text)
  })

  async function send(forcedText?: string) {
    const q = (forcedText ?? input).trim()
    if (!q || loading || !txs || !cats || !profile) return
    const newMsgs: UiMsg[] = [...messages, { role: 'user', text: q }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    hapticIfOn(8)
    scrollDown()

    // Istorija za API: poslednjih 12 poruka, ai → assistant
    const history: ChatMsg[] = newMsgs.slice(-12).map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }))

    const res = await askAgent(history, buildContext(txs, cats, profile), cats, txs, profile)
    setMessages((m) => [
      ...m,
      { role: 'ai', text: res.reply, actions: res.actions.length ? res.actions : undefined },
    ])
    setLoading(false)
    scrollDown()
  }

  async function confirmAction(msgIdx: number, actionIdx: number, action: AgentAction) {
    if (action.kind === 'add_transaction') {
      const cat = catMap.get(action.categoryId)
      await addTransaction({
        amount: action.amount,
        type: action.type,
        categoryId: action.categoryId,
        incomeKind: action.type === 'income' ? (cat?.incomeKind ?? 'extra') : null,
        description: action.description,
        occurredOn: action.occurredOn,
      })
      hapticIfOn([10, 30, 10])
    } else {
      for (const s of action.suggestions) {
        await setCategoryBudget(s.categoryId, s.monthlyBudget)
      }
      hapticIfOn([10, 30, 10])
    }
    markOutcome(msgIdx, actionIdx, 'done')
  }

  function markOutcome(msgIdx: number, actionIdx: number, outcome: 'done' | 'cancelled') {
    setMessages((m) =>
      m.map((msg, i) =>
        i === msgIdx
          ? { ...msg, outcomes: { ...(msg.outcomes ?? {}), [actionIdx]: outcome } }
          : msg,
      ),
    )
  }

  function scrollDown() {
    requestAnimationFrame(() => {
      const main = listRef.current?.closest('main')
      main?.scrollTo({ top: main.scrollHeight, behavior: 'smooth' })
    })
  }

  const suggestions = [
    'Potrošio sam 500 na kafu',
    'Koliko imam?',
    'Gde najviše trošim?',
    'Kako da uštedim?',
  ]

  return (
    <div className="safe-top">
      <header className="flex items-center gap-2 py-4">
        <div className="brand-bg flex h-9 w-9 items-center justify-center rounded-xl text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Asistent</h1>
          <p className="text-[11px] text-[var(--color-ink-muted)]">Tvoj AI asistent · Claude</p>
        </div>
      </header>

      {/* Mesečni izveštaj */}
      {insight && messages.length === 0 && (
        <section className="mb-4">
          <div
            className="rounded-[var(--radius-2xl)] p-5 text-white"
            style={{ background: gradientFor(insight.tone) }}
          >
            <div className="flex items-start gap-2">
              <ToneIcon tone={insight.tone} />
              <p className="text-[17px] font-bold leading-snug">{insight.headline}</p>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-white/90">{insight.summary}</p>
          </div>

          <div className="mt-3 space-y-3">
            {insight.comparison && (
              <div className="card flex items-start gap-2.5 p-3.5">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
                <p className="text-[13px] leading-relaxed">{insight.comparison}</p>
              </div>
            )}

            {insight.tips.map((tip, i) => (
              <div key={i} className="card flex items-start gap-2.5 p-3.5">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warn)]" />
                <p className="text-[13px] leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setNonce((n) => n + 1)
              hapticIfOn(8)
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] py-2.5 text-[13px] font-semibold text-[var(--color-brand)] active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" />
            Analiziraj ponovo
          </button>
        </section>
      )}

      {/* Chat */}
      <section className="flex flex-col pb-2">
        <h2 className="mb-2 text-[15px] font-semibold">
          {messages.length === 0 ? 'Pitaj me ili reci šta si potrošio' : 'Razgovor'}
        </h2>

        <div ref={listRef} className="mb-3 space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] text-[var(--color-ink-muted)] active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i}>
                <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed"
                    style={
                      m.role === 'user'
                        ? { background: 'var(--color-brand)', color: '#fff' }
                        : {
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-line)',
                          }
                    }
                  >
                    {m.text}
                  </div>
                </div>
                {m.actions?.map((a, ai) => (
                  <ActionCard
                    key={ai}
                    action={a}
                    category={
                      a.kind === 'add_transaction' ? catMap.get(a.categoryId) : undefined
                    }
                    catMap={catMap}
                    outcome={m.outcomes?.[ai]}
                    onConfirm={() => confirmAction(i, ai, a)}
                    onCancel={() => markOutcome(i, ai, 'cancelled')}
                  />
                ))}
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px] text-[var(--color-ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Razmišljam…
              </div>
            </div>
          )}
        </div>

        {/* Status glasa */}
        {(voice.recording || voice.transcribing) && (
          <p className="mb-2 px-1 text-[13px] italic text-[var(--color-ink-faint)]">
            {voice.recording ? 'Snimam… tapni mikrofon da završiš' : 'Prepisujem…'}
          </p>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 pl-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Napiši ili reci šta te zanima…"
            className="min-w-0 flex-1 bg-transparent text-[14px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
          />
          {voice.supported && (
            <motion.button
              type="button"
              onClick={() => (voice.recording ? voice.stop() : voice.start())}
              disabled={voice.transcribing}
              aria-label={voice.recording ? 'Zaustavi snimanje' : 'Reci naglas'}
              animate={voice.recording ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={
                voice.recording ? { repeat: Infinity, duration: 1.1 } : undefined
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-[var(--shadow-card)]"
              style={{
                background: voice.recording
                  ? 'var(--color-expense)'
                  : 'var(--color-brand)',
              }}
            >
              {voice.transcribing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </motion.button>
          )}
          <button
            type="button"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Pošalji"
            className="brand-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        </div>
      </section>
    </div>
  )
}

function ActionCard({
  action,
  category,
  catMap,
  outcome,
  onConfirm,
  onCancel,
}: {
  action: AgentAction
  category?: Category
  catMap: Map<string, Category>
  outcome?: 'done' | 'cancelled'
  onConfirm: () => void
  onCancel: () => void
}) {
  if (action.kind === 'suggest_budgets') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mt-2 p-3.5"
      >
        <p className="mb-2 text-[13px] font-semibold">Predlog budžeta:</p>
        <div className="space-y-1.5">
          {action.suggestions.map((s) => (
            <div key={s.categoryId} className="flex items-center justify-between text-[13px]">
              <span>{catMap.get(s.categoryId)?.name ?? s.categoryId}</span>
              <span className="tnum font-semibold">{formatRsd(s.monthlyBudget)}/mes</span>
            </div>
          ))}
        </div>
        <Outcome outcome={outcome} onConfirm={onConfirm} onCancel={onCancel} confirmLabel="Postavi budžete" />
      </motion.div>
    )
  }

  const a = action as AddTxAction
  const color = category?.color ?? '#94A3B8'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mt-2 flex items-center gap-3 p-3.5"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1A`, color }}
      >
        <CategoryIcon name={category?.icon ?? 'CircleEllipsis'} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">
          {category?.name ?? 'Ostalo'}
          {a.description ? ` · ${a.description}` : ''}
        </p>
        <p className="text-[12px] text-[var(--color-ink-muted)]">
          {formatDayRelative(a.occurredOn)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span
          className="tnum text-[15px] font-bold"
          style={{
            color: a.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
          }}
        >
          {a.type === 'income' ? '+' : '−'}
          {formatRsd(a.amount)}
        </span>
        <Outcome outcome={outcome} onConfirm={onConfirm} onCancel={onCancel} compact />
      </div>
    </motion.div>
  )
}

function Outcome({
  outcome,
  onConfirm,
  onCancel,
  confirmLabel = 'Potvrdi',
  compact = false,
}: {
  outcome?: 'done' | 'cancelled'
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  compact?: boolean
}) {
  if (outcome === 'done') {
    return (
      <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--color-income)]">
        <Check className="h-3.5 w-3.5" /> Dodato
      </span>
    )
  }
  if (outcome === 'cancelled') {
    return <span className="text-[12px] text-[var(--color-ink-faint)]">Otkazano</span>
  }
  return (
    <div className={compact ? 'flex gap-1.5' : 'mt-3 flex gap-2'}>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Otkaži"
        className={
          compact
            ? 'flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] active:scale-90'
            : 'flex-1 rounded-xl bg-[var(--color-surface-2)] py-2 text-[13px] font-semibold text-[var(--color-ink-muted)] active:scale-[0.98]'
        }
      >
        {compact ? <X className="h-4 w-4" /> : 'Otkaži'}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        aria-label={confirmLabel}
        className={
          compact
            ? 'brand-bg flex h-7 w-7 items-center justify-center rounded-lg text-white active:scale-90'
            : 'brand-bg flex-1 rounded-xl py-2 text-[13px] font-semibold text-white active:scale-[0.98]'
        }
      >
        {compact ? <Check className="h-4 w-4" strokeWidth={2.5} /> : confirmLabel}
      </button>
    </div>
  )
}

function ToneIcon({ tone }: { tone: Insight['tone'] }) {
  if (tone === 'warn') return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
  return <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
}

function gradientFor(tone: Insight['tone']): string {
  if (tone === 'good') return 'linear-gradient(130deg, #16a34a, #06b6d4)'
  if (tone === 'warn') return 'linear-gradient(130deg, #f43f5e, #f59e0b)'
  return 'linear-gradient(130deg, #4f46e5, #06b6d4)'
}
