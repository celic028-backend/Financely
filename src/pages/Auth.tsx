import { useState } from 'react'
import { Sparkles, Mail, Lock, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { srAuthError } from '../lib/authErrors'

type Mode = 'login' | 'signup' | 'reset'

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setNotice(null)
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (mode === 'signup' && password !== confirm) {
      setError('Lozinke se ne poklapaju.')
      return
    }

    setLoading(true)

    if (mode === 'reset') {
      const err = await resetPassword(email)
      if (err) setError(srAuthError(err))
      else setNotice('Poslali smo ti link za novu lozinku — proveri email.')
      setLoading(false)
      return
    }

    const err = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    if (err) {
      setError(srAuthError(err))
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      setNotice('Proveri email za potvrdu naloga.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="brand-bg mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Financely</h1>
          <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
            Prati troškove, štedi pametnije
          </p>
        </div>

        {/* Tab toggle login/signup */}
        {mode !== 'reset' && (
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="rounded-xl py-2.5 text-[14px] font-semibold transition-all"
              style={{
                background: mode === 'login' ? 'var(--color-surface)' : 'transparent',
                color: mode === 'login' ? 'var(--color-brand)' : 'var(--color-ink-muted)',
                boxShadow: mode === 'login' ? 'var(--shadow-card)' : 'none',
              }}
            >
              Prijava
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="rounded-xl py-2.5 text-[14px] font-semibold transition-all"
              style={{
                background: mode === 'signup' ? 'var(--color-surface)' : 'transparent',
                color: mode === 'signup' ? 'var(--color-brand)' : 'var(--color-ink-muted)',
                boxShadow: mode === 'signup' ? 'var(--shadow-card)' : 'none',
              }}
            >
              Registracija
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <div className="mb-5">
            <h2 className="text-center text-[18px] font-bold">Nova lozinka</h2>
            <p className="mt-1 text-center text-[13px] text-[var(--color-ink-muted)]">
              Unesite email i poslaćemo vam link za reset.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
            <Mail className="h-5 w-5 shrink-0 text-[var(--color-ink-faint)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
            />
          </div>

          {/* Password */}
          {mode !== 'reset' && (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <Lock className="h-5 w-5 shrink-0 text-[var(--color-ink-faint)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lozinka"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
              />
            </div>
          )}

          {/* Confirm password — samo za registraciju */}
          {mode === 'signup' && (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--color-ink-faint)]" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Potvrdi lozinku"
                required
                minLength={6}
                autoComplete="new-password"
                className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-[var(--color-expense-soft)] px-4 py-2.5 text-[13px] text-[var(--color-expense)]">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl bg-[var(--color-income-soft)] px-4 py-2.5 text-[13px] text-[var(--color-income)]">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brand-bg flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {mode === 'reset' ? 'Pošalji link' : mode === 'signup' ? 'Registruj se' : 'Prijavi se'}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => switchMode('reset')}
            className="mt-4 w-full text-center text-[13px] text-[var(--color-ink-muted)]"
          >
            Zaboravio si lozinku?
          </button>
        )}

        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="mt-4 flex w-full items-center justify-center gap-1 text-center text-[14px] text-[var(--color-brand)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad na prijavu
          </button>
        )}

        <p className="mt-6 text-center text-[12px] text-[var(--color-ink-faint)]">
          Tvoji podaci se čuvaju lokalno i sinhronizuju sa tvojim nalogom.
        </p>
      </div>
    </div>
  )
}
