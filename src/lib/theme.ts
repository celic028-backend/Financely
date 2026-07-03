/** Tema: auto (prati sistem) / svetla / tamna. */
export type ThemeMode = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'financely-theme'
const LIGHT_BAR = '#F7F8FA'
const DARK_BAR = '#0b1017'

const media = window.matchMedia('(prefers-color-scheme: dark)')
let listening = false

export function storedTheme(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : 'auto'
}

/** Primeni temu: data-theme atribut + localStorage + meta theme-color. */
export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode
  localStorage.setItem(STORAGE_KEY, mode)
  updateBar(mode)

  // U auto modu prati promene sistemske teme uživo.
  if (mode === 'auto' && !listening) {
    media.addEventListener('change', handleMediaChange)
    listening = true
  } else if (mode !== 'auto' && listening) {
    media.removeEventListener('change', handleMediaChange)
    listening = false
  }
}

function handleMediaChange(): void {
  updateBar('auto')
}

function updateBar(mode: ThemeMode): void {
  const dark = mode === 'dark' || (mode === 'auto' && media.matches)
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', dark ? DARK_BAR : LIGHT_BAR)
}
