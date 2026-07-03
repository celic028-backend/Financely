import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { srAuthError } from '../lib/authErrors'

/** Stranica na koju vodi link iz "zaboravljena lozinka" emaila. */
export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Lozinke se ne poklapaju.')
      return
    }
    setLoading(true)
    const err = await updatePassword(password)
    if (err) {
      setError(srAuthError(err))
      setLoading(false)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-xl font-bold">Nova lozinka</h1>
        <p className="mb-6 text-center text-[13px] text-[var(--color-ink-muted)]">
          Unesi novu lozinku za svoj nalog.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
            <Lock className="h-5 w-5 shrink-0 text-[var(--color-ink-faint)]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova lozinka"
              required
              minLength={6}
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
            <Lock className="h-5 w-5 shrink-0 text-[var(--color-ink-faint)]" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ponovi lozinku"
              required
              minLength={6}
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[var(--color-expense-soft)] px-4 py-2.5 text-[13px] text-[var(--color-expense)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brand-bg flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            Sačuvaj lozinku
          </button>
        </form>
      </div>
    </div>
  )
}
