import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthUser } from '../api/client'
import type { ConnectionStatus } from '../hooks/useSocket'
import type { User } from '../types'
import { ConnectionIndicator } from './ConnectionIndicator'

interface Props {
  connectionStatus: ConnectionStatus
}

export function TopBar({ connectionStatus }: Props) {
  const { pathname } = useLocation()
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

  const isDocsActive = pathname.startsWith('/docs') || pathname.startsWith('/documentation')
  const isProjectsActive = pathname.startsWith('/projects')

  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--ink-raised)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--sp-6)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Wordmark */}
      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'baseline', gap: 12, textDecoration: 'none' }}
        aria-label="Continuum home"
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'var(--text-xl)',
            color: 'var(--fossil)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          continuum
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            fontStyle: 'italic',
            fontFamily: 'var(--font-body)',
          }}
        >
          Memory that outlives the session.
        </span>
      </Link>

      {/* Navigation + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)' }}>
        {/* Nav links */}
        <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: pathname === '/' ? 'var(--saffron)' : 'var(--fossil-dim)',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 700 : 500,
              letterSpacing: '0.02em',
              transition: 'color 0.15s',
            }}
          >
            Home
          </Link>

          <Link
            to="/projects"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: isProjectsActive ? 'var(--saffron)' : 'var(--fossil-dim)',
              textDecoration: 'none',
              fontWeight: isProjectsActive ? 700 : 500,
              letterSpacing: '0.02em',
              transition: 'color 0.15s',
            }}
          >
            Projects
          </Link>

          <Link
            to="/docs"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: isDocsActive ? 'var(--saffron)' : 'var(--fossil-dim)',
              textDecoration: 'none',
              fontWeight: isDocsActive ? 700 : 500,
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s',
            }}
          >
            <span>Documentation</span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: isDocsActive ? 'var(--ink)' : 'var(--glacier)',
                background: isDocsActive ? 'var(--saffron)' : 'rgba(127, 209, 193, 0.12)',
                border: isDocsActive ? '1px solid var(--saffron)' : '1px solid rgba(127, 209, 193, 0.25)',
                padding: '1px 5px',
                borderRadius: 3,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              CNT
            </span>
          </Link>
        </nav>

        {/* User / Auth status */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--lichen)',
                background: 'rgba(169, 194, 122, 0.1)',
                border: '1px solid rgba(169, 194, 122, 0.25)',
                padding: '2px 8px',
                borderRadius: 3,
                fontWeight: 600,
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
                borderRadius: 3,
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
              padding: '3px 9px',
              borderRadius: 3,
              letterSpacing: '0.02em',
            }}
          >
            SIGN IN
          </Link>
        )}

        {/* Live indicator */}
        <ConnectionIndicator status={connectionStatus} />
      </div>
    </header>
  )
}
