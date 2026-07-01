import { monthKey, today, formatNumber } from './format'
import { categoryBreakdown } from './analytics'
import type { Category, Transaction } from './types'

export interface Insight {
  headline: string // glavna poruka
  tone: 'good' | 'warn' | 'neutral'
  summary: string
  topCategory?: { name: string; amount: number; pct: number }
  comparison?: string // poređenje sa prošlim mesecom
  tips: string[] // konkretni saveti (iskreno, realno, uz podršku)
  savingsRate: number // % ušteđeno od prihoda
}

/** Mesec unazad od d8tog ključa: '2026-07' -> '2026-06' */
function prevMonthKey(mk: string): string {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return monthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
}

function monthSum(txs: Transaction[], mk: string) {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (!t.occurredOn.startsWith(mk)) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, net: income - expense }
}

/**
 * Lokalni „AI" motor: iskren i realan, ali sa podrškom.
 * (Zameniće ga pravi Claude izveštaj kad se doda API ključ.)
 */
export function buildInsight(
  txs: Transaction[],
  cats: Category[],
): Insight {
  const catMap = new Map(cats.map((c) => [c.id, c]))
  const mk = monthKey(today())
  const pm = prevMonthKey(mk)

  const cur = monthSum(txs, mk)
  const prev = monthSum(txs, pm)

  const curMonthTx = txs.filter((t) => t.occurredOn.startsWith(mk))
  const slices = categoryBreakdown(curMonthTx, catMap, 'expense')
  const top = slices[0]

  const savingsRate = cur.income > 0 ? Math.round((cur.net / cur.income) * 100) : 0

  const tips: string[] = []
  let headline = ''
  let tone: Insight['tone'] = 'neutral'
  let summary = ''

  if (cur.income === 0 && cur.expense === 0) {
    return {
      headline: 'Hajde da počnemo',
      tone: 'neutral',
      summary:
        'Još nema unosa za ovaj mesec. Čim uneseš par troškova i primanja, ovde ćeš dobiti jasnu sliku i konkretne savete.',
      tips: [
        'Unesi svaki trošak čim se desi — tako ništa ne zaboraviš.',
        'Postavi budžet za kategoriju u kojoj najviše grešiš.',
      ],
      savingsRate: 0,
    }
  }

  // Glavna poruka na osnovu bilansa
  if (cur.net > 0) {
    tone = 'good'
    headline = `Bravo — ovog meseca si u plusu ${formatNumber(cur.net)} din`
    summary = `Ušteđuješ oko ${savingsRate}% od onog što ti uđe. To je odličan temelj — ako nastaviš ovako, za par meseci ćeš imati pravu rezervu.`
  } else if (cur.net === 0) {
    tone = 'neutral'
    headline = 'Ovog meseca si na nuli'
    summary = 'Koliko uđe, toliko i izađe. Nije loše, ali da bi počeo da štediš, treba da nađemo gde da malo stisnemo.'
  } else {
    tone = 'warn'
    headline = `Pažnja — ovog meseca si u minusu ${formatNumber(Math.abs(cur.net))} din`
    summary = 'Trošiš više nego što zarađuješ. Nije kraj sveta, ali ovako se ušteđevina ne skuplja — hajde da vidimo šta možemo da smanjimo.'
  }

  // Najveća kategorija
  let topCategory
  if (top && top.category) {
    topCategory = { name: top.category.name, amount: top.total, pct: Math.round(top.pct) }
    if (top.pct > 40) {
      tips.push(
        `Najviše para ti ode na „${top.category.name}" — čak ${Math.round(top.pct)}% svih troškova. Da smanjiš samo za petinu, uštedeo bi ~${formatNumber(top.total * 0.2)} din mesečno.`,
      )
    } else {
      tips.push(
        `Najveća stavka ti je „${top.category.name}" (${formatNumber(top.total)} din). Prati je — tu se najlakše štedi bez da mnogo osetiš.`,
      )
    }
  }

  // Poređenje sa prošlim mesecom
  let comparison
  if (prev.expense > 0) {
    const diff = cur.expense - prev.expense
    const pctDiff = Math.round((diff / prev.expense) * 100)
    if (diff > 0) {
      comparison = `Trošiš ${pctDiff}% više nego prošlog meseca (${formatNumber(cur.expense)} vs ${formatNumber(prev.expense)} din).`
      tips.push('Trend ti raste — obrati pažnju do kraja meseca da ne pobegne.')
    } else if (diff < 0) {
      comparison = `Trošiš ${Math.abs(pctDiff)}% manje nego prošlog meseca. Svaka čast, tako se to radi.`
    } else {
      comparison = 'Trošiš isto kao prošlog meseca.'
    }
  }

  // Predlog štednje
  if (savingsRate < 10 && cur.income > 0) {
    tips.push(
      `Probaj da ostaviš makar 10% od primanja (~${formatNumber(cur.income * 0.1)} din) čim ti novac uđe — pre nego što počneš da trošiš.`,
    )
  }

  if (tips.length === 0) {
    tips.push('Nastavi ovako — beleži sve i držaćeš pare pod kontrolom.')
  }

  return { headline, tone, summary, topCategory, comparison, tips, savingsRate }
}
