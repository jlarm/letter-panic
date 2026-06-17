import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const { user, signIn, signUp } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) navigate({ to: '/' })
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const err = mode === 'login'
      ? await signIn(username, password)
      : await signUp(username, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">
          {mode === 'login' ? '▶ PLAYER LOGIN' : '✦ NEW PLAYER'}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">USERNAME</label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              maxLength={20}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">PASSWORD</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'LOADING...' : mode === 'login' ? 'PRESS START' : 'CREATE PLAYER'}
          </button>
        </form>

        <button
          className="auth-toggle"
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null) }}
        >
          {mode === 'login' ? 'New here? Register →' : '← Back to Login'}
        </button>
      </div>
    </div>
  )
}
