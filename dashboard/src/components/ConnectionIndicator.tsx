import type { ConnectionStatus } from '../hooks/useSocket'

interface Props {
  status: ConnectionStatus
}

export function ConnectionIndicator({ status }: Props) {
  const connected = status === 'connected'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-body)',
        color: connected ? 'var(--lichen)' : 'var(--fossil-dim)',
      }}
      aria-live="polite"
      aria-label={connected ? 'Live connection active' : 'Reconnecting to server'}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
        {connected ? (
          <circle cx="4" cy="4" r="3.5" fill="var(--lichen)"
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
        ) : (
          <circle cx="4" cy="4" r="3.5" fill="none" stroke="var(--fossil-dim)" strokeWidth="1.5" />
        )}
      </svg>
      {connected ? 'Live' : 'Reconnecting'}
    </span>
  )
}
