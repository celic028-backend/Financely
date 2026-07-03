/** Da li korisnik ima uključenu vibraciju (sinhronizovano iz profila). */
let enabled = true

/** Postavi iz profila (App.tsx) — poštuje se pre svake vibracije. */
export function setHapticEnabled(on: boolean): void {
  enabled = on
}

/** Sirova vibracija (radi na Androidu; iOS ignoriše tiho). Bez provere. */
export function haptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    // bez greške ako nije podržano
  }
}

/** Vibriraj samo ako je korisnik uključio vibraciju u podešavanjima. */
export function hapticIfOn(pattern: number | number[] = 12): void {
  if (enabled) haptic(pattern)
}
