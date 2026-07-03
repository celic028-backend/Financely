import { toDay } from './format'
import type { Category, IncomeKind, TxType } from './types'

export interface ParsedTx {
  amount: number | null
  categoryId: string | null
  type: TxType
  incomeKind: IncomeKind | null
  description: string | null
  /** YYYY-MM-DD ako je pomenut datum ("juče", "pre 3 dana"); null = danas. */
  occurredOn: string | null
}

// Ključne reči -> id kategorije (za lokalno pogađanje kategorije).
const KEYWORDS: Record<string, string[]> = {
  'exp-hrana': ['hrana', 'rucak', 'ručak', 'dorucak', 'doručak', 'vecera', 'večera', 'kafa', 'kafic', 'kafić', 'pekara', 'burek', 'pica', 'pizza', 'dostava', 'namirnice', 'pijaca', 'market', 'maxi', 'idea', 'lidl', 'restoran', 'sok', 'voda'],
  'exp-izlasci': ['izlazak', 'izlasci', 'provod', 'pivo', 'pice', 'piće', 'kafana', 'klub', 'bioskop', 'koncert', 'zurka', 'žurka'],
  'exp-prevoz': ['prevoz', 'gorivo', 'benzin', 'dizel', 'autobus', 'bus', 'taxi', 'taksi', 'parking', 'karta', 'voz', 'uber', 'car'],
  'exp-racuni': ['racun', 'račun', 'racuni', 'struja', 'internet', 'telefon', 'pretplata', 'netflix', 'spotify', 'kirija', 'stanarina', 'infostan', 'youtube', 'hbo'],
  'exp-odeca': ['odeca', 'odeća', 'patike', 'majica', 'pantalone', 'jakna', 'obuca', 'obuća', 'zara', 'shop', 'garderoba'],
  'exp-zdravlje': ['apoteka', 'lekovi', 'lek', 'doktor', 'frizer', 'kozmetika', 'teretana', 'gym', 'zdravlje', 'nega'],
  'exp-pokloni': ['poklon', 'pokloni', 'rodjendan', 'rođendan'],
  'inc-konoba': ['konoba', 'konobarisanje', 'baksis', 'bakšiš', 'smena', 'napojnica'],
  'inc-poslovi': ['posao', 'honorar', 'usluga', 'freelance', 'gaza'],
  'inc-prodaja': ['prodaja', 'prodao', 'prodala', 'kupoprodaja', 'polovno'],
  'inc-porodica': ['mama', 'tata', 'baba', 'deda', 'porodica', 'dzeparac', 'džeparac'],
  'inc-stipendija': ['stipendija'],
  'inc-fiksno': ['plata', 'fiksno', 'uplata'],
}

const INCOME_HINTS = ['zaradio', 'zaradila', 'dobio', 'dobila', 'primio', 'primila', 'uplata', 'plata', 'stipendija', 'prihod', 'baksis', 'bakšiš', 'napojnica']

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // skini kvačice za poređenje
}

/** Izvuci iznos: podržava "1.500", "1500", "1,5k", "2k". */
function extractAmount(text: string): { amount: number | null; rest: string } {
  const t = text.replace(/\s+/g, ' ')

  // "2k" / "1,5k" (hiljade)
  const kMatch = t.match(/(\d+(?:[.,]\d+)?)\s*[kK]\b/)
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.')) * 1000
    return { amount: Math.round(val), rest: t.replace(kMatch[0], ' ').trim() }
  }

  // Broj sa tačkama kao hiljade ("1.500") ili obican ("1500")
  const numMatch = t.match(/\d[\d.]*\d|\d+/)
  if (numMatch) {
    const raw = numMatch[0].replace(/\./g, '')
    const val = parseInt(raw, 10)
    if (!Number.isNaN(val)) {
      return { amount: val, rest: t.replace(numMatch[0], ' ').trim() }
    }
  }
  return { amount: null, rest: t }
}

/** Datum iz relativnih reči: "juče", "prekjuče", "danas", "pre N dana". */
function extractDate(norm: string): { occurredOn: string | null; matched: string | null } {
  const preN = norm.match(/pre\s+(\d+)\s+dana?/)
  if (preN) return { occurredOn: daysAgo(parseInt(preN[1], 10)), matched: preN[0] }
  if (norm.includes('prekjuce')) return { occurredOn: daysAgo(2), matched: 'prekjuce' }
  if (norm.includes('juce')) return { occurredOn: daysAgo(1), matched: 'juce' }
  if (norm.includes('danas')) return { occurredOn: daysAgo(0), matched: 'danas' }
  return { occurredOn: null, matched: null }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDay(d)
}

/**
 * Lokalno pogađanje transakcije iz rečenice tipa "kafa 250" ili "juče 3000 na patike".
 * (Fallback kada Claude API nije dostupan.)
 */
export function smartParseLocal(text: string, categories: Category[]): ParsedTx {
  const norm = normalize(text)
  const { amount, rest } = extractAmount(text)
  const { occurredOn } = extractDate(norm)

  const isIncome = INCOME_HINTS.some((h) => norm.includes(h))
  const type: TxType = isIncome ? 'income' : 'expense'

  // Pogodi kategoriju po ključnim rečima
  let categoryId: string | null = null
  for (const [catId, words] of Object.entries(KEYWORDS)) {
    const cat = categories.find((c) => c.id === catId)
    if (!cat || cat.type !== type) continue
    if (words.some((w) => norm.includes(normalize(w)))) {
      categoryId = catId
      break
    }
  }

  const incomeKind: IncomeKind | null = isIncome
    ? categoryId
      ? (categories.find((c) => c.id === categoryId)?.incomeKind ?? 'extra')
      : 'extra'
    : null

  // Skini datumske reči iz opisa ("juče sam platio kafu" -> "sam platio kafu")
  const description =
    rest
      .replace(/\b(prekju[cč]e|ju[cč]e|danas|pre\s+\d+\s+dana?)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim() || null

  return { amount, categoryId, type, incomeKind, description, occurredOn }
}
