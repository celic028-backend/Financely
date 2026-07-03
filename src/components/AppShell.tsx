import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BottomNav } from './BottomNav'

export function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
      <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}
