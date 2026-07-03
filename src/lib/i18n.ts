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
  'nav.addTransaction': { sr: 'Dodaj transakciju', en: 'Add transaction' },

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
  'home.reminders': { sr: 'Podsetnici', en: 'Reminders' },
  'home.nextPayment': { sr: 'Sledeća uplata', en: 'Next payment' },
  'home.emptyTitle': { sr: 'Počni da pratiš svoje pare', en: 'Start tracking your money' },
  'home.emptyDesc': {
    sr: 'Unesi prvi trošak ili prihod — za par sekundi ćeš videti gde ti idu pare.',
    en: 'Add your first expense or income — in a few seconds you\'ll see where your money goes.',
  },
  'home.emptyAction': { sr: 'Dodaj prvi unos', en: 'Add first entry' },
  'home.dueToday': { sr: 'Stiže danas', en: 'Due today' },
  'home.dueTomorrow': { sr: 'Stiže sutra', en: 'Due tomorrow' },
  'home.dueIn': { sr: 'Stiže za', en: 'Due in' },
  'home.overdue': { sr: 'Kasni', en: 'Overdue' },
  'home.day': { sr: 'dan', en: 'day' },
  'home.days': { sr: 'dana', en: 'days' },

  // Transakcije
  'tx.editTitle': { sr: 'Izmeni transakciju', en: 'Edit transaction' },
  'tx.newTitle': { sr: 'Nova transakcija', en: 'New transaction' },
  'tx.expense': { sr: 'Trošak', en: 'Expense' },
  'tx.income': { sr: 'Prihod', en: 'Income' },
  'tx.category': { sr: 'Kategorija', en: 'Category' },
  'tx.date': { sr: 'Datum', en: 'Date' },
  'tx.description': { sr: 'Opis (opciono)', en: 'Description (optional)' },
  'tx.descPlaceholder': { sr: 'npr. ručak sa drugom', en: 'e.g. lunch with a friend' },
  'tx.save': { sr: 'Sačuvaj', en: 'Save' },
  'tx.saveChanges': { sr: 'Sačuvaj izmene', en: 'Save changes' },
  'tx.delete': { sr: 'Obriši', en: 'Delete' },
  'tx.deleteConfirm': { sr: 'Obriši ovu transakciju?', en: 'Delete this transaction?' },
  'tx.close': { sr: 'Zatvori', en: 'Close' },
  'tx.today': { sr: 'Danas', en: 'Today' },
  'tx.yesterday': { sr: 'Juče', en: 'Yesterday' },
  'tx.otherDate': { sr: 'Drugi datum', en: 'Other date' },
  'tx.selectDate': { sr: 'Izaberi datum', en: 'Select date' },
  'tx.smartPlaceholder': { sr: 'Npr. „kafa 250" ili „juče 3000 patike"', en: 'E.g. "coffee 250" or "yesterday 3000 shoes"' },
  'tx.fill': { sr: 'Popuni', en: 'Fill' },
  'tx.recording': { sr: 'Snimam… tapni mikrofon da završiš', en: 'Recording… tap mic to stop' },
  'tx.transcribing': { sr: 'Prepisujem…', en: 'Transcribing…' },
  'tx.stopRecording': { sr: 'Zaustavi snimanje', en: 'Stop recording' },
  'tx.speakIt': { sr: 'Reci naglas', en: 'Say it aloud' },
  'tx.extraIncome': { sr: 'Zarada sa strane', en: 'Side income' },
  'tx.regularIncome': { sr: 'Redovna primanja', en: 'Regular income' },
  'tx.unknown': { sr: 'Nepoznato', en: 'Unknown' },

  // Podešavanja
  'settings.title': { sr: 'Podešavanja', en: 'Settings' },
  'settings.profile': { sr: 'Profil', en: 'Profile' },
  'settings.savings': { sr: 'Štednja', en: 'Savings' },
  'settings.recurring': { sr: 'Ponavljajuća primanja i računi', en: 'Recurring income & bills' },
  'settings.categories': { sr: 'Kategorije', en: 'Categories' },
  'settings.budgets': { sr: 'Budžet po kategoriji', en: 'Category budgets' },
  'settings.budgetsDesc': {
    sr: 'Postavi mesečni limit i upozorićemo te kad se približiš.',
    en: 'Set a monthly limit and we\'ll warn you when you\'re close.',
  },
  'settings.appearance': { sr: 'Izgled', en: 'Appearance' },
  'settings.notifications': { sr: 'Notifikacije', en: 'Notifications' },
  'settings.language': { sr: 'Jezik', en: 'Language' },
  'settings.currency': { sr: 'Valuta', en: 'Currency' },
  'settings.name': { sr: 'Ime', en: 'Name' },
  'settings.namePlaceholder': { sr: 'Tvoje ime', en: 'Your name' },
  'settings.back': { sr: 'Nazad', en: 'Back' },
  'settings.themeAuto': { sr: 'Auto', en: 'Auto' },
  'settings.themeLight': { sr: 'Svetla', en: 'Light' },
  'settings.themeDark': { sr: 'Tamna', en: 'Dark' },
  'settings.signOut': { sr: 'Odjavi se', en: 'Sign out' },

  // Notifikacije
  'notify.push': { sr: 'Push obaveštenja', en: 'Push notifications' },
  'notify.pushDenied': { sr: 'Blokirano — uključi u podešavanjima browsera', en: 'Blocked — enable in browser settings' },
  'notify.pushEnabled': { sr: 'Uključeno na ovom uređaju', en: 'Enabled on this device' },
  'notify.pushAllow': { sr: 'Dozvoli da te podsećamo', en: 'Allow us to remind you' },
  'notify.pushOff': { sr: 'Isključi', en: 'Turn off' },
  'notify.pushOn': { sr: 'Uključi', en: 'Turn on' },
  'notify.pushHint': {
    sr: 'Push obaveštenja rade u instaliranoj aplikaciji. Dodaj Financely na početni ekran (na iPhone-u je push dostupan od iOS 16.4).',
    en: 'Push notifications work in the installed app. Add Financely to your home screen (on iPhone push is available from iOS 16.4).',
  },
  'notify.due': { sr: 'Kad stižu ponavljanja', en: 'When recurring items are due' },
  'notify.dueDesc': { sr: 'Podsetnik za primanja i račune koji dospevaju', en: 'Reminder for upcoming income and bills' },
  'notify.goal': { sr: 'Kad ugrožavaš cilj štednje', en: 'When you risk your savings goal' },
  'notify.goalDesc': { sr: 'Kad trošiš brže nego što cilj dozvoljava', en: 'When spending faster than your goal allows' },
  'notify.daily': { sr: 'Dnevni podsetnik', en: 'Daily reminder' },
  'notify.dailyDesc': { sr: 'Blag podsetnik uveče ako nisi ništa uneo', en: 'Gentle reminder in the evening if you logged nothing' },
  'notify.monthly': { sr: 'Mesečni rezime', en: 'Monthly summary' },
  'notify.monthlyDesc': { sr: 'Kratak pregled prošlog meseca 1. u mesecu', en: 'Brief overview of last month on the 1st' },
  'notify.haptic': { sr: 'Vibracija', en: 'Vibration' },
  'notify.hapticDesc': { sr: 'Lagana vibracija na uspešan unos', en: 'Light vibration on successful entry' },

  // Ponavljanja
  'recurring.add': { sr: 'Dodaj ponavljanje', en: 'Add recurring' },
  'recurring.editTitle': { sr: 'Izmeni ponavljanje', en: 'Edit recurring' },
  'recurring.newTitle': { sr: 'Novo ponavljanje', en: 'New recurring' },
  'recurring.bill': { sr: 'Račun / trošak', en: 'Bill / expense' },
  'recurring.income': { sr: 'Primanje', en: 'Income' },
  'recurring.namePlaceholder': { sr: 'npr. Netflix, Plata, Kirija', en: 'e.g. Netflix, Salary, Rent' },
  'recurring.nameLabel': { sr: 'Naziv', en: 'Name' },
  'recurring.categoryLabel': { sr: 'Kategorija', en: 'Category' },
  'recurring.amountLabel': { sr: 'Iznos (opciono)', en: 'Amount (optional)' },
  'recurring.whenLabel': { sr: 'Koji dan u mesecu?', en: 'Which day of the month?' },
  'recurring.inMonth': { sr: 'u mesecu', en: 'of the month' },
  'recurring.save': { sr: 'Sačuvaj', en: 'Save' },
  'recurring.emptyHint': {
    sr: 'Dodaj primanja i račune koji se ponavljaju (npr. plata, kirija, Netflix) da te podsećamo.',
    en: 'Add recurring income and bills (e.g. salary, rent, Netflix) to get reminders.',
  },

  // Notification prompt
  'pushPrompt.title': { sr: 'Uključi obaveštenja', en: 'Enable notifications' },
  'pushPrompt.desc': {
    sr: 'Podsetićemo te kad stignu računi, kad ugrožavaš cilj štednje i kad zaboraviš unos.',
    en: 'We\'ll remind you when bills are due, when you risk your savings goal, and when you forget to log.',
  },
  'pushPrompt.enable': { sr: 'Uključi', en: 'Enable' },
  'pushPrompt.enabling': { sr: 'Uključujem…', en: 'Enabling…' },

  // Install hint
  'install.title': { sr: 'Instaliraj na telefon', en: 'Install on phone' },
  'install.iosDesc': { sr: 'Klikni Share ⬆ pa „Add to Home Screen" za brzi pristup.', en: 'Tap Share ⬆ then "Add to Home Screen" for quick access.' },
  'install.androidDesc': { sr: 'Dodaj Financely na početni ekran kao pravu aplikaciju.', en: 'Add Financely to your home screen as a real app.' },
  'install.button': { sr: 'Instaliraj', en: 'Install' },

  // Auth
  'auth.login': { sr: 'Prijava', en: 'Login' },
  'auth.register': { sr: 'Registracija', en: 'Register' },
  'auth.email': { sr: 'Email', en: 'Email' },
  'auth.password': { sr: 'Lozinka', en: 'Password' },
  'auth.signIn': { sr: 'Prijavi se', en: 'Sign in' },
  'auth.signUp': { sr: 'Registruj se', en: 'Sign up' },
  'auth.forgotPassword': { sr: 'Zaboravio si lozinku?', en: 'Forgot password?' },
  'auth.tagline': { sr: 'Prati troškove, štedi pametnije', en: 'Track spending, save smarter' },
  'auth.privacy': {
    sr: 'Tvoji podaci se čuvaju lokalno i sinhronizuju sa tvojim nalogom.',
    en: 'Your data is stored locally and synced with your account.',
  },

  // Analitika
  'analytics.title': { sr: 'Analitika', en: 'Analytics' },
  'analytics.byCategory': { sr: 'Po kategoriji', en: 'By category' },
  'analytics.monthly': { sr: 'Mesečno', en: 'Monthly' },
  'analytics.noData': { sr: 'Nema podataka za ovaj mesec', en: 'No data for this month' },

  // Istorija
  'history.title': { sr: 'Istorija', en: 'History' },
  'history.search': { sr: 'Pretraži…', en: 'Search…' },
  'history.noResults': { sr: 'Nema rezultata', en: 'No results' },

  // Asistent
  'assistant.title': { sr: 'Asistent', en: 'Assistant' },
  'assistant.placeholder': { sr: 'Pitaj me nešto…', en: 'Ask me anything…' },

  // Sledeća uplata
  'home.nextPaymentLabel': { sr: 'Sledeća uplata', en: 'Next payment' },
  'home.inDays': { sr: 'za', en: 'in' },

  // Štednja kartica
  'savings.saved': { sr: 'Ušteđeno', en: 'Saved' },
  'savings.inSavings': { sr: 'U štednji', en: 'In savings' },
  'savings.setGoal': { sr: 'Postavi cilj štednje', en: 'Set savings goal' },
  'savings.setGoalDesc': {
    sr: 'Odredi koliko želiš da uštediš pa prati napredak',
    en: 'Decide how much to save and track progress',
  },
  'savings.of': { sr: 'od', en: 'of' },
  'savings.setGoalHint': {
    sr: 'Postavi cilj štednje (procenat ili fiksno)',
    en: 'Set savings goal (percent or fixed)',
  },
  'savings.edit': { sr: 'Izmeni', en: 'Edit' },
  'savings.set': { sr: 'Postavi', en: 'Set' },
  'savings.autoPercent': { sr: 'Automatski odvajam', en: 'Auto-saving' },
  'savings.ofEveryIncome': { sr: 'svakog priliva', en: 'of every income' },
  'savings.autoFixed': { sr: 'Automatski odvajam', en: 'Auto-saving' },
  'savings.monthly': { sr: 'mesečno', en: 'monthly' },
  'savings.savedThisMonth': { sr: 'Ovog meseca ušteđeno', en: 'Saved this month' },
  'savings.longTermGoal': { sr: 'Dugoročni cilj', en: 'Long-term goal' },
  'savings.longTermOptional': { sr: 'Dugoročni cilj (opciono)', en: 'Long-term goal (optional)' },
  'savings.by': { sr: 'do', en: 'by' },
  'savings.addToSavings': { sr: 'Dodaj u štednju', en: 'Add to savings' },
  'savings.withdraw': { sr: 'Podigni', en: 'Withdraw' },
  'savings.addLabel': { sr: 'Koliko dodaješ u štednju?', en: 'How much to add to savings?' },
  'savings.addHintPrefix': { sr: 'Dostupno za trošenje', en: 'Available to spend' },
  'savings.addCta': { sr: 'Dodaj', en: 'Add' },
  'savings.withdrawLabel': { sr: 'Koliko podižeš iz štednje?', en: 'How much to withdraw?' },
  'savings.withdrawHintPrefix': { sr: 'U štednji', en: 'In savings' },
  'savings.withdrawWarning': {
    sr: 'Podizanjem vraćaš pare nazad u „dostupno za trošenje" i udaljavaš se od cilja.',
    en: 'Withdrawing moves money back to "available to spend" and sets your goal back.',
  },
  'savings.withdrawCta': { sr: 'Podigni', en: 'Withdraw' },
  'savings.noFunds': {
    sr: 'Nemaš dostupnih sredstava za štednju. Prvo unesi prihod ili uskladi stanje.',
    en: 'No funds available for saving. Add income or adjust your balance first.',
  },
  'savings.percentOfIncome': { sr: 'Procenat priliva', en: 'Percent of income' },
  'savings.fixedMonthly': { sr: 'Fiksno mesečno', en: 'Fixed monthly' },
  'savings.percentLabel': { sr: 'Koliko % svakog priliva da odvojim', en: 'What % of each income to save' },
  'savings.fixedLabel': { sr: 'Fiksni iznos mesečno', en: 'Fixed amount monthly' },
  'savings.saveGoal': { sr: 'Sačuvaj cilj', en: 'Save goal' },
  'savings.history': { sr: 'Istorija', en: 'History' },
  'savings.showLess': { sr: 'Prikaži manje', en: 'Show less' },
  'savings.showAll': { sr: 'Prikaži sve', en: 'Show all' },
  'savings.sourceAuto': { sr: 'Automatski', en: 'Automatic' },
  'savings.sourceManual': { sr: 'Ručno dodato', en: 'Manually added' },
  'savings.sourceLeftover': { sr: 'Mesečni višak', en: 'Monthly leftover' },
  'savings.sourceWithdraw': { sr: 'Podignuto', en: 'Withdrawn' },

  // Ponavljanja (schedule label)
  'recurring.lastDay': { sr: 'poslednji dan', en: 'last day' },
  'recurring.everyMonth': { sr: 'svakog', en: 'every' },
  'recurring.ofMonth': { sr: 'u mesecu', en: 'of the month' },
  'recurring.variableAmount': { sr: 'promenljiv iznos', en: 'variable amount' },

  // Balance sheet
  'balance.title': { sr: 'Uskladi stanje', en: 'Adjust balance' },
  'balance.current': { sr: 'Trenutno stanje po aplikaciji', en: 'Current balance in app' },
  'balance.howMuch': { sr: 'Koliko zaista imaš? (keš + račun)', en: 'How much do you really have? (cash + account)' },
  'balance.adjust': { sr: 'Uskladi', en: 'Adjust' },

  // Leftover prompt
  'leftover.bravo': { sr: 'Bravo!', en: 'Great!' },
  'leftover.youHadLeft': { sr: 'ti je ostalo', en: 'you had left' },
  'leftover.question': {
    sr: 'Hoćeš da prebacimo taj višak u štednju ili da ga preneseš u ovaj mesec?',
    en: 'Want to move the surplus to savings or carry it over to this month?',
  },
  'leftover.toSavings': { sr: 'Prebaci u štednju', en: 'Move to savings' },
  'leftover.carry': { sr: 'Prenesi', en: 'Carry over' },

  // History
  'history.searchPlaceholder': { sr: 'Pretraži po opisu ili kategoriji', en: 'Search by description or category' },
  'history.all': { sr: 'Sve', en: 'All' },
  'history.expenses': { sr: 'Troškovi', en: 'Expenses' },
  'history.incomes': { sr: 'Prihodi', en: 'Income' },
  'history.noFilter': { sr: 'Nema rezultata za ovaj filter.', en: 'No results for this filter.' },
  'history.empty': { sr: 'Kad dodaš prvu transakciju, pojaviće se ovde.', en: 'When you add your first transaction, it will appear here.' },

  // Assistant
  'assistant.subtitle': { sr: 'Tvoj AI asistent · Claude', en: 'Your AI assistant · Claude' },
  'assistant.askOrLog': { sr: 'Pitaj me ili reci šta si potrošio', en: 'Ask me or tell me what you spent' },
  'assistant.conversation': { sr: 'Razgovor', en: 'Conversation' },
  'assistant.inputPlaceholder': { sr: 'Napiši ili reci šta te zanima...', en: 'Type or say what you want to know...' },
  'assistant.suggestion1': { sr: 'Potrošio sam 500 na kafu', en: 'I spent 500 on coffee' },
  'assistant.suggestion2': { sr: 'Koliko imam?', en: 'How much do I have?' },
  'assistant.suggestion3': { sr: 'Gde najviše trošim?', en: 'Where do I spend the most?' },
  'assistant.suggestion4': { sr: 'Kako da uštedim?', en: 'How can I save more?' },
  'assistant.confirm': { sr: 'Potvrdi', en: 'Confirm' },
  'assistant.other': { sr: 'Ostalo', en: 'Other' },
  'assistant.reanalyze': { sr: 'Analiziraj ponovo', en: 'Analyze again' },

  // Generičko
  'common.save': { sr: 'Sačuvaj', en: 'Save' },
  'common.cancel': { sr: 'Otkaži', en: 'Cancel' },
  'common.close': { sr: 'Zatvori', en: 'Close' },
  'common.delete': { sr: 'Obriši', en: 'Delete' },
  'common.edit': { sr: 'Izmeni', en: 'Edit' },
  'common.din': { sr: 'din', en: '' },
}

export function t(key: string): string {
  const entry = DICT[key]
  if (!entry) return key
  return entry[lang]
}
