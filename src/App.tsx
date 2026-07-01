import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import History from './pages/History'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import AddTransaction from './pages/AddTransaction'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="analitika" element={<Analytics />} />
        <Route path="istorija" element={<History />} />
        <Route path="ai" element={<Assistant />} />
        <Route path="podesavanja" element={<Settings />} />
      </Route>
      <Route path="dodaj" element={<AddTransaction />} />
    </Routes>
  )
}
