import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { seedLocalDefaults } from './lib/db'
import { AuthProvider } from './lib/auth'
import { applyTheme, storedTheme } from './lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false },
  },
})

// Tema pre rendera (inline skripta u index.html je već postavila atribut).
applyTheme(storedTheme())

// Svež uređaj dobija seed odmah (offline-first onboarding pre logina);
// bindUser kasnije briše/zamenjuje ako nalog već ima podatke u cloudu.
await seedLocalDefaults()

if (import.meta.env.DEV) {
  const { seedDemo } = await import('./lib/demo')
  ;(window as unknown as { __seedDemo: () => void }).__seedDemo = seedDemo
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
