// ---------- Formatiranje iznosa i datuma (srpski, RSD) ----------

const nf = new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 })

/** 1234 -> "1.234" (bez oznake valute) */
export function formatNumber(n: number): string {
  return nf.format(Math.round(n))
}

/** 1234 -> "1.234 din" */
export function formatRsd(n: number): string {
  return `${nf.format(Math.round(n))} din`
}

/** Sa predznakom: prihod +, trošak - */
export function formatSigned(n: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '−'
  return `${sign}${formatRsd(Math.abs(n))}`
}

const MESECI = [
  'januar',
  'februar',
  'mart',
  'april',
  'maj',
  'jun',
  'jul',
  'avgust',
  'septembar',
  'oktobar',
  'novembar',
  'decembar',
]

const DANI = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']

/** '2026-07-01' -> Date (lokalno, bez pomeranja zone) */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date -> 'YYYY-MM-DD' (lokalno) */
export function toDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return toDay(new Date())
}

/** '2026-07-01' -> '1. jul 2026.' */
export function formatDayLong(day: string): string {
  const d = parseDay(day)
  return `${d.getDate()}. ${MESECI[d.getMonth()]} ${d.getFullYear()}.`
}

/** '2026-07-01' -> 'čet, 1. jul' */
export function formatDayShort(day: string): string {
  const d = parseDay(day)
  return `${DANI[d.getDay()]}, ${d.getDate()}. ${MESECI[d.getMonth()]}`
}

/** Prijateljski relativni datum: Danas / Juče / kratak datum */
export function formatDayRelative(day: string): string {
  const t = new Date()
  const d = parseDay(day)
  const diffDays = Math.round(
    (new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000,
  )
  if (diffDays === 0) return 'Danas'
  if (diffDays === 1) return 'Juče'
  if (diffDays === -1) return 'Sutra'
  return formatDayShort(day)
}

/** '2026-07' -> 'jul 2026.' */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MESECI[m - 1]} ${y}.`
}

export function monthKey(day: string): string {
  return day.slice(0, 7) // 'YYYY-MM'
}
