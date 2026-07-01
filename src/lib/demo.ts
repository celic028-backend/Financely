import { db, LOCAL_USER, newId } from './db'
import { toDay } from './format'
import type { Transaction, TxType, IncomeKind } from './types'

function day(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return toDay(d)
}

function tx(
  amount: number,
  type: TxType,
  categoryId: string,
  occurredOn: string,
  description?: string,
  incomeKind?: IncomeKind,
): Transaction {
  return {
    id: newId(),
    userId: LOCAL_USER,
    amount,
    type,
    categoryId,
    incomeKind: incomeKind ?? null,
    description: description ?? null,
    occurredOn,
    createdAt: new Date().toISOString(),
  }
}

/** Ubaci realan demo skup podataka (dev). Briše postojeće transakcije. */
export async function seedDemo(): Promise<void> {
  await db.transactions.clear()

  // Ponavljajuća primanja (ako već ne postoje)
  if ((await db.recurringItems.count()) === 0) {
    await db.recurringItems.bulkPut([
      { id: 'rec-stipendija', userId: LOCAL_USER, kind: 'income', name: 'Stipendija', amount: null, categoryId: 'inc-stipendija', schedule: 'last_thursday', incomeKind: 'fixed', active: true },
      { id: 'rec-fiksno', userId: LOCAL_USER, kind: 'income', name: 'Fiksna uplata', amount: 33000, categoryId: 'inc-fiksno', schedule: 'day:10', incomeKind: 'fixed', active: true },
    ])
  }
  const data: Transaction[] = [
    // ----- Ovaj mesec (danas) — da "ovog meseca" ne bude prazno -----
    tx(79000, 'income', 'inc-stipendija', day(0), 'Stipendija', 'fixed'),
    tx(4200, 'income', 'inc-konoba', day(0), 'Smena', 'extra'),
    tx(340, 'expense', 'exp-hrana', day(0), 'kafa'),
    tx(2600, 'expense', 'exp-hrana', day(0), 'namirnice'),
    tx(1900, 'expense', 'exp-izlasci', day(0), 'izlazak'),
    tx(3000, 'expense', 'exp-prevoz', day(0), 'gorivo'),
    tx(2200, 'expense', 'exp-racuni', day(0), 'telefon'),

    // ----- Prethodni period (istorija) -----
    tx(79000, 'income', 'inc-stipendija', day(-12), 'Stipendija za mesec', 'fixed'),
    tx(33000, 'income', 'inc-fiksno', day(-20), 'Fiksna uplata', 'fixed'),
    tx(4500, 'income', 'inc-konoba', day(-6), 'Smena vikend', 'extra'),
    tx(3800, 'income', 'inc-konoba', day(-2), 'Smena + bakšiš', 'extra'),
    tx(2000, 'income', 'inc-porodica', day(-15), 'Baba', 'extra'),

    // Troškovi — hrana
    tx(320, 'expense', 'exp-hrana', day(-1), 'kafa i sok'),
    tx(1450, 'expense', 'exp-hrana', day(-2), 'namirnice Maxi'),
    tx(280, 'expense', 'exp-hrana', day(-3), 'pekara'),
    tx(2100, 'expense', 'exp-hrana', day(-5), 'dostava'),
    tx(1800, 'expense', 'exp-hrana', day(-8), 'pijaca'),
    tx(650, 'expense', 'exp-hrana', day(-11), 'ručak'),
    // Izlasci
    tx(1600, 'expense', 'exp-izlasci', day(-2), 'pivo sa ekipom'),
    tx(2400, 'expense', 'exp-izlasci', day(-7), 'izlazak'),
    tx(900, 'expense', 'exp-izlasci', day(-14), 'bioskop'),
    // Prevoz
    tx(3000, 'expense', 'exp-prevoz', day(-4), 'gorivo'),
    tx(290, 'expense', 'exp-prevoz', day(-9), 'autobus'),
    // Računi
    tx(2200, 'expense', 'exp-racuni', day(-10), 'telefon'),
    tx(1290, 'expense', 'exp-racuni', day(-10), 'Netflix + Spotify'),
    // Odeća
    tx(4500, 'expense', 'exp-odeca', day(-6), 'patike'),
    // Zdravlje
    tx(1100, 'expense', 'exp-zdravlje', day(-13), 'apoteka'),
    tx(1500, 'expense', 'exp-zdravlje', day(-18), 'frizer'),
    // Ostalo
    tx(750, 'expense', 'exp-ostalo', day(-16), 'sitnice'),
  ]
  await db.transactions.bulkPut(data)
}
