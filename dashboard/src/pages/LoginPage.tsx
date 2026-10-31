import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthUser, setAuthSession } from '../api/client'
import { authLogin, authRegister } from '../api/endpoints'
import type { User } from '../types'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getAuthUser())
  const navigate = useNavigate()

  useEffect(() => {
    const syncUser = () => setCurrentUser(getAuthUser())
    window.addEventListener('continuum_auth_change', syncUser)
    return () => window.removeEventListener('continuum_auth_change', syncUser)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let res
      if (isRegister) {
        res = await authRegister(email, password, name)
      } else {
        res = await authLogin(email, password)
      }

      setAuthSession(res.token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError(null)
    setLoading(true)
    setEmail('demo@continuum.dev')
    setPassword('password123')
    try {
      const res = await authLogin('demo@continuum.dev', 'password123')
      setAuthSession(res.token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with demo credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setCurrentUser(null)
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        minHeight: 'calc(100vh - var(--topbar-h))',
        background: 'var(--ink)',
        padding: 'var(--sp-6)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--ink-raised)',
          border: '1px solid var(--ink-border)',
          borderRadius: 4,
          padding: 'var(--sp-8)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
          <div
            className="font-display"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--saffron)',
              marginBottom: 'var(--sp-2)',
              fontWeight: 700,
            }}
          >
            CONTINUUM ACCESS
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--sp-2)',
            }}
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </h1>
          <p style={{ color: 'var(--fossil-dim)', fontSize: 'var(--text-xs)' }}>
            Telemetry, failure intelligence, and run memories.
          </p>
        </div>

        {currentUser && (
          <div
            style={{
              background: 'rgba(169, 194, 122, 0.08)',
              border: '1px solid var(--lichen)',
              padding: 'var(--sp-4)',
              borderRadius: 4,
              marginBottom: 'var(--sp-6)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div style={{ color: 'var(--lichen)', fontWeight: 700, marginBottom: 4 }}>
              Active Session: {currentUser.name}
            </div>
            <div style={{ color: 'var(--fossil-dim)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              {currentUser.email}
            </div>
            <div className="flex" style={{ gap: 'var(--sp-2)' }}>
              <Link
                to="/"
                style={{
                  background: 'var(--lichen)',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 3,
                  fontSize: 'var(--text-xs)',
                }}
              >
                Go to Projects &rarr;
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--ink-border)',
                  color: 'var(--fossil-dim)',
                  padding: '6px 12px',
                  borderRadius: 3,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: 'rgba(240, 69, 127, 0.12)',
              border: '1px solid var(--fault)',
              color: 'var(--fault)',
              padding: 'var(--sp-3)',
              borderRadius: 4,
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--sp-4)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {isRegister && (
            <div>
              <label
                htmlFor="auth-name"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--fossil-dim)',
                  marginBottom: 'var(--sp-1)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                NAME
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Developer or Agent ID"
                style={{
                  width: '100%',
                  background: 'var(--ink)',
                  border: '1px solid var(--ink-border)',
                  borderRadius: 3,
                  padding: '10px 12px',
                  color: 'var(--fossil)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                color: 'var(--fossil-dim)',
                marginBottom: 'var(--sp-1)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              EMAIL
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@continuum.dev"
              style={{
                width: '100%',
                background: 'var(--ink)',
                border: '1px solid var(--ink-border)',
                borderRadius: 3,
                padding: '10px 12px',
                color: 'var(--fossil)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                color: 'var(--fossil-dim)',
                marginBottom: 'var(--sp-1)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              PASSWORD
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                background: 'var(--ink)',
                border: '1px solid var(--ink-border)',
                borderRadius: 3,
                padding: '10px 12px',
                color: 'var(--fossil)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--saffron)',
              color: 'var(--ink)',
              border: 'none',
              borderRadius: 3,
              padding: '10px',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 'var(--sp-2)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'AUTHENTICATING...' : isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>

        <div
          style={{
            marginTop: 'var(--sp-5)',
            paddingTop: 'var(--sp-4)',
            borderTop: '1px solid var(--ink-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px dashed var(--lichen)',
              color: 'var(--lichen)',
              borderRadius: 3,
              padding: '8px 12px',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ⚡ 1-Click Demo Login (demo@continuum.dev)
          </button>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false)
                    setError(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--glacier)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true)
                    setError(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--glacier)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Create one
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
