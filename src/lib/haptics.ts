/** Lagana vibracija na uspešnu akciju (radi na Androidu; iOS ignoriše tiho). */
export function haptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    // bez greške ako nije podržano
  }
}
