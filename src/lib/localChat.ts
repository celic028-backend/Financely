import { monthKey, today, formatRsd, formatNumber } from './format'
import { computeTotals } from './repo'
import type { Category, Transaction } from './types'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function extractNumber(text: string): number | null {
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[kK]\b/)
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000)
  const m = text.match(/\d[\d.]*\d|\d+/)
  if (!m) return null
  const v = parseInt(m[0].replace(/\./g, ''), 10)
  return Number.isNaN(v) ? null : v
}

/**
 * Lokalni odgovor asistenta (dok se ne doda Claude API).
 * Pokriva: stanje, potrošnju po kategoriji, „mogu li da priuštim", prihod.
 */
export function localAnswer(
  question: string,
  txs: Transaction[],
  cats: Category[],
  startingBalance: number,
): string {
  const q = normalize(question)
  const mk = monthKey(today())
  const totals = computeTotals(startingBalance, txs, mk)

  // Mogu li da priuštim X?
  if (q.includes('priust') || q.includes('mogu li') || q.includes('da kupim')) {
    const amount = extractNumber(question)
    if (amount) {
      const afterMonth = totals.monthLeftover - amount
      if (amount <= totals.balance) {
        const msg =
          afterMonth >= 0
            ? `Da, možeš. Imaš ${formatRsd(totals.balance)} na stanju, a i ovog meseca bi ti posle toga ostalo ${formatRsd(afterMonth)}. Slobodno, ali ne pretvaraj u naviku 😊`
            : `Možeš tehnički (imaš ${formatRsd(totals.balance)}), ali ovog meseca bi otišao u minus ${formatRsd(Math.abs(afterMonth))}. Ako nije hitno, sačekaj sledeću uplatu.`
        return msg
      }
      return `Iskreno — ne bih. To je ${formatRsd(amount)}, a na stanju imaš samo ${formatRsd(totals.balance)}. Sačekaj da se skupi ili nađi jeftiniju varijantu.`
    }
    return 'Reci mi koliko košta to što hoćeš (npr. „mogu li da priuštim 15.000") pa da ti kažem tačno.'
  }

  // Koliko imam / stanje
  if (q.includes('stanje') || q.includes('koliko imam') || q.includes('koliko para')) {
    return `Trenutno imaš ${formatRsd(totals.balance)}. Ovog meseca ti je ostalo ${formatRsd(totals.monthLeftover)} (prihodi ${formatNumber(totals.monthIncome)} − troškovi ${formatNumber(totals.monthExpense)}).`
  }

  // Koliko sam zaradio
  if (q.includes('zaradi') || q.includes('prihod') || q.includes('uslo')) {
    return `Ovog meseca ti je ušlo ${formatRsd(totals.monthIncome)}.`
  }

  // Koliko sam potrošio (ukupno ili po kategoriji)
  if (q.includes('potros') || q.includes('trosi')) {
    // pokušaj da nađe kategoriju (koren reči, radi i sa padežima)
    const cat = cats.find((c) => {
      if (c.type !== 'expense') return false
      const root = normalize(c.name.split(' ')[0]).slice(0, 4)
      return root.length >= 3 && q.includes(root)
    })
    if (cat) {
      let sum = 0
      for (const t of txs) {
        if (t.type === 'expense' && t.categoryId === cat.id && t.occurredOn.startsWith(mk)) sum += t.amount
      }
      return `Na „${cat.name}" si ovog meseca potrošio ${formatRsd(sum)}.`
    }
    return `Ovog meseca si ukupno potrošio ${formatRsd(totals.monthExpense)}.`
  }

  // Podrazumevani odgovor
  return 'Mogu da ti kažem koliko imaš, gde ti idu pare i da li možeš nešto da priuštiš. Pitaj me npr. „koliko sam potrošio na hranu?" ili „mogu li da priuštim 10.000?". (Pametniji AI chat stiže kad povežemo Claude ključ.)'
}
