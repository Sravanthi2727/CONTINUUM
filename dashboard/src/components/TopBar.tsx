import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthUser } from '../api/client'
import type { ConnectionStatus } from '../hooks/useSocket'
import type { User } from '../types'
import { ConnectionIndicator } from './ConnectionIndicator'

interface Props {
  connectionStatus: ConnectionStatus
}

export function TopBar({ connectionStatus }: Props) {
  const [user, setUser] = useState<User | null>(() => getAuthUser())
  const navigate = useNavigate()

  useEffect(() => {
    const syncUser = () => setUser(getAuthUser())
    window.addEventListener('continuum_auth_change', syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener('continuum_auth_change', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login')
  }

  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--ink-raised)',
        padding: '0 var(--sp-8)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      <Link
        to="/"
        className="flex items-baseline"
        style={{ gap: 12, textDecoration: 'none' }}
        aria-label="Continuum home"
      >
        <span
          className="font-display"
          style={{
            fontWeight: 800,
            fontSize: 'var(--text-xl)',
            color: 'var(--fossil)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontStretch: '115%',
          }}
        >
          continuum
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Memory that outlives the session.
        </span>
      </Link>

      <div className="flex items-center" style={{ gap: 'var(--sp-4)' }}>
        {user ? (
          <div className="flex items-center" style={{ gap: 'var(--sp-3)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--lichen)',
                background: 'rgba(169, 194, 122, 0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(232, 224, 210, 0.15)',
                color: 'var(--fossil-dim)',
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{
              color: 'var(--saffron)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid var(--saffron)',
              padding: '4px 10px',
              borderRadius: 4,
            }}
          >
            SIGN IN
          </Link>
        )}

        <ConnectionIndicator status={connectionStatus} />
      </div>
    </header>
  )
}
