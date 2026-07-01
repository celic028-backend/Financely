import { useMemo, useRef, useState } from 'react'
import { Sparkles, Send, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react'
import { useAllCategories, useProfile, useTransactions } from '../hooks/useData'
import { buildInsight, type Insight } from '../lib/insights'
import { localAnswer } from '../lib/localChat'
import { haptic } from '../lib/haptics'

interface Msg {
  role: 'user' | 'ai'
  text: string
}

export default function Assistant() {
  const txs = useTransactions()
  const cats = useAllCategories()
  const profile = useProfile()
  const [nonce, setNonce] = useState(0)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const insight = useMemo<Insight | null>(() => {
    if (!txs || !cats) return null
    // nonce koristi da "Analiziraj ponovo" ima efekta i kad se AI uveže
    void nonce
    return buildInsight(txs, cats)
  }, [txs, cats, nonce])

  function send() {
    const q = input.trim()
    if (!q || !txs || !cats || !profile) return
    const answer = localAnswer(q, txs, cats, profile.startingBalance)
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: answer }])
    setInput('')
    haptic(8)
    requestAnimationFrame(() => {
      const main = listRef.current?.closest('main')
      main?.scrollTo({ top: main.scrollHeight, behavior: 'smooth' })
    })
  }

  const suggestions = ['Koliko imam?', 'Mogu li da priuštim 10.000?', 'Koliko sam potrošio na hranu?']

  return (
    <div className="safe-top">
      <header className="flex items-center gap-2 py-4">
        <div className="brand-bg flex h-9 w-9 items-center justify-center rounded-xl text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Saveti</h1>
      </header>

      {/* Mesečni izveštaj */}
      {insight && (
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
              haptic(8)
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white py-2.5 text-[13px] font-semibold text-[var(--color-brand)] active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" />
            Analiziraj ponovo
          </button>
        </section>
      )}

      {/* Chat */}
      <section className="flex flex-col">
        <h2 className="mb-2 text-[15px] font-semibold">Pitaj me nešto</h2>

        <div ref={listRef} className="mb-3 space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s)
                  }}
                  className="rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 text-[13px] text-[var(--color-ink-muted)] active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--color-brand)', color: '#fff' }
                      : { background: 'var(--color-surface)', border: '1px solid var(--color-line)' }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-1.5 pl-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Napiši ili izgovori pitanje…"
            className="min-w-0 flex-1 bg-transparent text-[14px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim()}
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

function ToneIcon({ tone }: { tone: Insight['tone'] }) {
  if (tone === 'warn')
    return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
  return <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
}

function gradientFor(tone: Insight['tone']): string {
  if (tone === 'good') return 'linear-gradient(130deg, #16a34a, #06b6d4)'
  if (tone === 'warn') return 'linear-gradient(130deg, #f43f5e, #f59e0b)'
  return 'linear-gradient(130deg, #4f46e5, #06b6d4)'
}
