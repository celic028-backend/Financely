// ---------- Formatiranje iznosa i datuma (valuta + jezik iz profila) ----------

type Lang = 'sr' | 'en'

let lang: Lang = 'sr'
let nf = new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 })
let symbol = 'din'

/** Kratka oznaka valute (za iznose bez decimala). */
const CURRENCY_SYMBOL: Record<string, string> = {
  RSD: 'din',
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  BAM: 'KM',
  MKD: 'ден',
  RUB: '₽',
  TRY: '₺',
}

const LOCALE_BCP: Record<Lang, string> = { sr: 'sr-RS', en: 'en-US' }

/** Postavi jezik + valutu (App.tsx sinhronizuje iz profila pre rendera). */
export function setMoneyFormat(locale: string, currency: string): void {
  lang = locale === 'en' ? 'en' : 'sr'
  try {
    nf = new Intl.NumberFormat(LOCALE_BCP[lang], { maximumFractionDigits: 0 })
  } catch {
    /* nepodržan locale — ostavi prethodni */
  }
  symbol = CURRENCY_SYMBOL[currency] ?? currency
}

/** Trenutna kratka oznaka valute (za standalone labele). */
export function currencySymbol(): string {
  return symbol
}

/** Podržane valute za izbor u onboardingu/podešavanjima. */
export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'RSD', label: 'RSD · Srpski dinar' },
  { code: 'EUR', label: 'EUR · Evro' },
  { code: 'USD', label: 'USD · Dolar' },
  { code: 'GBP', label: 'GBP · Funta' },
  { code: 'CHF', label: 'CHF · Franak' },
  { code: 'BAM', label: 'BAM · KM' },
  { code: 'MKD', label: 'MKD · Denar' },
]

/** 1234 -> "1.234" (bez oznake valute) */
export function formatNumber(n: number): string {
  return nf.format(Math.round(n))
}

/** 1234 -> "1.234 din" (ili odgovarajuća valuta) */
export function formatRsd(n: number): string {
  return `${nf.format(Math.round(n))} ${symbol}`
}

/** Sa predznakom: prihod +, trošak - */
export function formatSigned(n: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '−'
  return `${sign}${formatRsd(Math.abs(n))}`
}

const MESECI_SR = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
]
const MESECI_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DANI_SR = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']
const DANI_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function months(): string[] {
  return lang === 'en' ? MESECI_EN : MESECI_SR
}
function days(): string[] {
  return lang === 'en' ? DANI_EN : DANI_SR
}

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
  return `${d.getDate()}. ${months()[d.getMonth()]} ${d.getFullYear()}.`
}

/** '2026-07-01' -> 'čet, 1. jul' */
export function formatDayShort(day: string): string {
  const d = parseDay(day)
  return `${days()[d.getDay()]}, ${d.getDate()}. ${months()[d.getMonth()]}`
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
  if (diffDays === 0) return lang === 'en' ? 'Today' : 'Danas'
  if (diffDays === 1) return lang === 'en' ? 'Yesterday' : 'Juče'
  if (diffDays === -1) return lang === 'en' ? 'Tomorrow' : 'Sutra'
  return formatDayShort(day)
}

/** '2026-07' -> 'jul 2026.' */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${months()[m - 1]} ${y}.`
}

export function monthKey(day: string): string {
  return day.slice(0, 7) // 'YYYY-MM'
}
