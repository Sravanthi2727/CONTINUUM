import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ConnectionStatus } from '../../hooks/useSocket'

interface HomeHeaderProps {
  connectionStatus: ConnectionStatus
}

export function HomeHeader({ connectionStatus }: HomeHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isConnected = connectionStatus === 'connected'

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const el = document.getElementById('how-it-works')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 20,
        height: 'var(--topbar-h)',
        padding: '0 var(--sp-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(232, 224, 210, 0.08)',
        background: 'rgba(36, 26, 43, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: Wordmark */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          textDecoration: 'none',
        }}
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
          }}
        >
          continuum
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.02em',
          }}
        >
          memory for builds
        </span>
      </Link>

      {/* Right Desktop Nav */}
      <nav
        className="hidden md:flex items-center"
        aria-label="Homepage navigation"
        style={{
          gap: 'var(--sp-6)',
        }}
      >
        {/* Home Link (Active with filled dot) */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'var(--fossil)',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: 'var(--saffron)',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          Home
        </Link>

        {/* Projects Link */}
        <Link
          to="/projects"
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            color: 'var(--fossil-dim)',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--fossil)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--fossil-dim)')}
        >
          Projects
        </Link>

        {/* Documentation Link */}
        <Link
          to="/docs"
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            color: 'var(--fossil-dim)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color 0.15s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--fossil)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--fossil-dim)')}
        >
          <span>Docs</span>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--glacier)',
              background: 'rgba(127, 209, 193, 0.12)',
              border: '1px solid rgba(127, 209, 193, 0.25)',
              padding: '1px 4px',
              borderRadius: 2,
            }}
          >
            CNT
          </span>
        </Link>

        {/* How it works anchor */}
        <a
          href="#how-it-works"
          onClick={scrollToHowItWorks}
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            color: 'var(--fossil-dim)',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--fossil)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--fossil-dim)')}
        >
          How it works
        </a>

        {/* Live Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: isConnected ? 'var(--lichen)' : 'var(--fossil-dim)',
            paddingLeft: 'var(--sp-2)',
            borderLeft: '1px solid rgba(232, 224, 210, 0.12)',
          }}
          title={isConnected ? 'Live WebSocket connected' : 'Connecting/Offline'}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--lichen)' : 'transparent',
              border: isConnected ? 'none' : '1.5px solid var(--fossil-dim)',
              display: 'inline-block',
              boxShadow: isConnected ? '0 0 8px rgba(169, 194, 122, 0.5)' : 'none',
            }}
            aria-hidden="true"
          />
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </nav>

      {/* Mobile Menu Toggle Button */}
      <button
        type="button"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
        style={{
          background: 'none',
          border: '1px solid rgba(232, 224, 210, 0.15)',
          color: 'var(--fossil)',
          padding: '4px 10px',
          borderRadius: 3,
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}
      >
        {mobileMenuOpen ? 'Close' : 'Menu'}
      </button>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--topbar-h)',
            left: 0,
            right: 0,
            background: 'var(--ink-raised)',
            borderBottom: '1px solid rgba(232, 224, 210, 0.15)',
            padding: 'var(--sp-4) var(--sp-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
            zIndex: 100,
          }}
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: 'var(--saffron)', fontSize: 'var(--text-sm)', fontWeight: 600, textDecoration: 'none' }}
          >
            ● Home
          </Link>
          <Link
            to="/projects"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: 'var(--fossil)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
          >
            Projects
          </Link>
          <Link
            to="/docs"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: 'var(--fossil)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
          >
            Documentation (CNT CLI)
          </Link>
          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            style={{ color: 'var(--fossil-dim)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
          >
            How it works
          </a>
          <div
            style={{
              paddingTop: 'var(--sp-2)',
              borderTop: '1px solid rgba(232, 224, 210, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: isConnected ? 'var(--lichen)' : 'var(--fossil-dim)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--lichen)' : 'transparent',
                border: isConnected ? 'none' : '1.5px solid var(--fossil-dim)',
              }}
            />
            <span>{isConnected ? 'Live WebSocket active' : 'Connecting to API'}</span>
          </div>
        </div>
      )}
    </header>
  )
}

