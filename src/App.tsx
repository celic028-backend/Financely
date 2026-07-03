import { Routes, Route, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './lib/auth'
import { useAutoSync } from './hooks/useSync'
import { setHapticEnabled } from './lib/haptics'
import { setMoneyFormat } from './lib/format'
import { setLocale } from './lib/i18n'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import Onboarding from './pages/Onboarding'
import { useProfile } from './hooks/useData'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import History from './pages/History'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import Savings from './pages/Savings'
import AddTransaction from './pages/AddTransaction'

export default function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const profile = useProfile()
  useAutoSync()

  // Sinhronizuj jezik/valutu/vibraciju iz profila pre rendera dece,
  // da t() i formatRsd budu tačni u istom frejmu kad se promeni podešavanje.
  if (profile) {
    setLocale(profile.locale)
    setMoneyFormat(profile.locale, profile.currency)
    setHapticEnabled(profile.settings.hapticOn)
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-brand)] border-t-transparent" />
      </div>
    )
  }

  // Recovery link kreira sesiju — ruta mora biti dostupna i pre "logina".
  if (location.pathname === '/reset-lozinka') return <ResetPassword />

  if (!user) return <Auth />

  // Novi korisnik prolazi kroz uvodni tok pre glavne aplikacije.
  if (profile && !profile.settings.onboardedAt) return <Onboarding />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="analitika" element={<Analytics />} />
        <Route path="istorija" element={<History />} />
        <Route path="ai" element={<Assistant />} />
        <Route path="stednja" element={<Savings />} />
        <Route path="podesavanja" element={<Settings />} />
      </Route>
      <Route path="dodaj" element={<AddTransaction />} />
    </Routes>
  )
}
