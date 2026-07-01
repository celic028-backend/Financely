import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
      <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
