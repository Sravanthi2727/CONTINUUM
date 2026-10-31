import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = isRegister ? `${API_URL}/auth/register` : `${API_URL}/auth/login`
      const payload = isRegister ? { email, password, name } : { email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.token) {
        localStorage.setItem('continuum_token', data.token)
        localStorage.setItem('continuum_user', JSON.stringify(data.user))
        navigate('/')
        window.location.reload()
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
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
          maxWidth: 400,
          background: 'var(--ink-raised)',
          border: '1px solid rgba(232, 224, 210, 0.1)',
          borderRadius: 8,
          padding: 'var(--sp-8)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
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
            {isRegister ? 'Register Account' : 'Sign in to Continuum'}
          </h1>
          <p style={{ color: 'var(--fossil-dim)', fontSize: 'var(--text-xs)' }}>
            Memory that outlives the session.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(240, 69, 127, 0.15)',
              border: '1px solid var(--fault)',
              color: 'var(--fault)',
              padding: 'var(--sp-3)',
              borderRadius: 6,
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
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--fossil-dim)',
                  marginBottom: 'var(--sp-1)',
                  fontWeight: 600,
                }}
              >
                NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Developer Name"
                style={{
                  width: '100%',
                  background: 'var(--ink)',
                  border: '1px solid rgba(232, 224, 210, 0.15)',
                  borderRadius: 6,
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
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                color: 'var(--fossil-dim)',
                marginBottom: 'var(--sp-1)',
                fontWeight: 600,
              }}
            >
              EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%',
                background: 'var(--ink)',
                border: '1px solid rgba(232, 224, 210, 0.15)',
                borderRadius: 6,
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
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                color: 'var(--fossil-dim)',
                marginBottom: 'var(--sp-1)',
                fontWeight: 600,
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: 'var(--ink)',
                border: '1px solid rgba(232, 224, 210, 0.15)',
                borderRadius: 6,
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
              borderRadius: 6,
              padding: '10px',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 'var(--sp-2)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Processing...' : isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)', fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                style={{ background: 'none', border: 'none', color: 'var(--glacier)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign in
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                style={{ background: 'none', border: 'none', color: 'var(--glacier)', cursor: 'pointer', fontWeight: 600 }}
              >
                Create one
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
