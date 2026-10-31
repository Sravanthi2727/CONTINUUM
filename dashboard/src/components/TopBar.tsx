import { Link } from 'react-router-dom'
import type { ConnectionStatus } from '../hooks/useSocket'
import { ConnectionIndicator } from './ConnectionIndicator'

interface Props {
  connectionStatus: ConnectionStatus
}

export function TopBar({ connectionStatus }: Props) {
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

      <ConnectionIndicator status={connectionStatus} />
    </header>
  )
}
