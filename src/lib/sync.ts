import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  DATA_TABLES,
  LOCAL_USER,
  getMeta,
  setMeta,
  seedLocalDefaults,
  type SyncTable,
} from './db'
import { supabase } from './supabase'
import { toRow, fromRow } from './syncMap'
import { applyTheme, storedTheme } from './theme'

/**
 * Sync engine: write-through sa redom čekanja (outbox).
 * - Svaka lokalna izmena se odmah upisuje u Dexie + enqueue → flushNow().
 * - Offline? Outbox čeka; 'online' event ili sledeći launch šalje sve.
 * - Brisanja se propagiraju (op:'delete'), pull ih ne vaskrsava jer
 *   preskače redove koji čekaju u outboxu.
 */

/** Dexie tabela za svaku sync tabelu. */
const LOCAL_TABLE: Record<SyncTable, (typeof DATA_TABLES)[number]> = {
  profiles: db.profile,
  categories: db.categories,
  transactions: db.transactions,
  recurring_items: db.recurringItems,
  savings_goals: db.savingsGoals,
  savings_entries: db.savingsEntries,
}

/** FK-bezbedan redosled slanja (roditelji pre dece). */
const PUSH_ORDER: SyncTable[] = [
  'profiles',
  'categories',
  'recurring_items',
  'transactions',
  'savings_goals',
  'savings_entries',
]

// ---------- Enqueue ----------

/**
 * Dodaj izmenu u red čekanja. Zvati unutar iste Dexie 'rw' transakcije
 * kao i sama izmena podataka (repo.ts). Poslednja operacija za isti red
 * pobeđuje (delete gazi upsert i obratno).
 */
export async function enqueue(
  table: SyncTable,
  op: 'upsert' | 'delete',
  rowId: string,
): Promise<void> {
  await db.outbox.where('[table+rowId]').equals([table, rowId]).delete()
  await db.outbox.add({ table, op, rowId, queuedAt: new Date().toISOString() })
}

/** Zakaži flush odmah (fire-and-forget, van transakcije). */
export function flushNow(): void {
  const uid = boundUid
  if (!uid) return
  queueMicrotask(() => {
    void flushOutbox(uid)
  })
}

// ---------- Flush ----------

let inFlight: Promise<boolean> | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 1000
const RETRY_STEPS = [1000, 5000, 30000, 60000]
let boundUid: string | null = null

function scheduleRetry(uid: string): void {
  if (retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    void flushOutbox(uid)
  }, retryDelay)
  const next = RETRY_STEPS.indexOf(retryDelay) + 1
  retryDelay = RETRY_STEPS[Math.min(next, RETRY_STEPS.length - 1)]
}

