import { db, LOCAL_USER, newId } from './db'
import { enqueue, flushNow } from './sync'
import { toDay, parseDay, monthKey } from './format'
import type { RecurringItem, Transaction } from './types'

// ---------- Raspored: sledeći datum dospeća ----------

/** Poslednji četvrtak u datom mesecu (godina, mesec 0-based). */
function lastThursday(year: number, month: number): Date {
  const last = new Date(year, month + 1, 0) // poslednji dan meseca
  const day = last.getDay() // 0=ned ... 4=čet
  const diff = (day - 4 + 7) % 7
  last.setDate(last.getDate() - diff)
  return last
}

/** Datum u mesecu, ograničen na poslednji dan (npr. 31 -> 30). */
function dayOfMonth(year: number, month: number, d: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(d, lastDay))
}

/** Datum dospeća za dati mesec (YYYY-MM-DD). */
export function dueDateInMonth(
  schedule: RecurringItem['schedule'],
  year: number,
  month: number,
): string {
  if (schedule === 'last_thursday') return toDay(lastThursday(year, month))
  const d = parseInt(schedule.split(':')[1], 10)
  return toDay(dayOfMonth(year, month, d))
}

/** Prvo dospeće na dati datum ili posle njega. */
export function nextDueOnOrAfter(
  schedule: RecurringItem['schedule'],
  from: string,
): string {
  const f = parseDay(from)
  const thisMonth = dueDateInMonth(schedule, f.getFullYear(), f.getMonth())
  if (thisMonth >= from) return thisMonth
  const next = new Date(f.getFullYear(), f.getMonth() + 1, 1)
  return dueDateInMonth(schedule, next.getFullYear(), next.getMonth())
}

export interface Reminder {
  item: RecurringItem
  dueDate: string
  daysUntil: number // <0 zakasnelo, 0 danas, >0 uskoro
}

/**
 * Podsetnici: aktivne stavke čije je dospeće za tekući mesec, a nisu još
 * evidentirane u tom mesecu (nema transakcije te kategorije u tom mesecu).
 * Vraća one koje su dospele do +7 dana.
 */
export function computeReminders(
  items: RecurringItem[],
  txs: Transaction[],
  todayStr: string,
): Reminder[] {
  const t = parseDay(todayStr)
  const out: Reminder[] = []
  for (const item of items) {
    if (!item.active) continue
    const due = dueDateInMonth(item.schedule, t.getFullYear(), t.getMonth())
    const mk = monthKey(due)
    // Da li je već evidentirano ovog meseca u toj kategoriji?
    const already = txs.some(
      (tx) => tx.categoryId === item.categoryId && monthKey(tx.occurredOn) === mk,
    )
    if (already) continue
    const daysUntil = Math.round(
      (parseDay(due).getTime() - t.getTime()) / 86400000,
    )
    // Prikaži ako je dospelo (do danas) ili stiže u narednih 7 dana
    if (daysUntil <= 7) out.push({ item, dueDate: due, daysUntil })
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil)
}

// ---------- CRUD ----------

export async function addRecurring(
  input: Omit<RecurringItem, 'id' | 'userId'>,
): Promise<void> {
  const id = newId()
  await db.transaction('rw', db.recurringItems, db.outbox, async () => {
    await db.recurringItems.put({ ...input, id, userId: LOCAL_USER })
    await enqueue('recurring_items', 'upsert', id)
  })
  flushNow()
}

export async function updateRecurring(
  id: string,
  patch: Partial<RecurringItem>,
): Promise<void> {
  await db.transaction('rw', db.recurringItems, db.outbox, async () => {
    await db.recurringItems.update(id, patch)
    await enqueue('recurring_items', 'upsert', id)
  })
  flushNow()
}

export async function deleteRecurring(id: string): Promise<void> {
  await db.transaction('rw', db.recurringItems, db.outbox, async () => {
    await db.recurringItems.delete(id)
    await enqueue('recurring_items', 'delete', id)
  })
  flushNow()
}
