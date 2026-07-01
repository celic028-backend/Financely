import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { bootstrap } from './lib/db'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false },
  },
})

// Seed profila i podrazumevanih kategorija (prvi put) pre renderovanja.
await bootstrap()

// Dev pomoć: window.__seedDemo() ubacuje demo transakcije.
if (import.meta.env.DEV) {
  const { seedDemo } = await import('./lib/demo')
  ;(window as unknown as { __seedDemo: () => void }).__seedDemo = seedDemo
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