export function resetRetry(): void {
  retryDelay = RETRY_STEPS[0]
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

/** Pošalji ceo outbox na Supabase. Single-flight. Vraća true ako je prazan/poslat. */
export async function flushOutbox(userId: string): Promise<boolean> {
  if (inFlight) return inFlight
  inFlight = doFlush(userId).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doFlush(userId: string): Promise<boolean> {
  const entries = await db.outbox.orderBy('seq').toArray()
  if (entries.length === 0) return true

  // Grupiši: upserti po tabeli (FK redosled), brisanja obrnuto.
  const upserts = new Map<SyncTable, string[]>()
  const deletes = new Map<SyncTable, string[]>()
  for (const e of entries) {
    const map = e.op === 'upsert' ? upserts : deletes
    const list = map.get(e.table) ?? []
    list.push(e.rowId)
    map.set(e.table, list)
  }

  try {
    for (const table of PUSH_ORDER) {
      const ids = upserts.get(table)
      if (!ids?.length) continue
      const rows: unknown[] = []
      for (const id of ids) {
        const local =
          table === 'profiles'
            ? await db.profile.get(LOCAL_USER)
            : await LOCAL_TABLE[table].get(id)
        if (local) rows.push(toRow(table, local, userId))
      }
      if (!rows.length) continue
      const onConflict = table === 'profiles' ? 'user_id' : 'user_id,id'
      const { error } = await supabase.from(table).upsert(rows, { onConflict })
      if (error) throw new Error(`${table}: ${error.message}`)
    }

    for (const table of [...PUSH_ORDER].reverse()) {
      const ids = deletes.get(table)
      if (!ids?.length) continue
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        .in('id', ids)
      if (error) throw new Error(`${table}: ${error.message}`)
    }

    // Uspeh: očisti poslato (samo redove koje smo obradili — novi unosi
    // koji su stigli tokom slanja ostaju za sledeći flush).
    const maxSeq = entries[entries.length - 1].seq!
    await db.outbox.where('seq').belowOrEqual(maxSeq).delete()
    await setMeta('lastSyncAt', new Date().toISOString())
    resetRetry()

    // Ako je u međuvremenu stiglo još — pošalji i to.
    if ((await db.outbox.count()) > 0) scheduleRetry(userId)
    return true
  } catch {
    scheduleRetry(userId)
    return false
  }
}

// ---------- Pull ----------

/**
 * Povuci sve sa Supabase-a u Dexie. Zvati tek POSLE uspešnog flusha.
 * - Redovi koji čekaju u outboxu se preskaču (lokalna izmena pobeđuje).
 * - Lokalni redovi kojih nema remote (a nisu u outboxu) se brišu —
 *   tako brisanja sa drugog uređaja konvergiraju.
 */
export async function pullFromSupabase(userId: string): Promise<boolean> {
  try {
    const pending = await db.outbox.toArray()
    const pendingKeys = new Set(pending.map((e) => `${e.table}:${e.rowId}`))

    // Profil
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (pErr) throw pErr
    if (profile && !pendingKeys.has(`profiles:${LOCAL_USER}`)) {
      await db.profile.put(fromRow('profiles', profile) as Parameters<typeof db.profile.put>[0])
      // Tema sa drugog uređaja se primenjuje i ovde.
      const remoteTheme = (profile.theme ?? 'auto') as ReturnType<typeof storedTheme>
      if (remoteTheme !== storedTheme()) applyTheme(remoteTheme)
    }

    for (const table of PUSH_ORDER) {
      if (table === 'profiles') continue
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
      if (error) throw error

      const local = LOCAL_TABLE[table]
      const remoteIds = new Set<string>()
      const toPut: unknown[] = []
      for (const row of data ?? []) {
        remoteIds.add(row.id)
        if (!pendingKeys.has(`${table}:${row.id}`)) {
          toPut.push(fromRow(table, row))
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (toPut.length) await (local as any).bulkPut(toPut)

      // Obriši lokalne kojih nema remote (osim onih koji tek čekaju slanje).
      const localRows = await local.toArray()
      const toDelete: string[] = []
      for (const row of localRows) {
        const id = (row as { id?: string; userId?: string }).id
        if (!id) continue
        if (!remoteIds.has(id) && !pendingKeys.has(`${table}:${id}`)) {
          toDelete.push(id)
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (toDelete.length) await (local as any).bulkDelete(toDelete)
    }

    return true
  } catch {
    return false
  }
}

// ---------- Realtime (instant na drugom uređaju) ----------

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
let pullDebounce: ReturnType<typeof setTimeout> | null = null

/**
 * Pretplati se na promene svih tabela za ovog korisnika. Na svaku promenu
 * (sa bilo kog uređaja) debounce-uje pull → UI se osveži za ~1s. Outbox i
 * dalje garantuje pisanje; ako Realtime nije uključen na projektu, tiho
 * pada nazad na interval/visibility okidače.
 */
export function subscribeRealtime(userId: string): void {
  if (realtimeChannel) return
  const channel = supabase.channel(`sync:${userId}`)
  for (const table of PUSH_ORDER) {
    channel.on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      () => scheduleRealtimePull(userId),
    )
  }
  channel.subscribe()
  realtimeChannel = channel
}

export function unsubscribeRealtime(): void {
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
  if (pullDebounce) {
    clearTimeout(pullDebounce)
    pullDebounce = null
  }
}

function scheduleRealtimePull(userId: string): void {
  if (pullDebounce) clearTimeout(pullDebounce)
  pullDebounce = setTimeout(() => {
    pullDebounce = null
    void pullFromSupabase(userId)
  }, 700)
}

// ---------- Vezivanje naloga za uređaj ----------

/**
 * Poveži ulogovanog korisnika sa lokalnom bazom. Rešava tri slučaja:
 * 1. Isti korisnik kao prošli put → flush pa pull.
 * 2. Uređaj nikad vezan → usvoji lokalne podatke (prvi vlasnik) ili
 *    povuci remote ako nalog već ima profil u cloudu.
 * 3. DRUGI korisnik (drugar na istom uređaju) → obriši sve lokalno,
 *    pa pull ili seed. Ne sme da vidi ni da nasledi tuđe podatke.
 */
export async function bindUser(userId: string): Promise<void> {
  boundUid = userId
  const bound = await getMeta('boundUserId')

  if (bound === userId) {
    await flushOutbox(userId)
    await pullFromSupabase(userId)
    await backfillOnboarded()
    return
  }

  const { data: remoteProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (bound == null) {
    if (remoteProfile) {
      // Nalog već postoji u cloudu — cloud je izvor istine.
      await wipeLocal()
      await seedLocalDefaults()
      await setMeta('boundUserId', userId)
      await pullFromSupabase(userId)
      await backfillOnboarded()
    } else {
      // Prvi login vlasnika uređaja — usvoji lokalne podatke.
      await setMeta('boundUserId', userId)
      await enqueueAll()
      await flushOutbox(userId)
    }
    return
  }

  // Drugi korisnik na istom uređaju — potpuna izolacija.
  await wipeLocal()
  await setMeta('boundUserId', userId)
  if (remoteProfile) {
    await seedLocalDefaults()
    await pullFromSupabase(userId)
    await backfillOnboarded()
  } else {
    await seedLocalDefaults()
    await enqueueAll()
    await flushOutbox(userId)
  }
}

/** Nalozi koji su app koristili pre uvođenja onboardinga ga ne vide. */
async function backfillOnboarded(): Promise<void> {
  const p = await db.profile.get(LOCAL_USER)
  if (!p || p.settings.onboardedAt) return
  const txCount = await db.transactions.count()
  if (txCount === 0 && p.startingBalance === 0) return
  await db.transaction('rw', db.profile, db.outbox, async () => {
    await db.profile.put({
      ...p,
      settings: { ...p.settings, onboardedAt: new Date().toISOString() },
    })
    await enqueue('profiles', 'upsert', LOCAL_USER)
  })
  flushNow()
}

async function wipeLocal(): Promise<void> {
  await db.transaction('rw', [...DATA_TABLES, db.outbox], async () => {
    for (const t of DATA_TABLES) await t.clear()
    await db.outbox.clear()
  })
}

/** Stavi sve lokalne redove u outbox (usvajanje uređaja / novi nalog). */
async function enqueueAll(): Promise<void> {
  await db.transaction('rw', [...DATA_TABLES, db.outbox], async () => {
    const profile = await db.profile.get(LOCAL_USER)
    if (profile) await enqueue('profiles', 'upsert', LOCAL_USER)
    for (const c of await db.categories.toArray()) await enqueue('categories', 'upsert', c.id)
    for (const r of await db.recurringItems.toArray()) await enqueue('recurring_items', 'upsert', r.id)
    for (const t of await db.transactions.toArray()) await enqueue('transactions', 'upsert', t.id)
    for (const g of await db.savingsGoals.toArray()) await enqueue('savings_goals', 'upsert', g.id)
    for (const e of await db.savingsEntries.toArray()) await enqueue('savings_entries', 'upsert', e.id)
  })
}

// ---------- Status za UI ----------

/** Broj promena koje čekaju slanje (0 = sve sinhronizovano). */
export function usePendingCount(): number {
  return useLiveQuery(() => db.outbox.count(), [], 0)
}

/** Ručni sync iz Settings — flush pa pull. */
export async function syncNow(userId: string): Promise<{ ok: boolean; error?: string }> {
  const flushed = await flushOutbox(userId)
  if (!flushed) return { ok: false, error: 'Slanje nije uspelo — proveri internet.' }
  const pulled = await pullFromSupabase(userId)
  if (!pulled) return { ok: false, error: 'Preuzimanje nije uspelo — proveri internet.' }
  return { ok: true }
}
