import { supabase } from './supabase'

/**
 * Web Push pretplata (VAPID). Bez `VITE_VAPID_PUBLIC_KEY` ili bez podrške,
 * `pushSupported()` je false pa UI sakrije opciju. Pretplata se čuva u
 * Supabase tabeli `push_subscriptions`; server (edge + pg_cron) šalje.
 */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  )
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function platform(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'web'
}

export interface PushResult {
  ok: boolean
  reason?: 'unsupported' | 'denied' | 'error'
}

/** Traži dozvolu (iz klika!) i pretplati uređaj. Upisuje u Supabase. */
export async function enablePush(userId: string): Promise<PushResult> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return { ok: false, reason: 'denied' }

    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      })
    }

    const json = sub.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        platform: platform(),
      },
      { onConflict: 'endpoint' },
    )
    if (error) return { ok: false, reason: 'error' }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** Odjavi push na ovom uređaju i obriši pretplatu iz Supabase-a. */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
  } catch {
    /* tiho */
  }
}
