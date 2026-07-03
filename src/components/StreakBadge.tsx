import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X, Trophy, Target, Zap, Star, Crown } from 'lucide-react'
import { t } from '../lib/i18n'

interface Props {
  streak: number
  lastEntryDate?: string | null
}

interface Milestone {
  at: number
  icon: React.ReactNode
  labelSr: string
  labelEn: string
}

const MILESTONES: Milestone[] = [
  { at: 3, icon: <Zap className="h-5 w-5" />, labelSr: 'Odličan početak!', labelEn: 'Great start!' },
  { at: 7, icon: <Target className="h-5 w-5" />, labelSr: 'Cela nedelja!', labelEn: 'Full week!' },
  { at: 14, icon: <Star className="h-5 w-5" />, labelSr: 'Dve nedelje zaredom!', labelEn: 'Two weeks straight!' },
  { at: 30, icon: <Trophy className="h-5 w-5" />, labelSr: 'Ceo mesec! Legenda.', labelEn: 'Full month! Legend.' },
  { at: 60, icon: <Crown className="h-5 w-5" />, labelSr: 'Dva meseca. Nema stajanja.', labelEn: 'Two months. Unstoppable.' },
  { at: 100, icon: <Crown className="h-5 w-5" />, labelSr: '100 dana! Apsolutni šampion.', labelEn: '100 days! Absolute champion.' },
]

function currentMilestone(streak: number): Milestone | null {
  let best: Milestone | null = null
  for (const m of MILESTONES) {
    if (streak >= m.at) best = m
  }
  return best
}

function nextMilestone(streak: number): Milestone | null {
  for (const m of MILESTONES) {
    if (streak < m.at) return m
  }
  return null
}

function streakEmoji(streak: number): string {
  if (streak >= 100) return '👑'
  if (streak >= 30) return '🏆'
  if (streak >= 14) return '⭐'
  if (streak >= 7) return '🎯'
  if (streak >= 3) return '⚡'
  return '🔥'
}

export function StreakBadge({ streak, lastEntryDate }: Props) {
  const [open, setOpen] = useState(false)

  if (streak <= 0) return null

  const current = currentMilestone(streak)
  const next = nextMilestone(streak)
  const isSr = t('nav.home') === 'Početna'

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="flex items-center gap-1 rounded-full bg-[var(--color-warn-soft)] px-2.5 py-1 text-[13px] font-semibold text-[var(--color-warn)]"
      >
        <Flame className="h-3.5 w-3.5" />
        {streak}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="safe-bottom w-full max-w-md rounded-t-[var(--radius-2xl)] bg-[var(--color-bg)] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[16px] font-bold">
                  {isSr ? 'Tvoj streak' : 'Your streak'}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Big streak number */}
              <div className="mb-5 text-center">
                <p className="text-[48px]">{streakEmoji(streak)}</p>
                <p className="mt-1 text-[42px] font-bold leading-none text-[var(--color-warn)]">
                  {streak}
                </p>
                <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
                  {streak === 1
                    ? (isSr ? 'dan zaredom' : 'day in a row')
                    : (isSr ? 'dana zaredom' : 'days in a row')}
                </p>
              </div>

              {/* Current milestone */}
              {current && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[var(--color-warn-soft)] p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-warn)] text-white">
                    {current.icon}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--color-warn)]">
                      {isSr ? current.labelSr : current.labelEn}
                    </p>
                    <p className="text-[12px] text-[var(--color-ink-muted)]">
                      {isSr ? `Dostigao si ${current.at} dana` : `Reached ${current.at} days`}
                    </p>
                  </div>
                </div>
              )}

              {/* Next milestone progress */}
              {next && (
                <div className="mb-2">
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[var(--color-ink-muted)]">
                      {isSr ? 'Sledeći cilj' : 'Next goal'}: {next.at} {isSr ? 'dana' : 'days'}
                    </span>
                    <span className="font-semibold text-[var(--color-warn)]">
                      {streak}/{next.at}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((streak / next.at) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-[var(--color-warn)]"
                    />
                  </div>
                </div>
              )}

              {/* Motivational hint */}
              <p className="mt-4 text-center text-[13px] text-[var(--color-ink-muted)]">
                {isSr
                  ? 'Unesi bar jednu transakciju dnevno da ne prekineš streak!'
                  : 'Log at least one transaction daily to keep your streak!'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
