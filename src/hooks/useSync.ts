import { useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth'
import {
  bindUser,
  flushOutbox,
  resetRetry,
  subscribeRealtime,
  unsubscribeRealtime,
} from '../lib/sync'
import { db } from '../lib/db'

/**
 * Auto-sync: veže ulogovanog korisnika za lokalnu bazu (bindUser),
 * šalje promene na 'online' i kad app ode u pozadinu, i drži
 * interval samo dok ima promena u redu čekanja.
 */
export function useAutoSync() {
  const { user } = useAuth()
  const boundFor = useRef<string | null>(null)

  useEffect(() => {
    if (!user || boundFor.current === user.id) return
    boundFor.current = user.id
    void bindUser(user.id)
  }, [user])

  // Realtime: instant osvežavanje kad se promeni podatak na drugom uređaju.
  useEffect(() => {
    if (!user) return
    subscribeRealtime(user.id)
    return () => unsubscribeRealtime()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const uid = user.id

    function flush() {
      void flushOutbox(uid)
    }

    function handleOnline() {
      resetRetry()
      flush()
    }

    function handleVisibility() {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)

    // Interval samo kad outbox nije prazan (štedi mrežu i bateriju).
    const interval = setInterval(async () => {
      if ((await db.outbox.count()) > 0) flush()
    }, 30_000)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [user])
}
