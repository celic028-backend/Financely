// Lagani i18n: dict + t(). Jezik se sinhronizuje iz profila (App.tsx) pre
// rendera, isto kao valuta u format.ts. Prevod se dodaje postepeno, ekran po
// ekran — nedostajući ključ vraća srpski tekst (bezbedan fallback).

type Lang = 'sr' | 'en'

let lang: Lang = 'sr'

export function setLocale(locale: string): void {
  lang = locale === 'en' ? 'en' : 'sr'
}

export function currentLang(): Lang {
  return lang
}

export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'sr', label: 'Srpski' },
  { code: 'en', label: 'English' },
]

const DICT: Record<string, { sr: string; en: string }> = {
  // Navigacija
  'nav.home': { sr: 'Početna', en: 'Home' },
  'nav.analytics': { sr: 'Analitika', en: 'Analytics' },
  'nav.history': { sr: 'Istorija', en: 'History' },
  'nav.assistant': { sr: 'Asistent', en: 'Assistant' },
  'nav.savings': { sr: 'Štednja', en: 'Savings' },
  'nav.settings': { sr: 'Podešavanja', en: 'Settings' },

  // Pozdrav
  'greeting.morning': { sr: 'Dobro jutro', en: 'Good morning' },
  'greeting.day': { sr: 'Dobar dan', en: 'Good afternoon' },
  'greeting.evening': { sr: 'Dobro veče', en: 'Good evening' },

  // Početna
  'home.available': { sr: 'Dostupno za trošenje', en: 'Available to spend' },
  'home.inSavings': { sr: 'U štednji', en: 'In savings' },
  'home.spent': { sr: 'Potrošeno', en: 'Spent' },
  'home.income': { sr: 'Prihod', en: 'Income' },
  'home.expense': { sr: 'Trošak', en: 'Expense' },
  'home.recent': { sr: 'Poslednje', en: 'Recent' },
  'home.all': { sr: 'Sve', en: 'All' },
  'home.overspend': {
    sr: 'Trošiš brže nego što cilj štednje dozvoljava',
    en: 'You are spending faster than your savings goal allows',
  },

  // Podešavanja
  'settings.title': { sr: 'Podešavanja', en: 'Settings' },
  'settings.profile': { sr: 'Profil', en: 'Profile' },
  'settings.savings': { sr: 'Štednja', en: 'Savings' },
  'settings.recurring': { sr: 'Ponavljajuća primanja i računi', en: 'Recurring income & bills' },
  'settings.categories': { sr: 'Kategorije', en: 'Categories' },
  'settings.budgets': { sr: 'Budžet po kategoriji', en: 'Category budgets' },
  'settings.appearance': { sr: 'Izgled', en: 'Appearance' },
  'settings.notifications': { sr: 'Notifikacije', en: 'Notifications' },
  'settings.language': { sr: 'Jezik', en: 'Language' },
  'settings.currency': { sr: 'Valuta', en: 'Currency' },
}

export function t(key: string): string {
  const entry = DICT[key]
  if (!entry) return key
  return entry[lang]
}
