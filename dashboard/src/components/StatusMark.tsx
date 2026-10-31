import type { Run } from '../types'

interface Props {
  status: Run['status']
  size?: 'sm' | 'md'
  onFill?: boolean
}

const LABELS = { running: 'Running', success: 'Success', failed: 'Failed' }

export function StatusMark({ status, size = 'md', onFill = false }: Props) {
  const dim = size === 'sm' ? 10 : 13
  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)'
  const color = onFill
    ? status === 'failed'
      ? 'var(--fossil)'
      : 'var(--ink)'
    : status === 'running'
      ? 'var(--saffron)'
      : status === 'success'
        ? 'var(--lichen)'
        : 'var(--fault)'

  return (
    <span
      className="inline-flex items-center"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color, flexShrink: 0 }}
      aria-label={`Status: ${LABELS[status]}`}
    >
      {status === 'running' && (
        <svg width={dim} height={dim} viewBox="0 0 12 12" aria-hidden>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke={color} strokeWidth="1.8" />
          <rect x="5" y="2" width="2" height="4" fill={color} />
        </svg>
      )}
      {status === 'success' && (
        <svg width={dim} height={dim} viewBox="0 0 12 12" aria-hidden>
          <polyline points="2,6 5,9 10,3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'failed' && (
        <svg width={dim} height={dim} viewBox="0 0 12 12" aria-hidden>
          <polygon points="6,1 11,11 1,11" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="6" y1="5" x2="6" y2="8" stroke={color} strokeWidth="1.6" />
          <circle cx="6" cy="9.6" r="0.7" fill={color} />
        </svg>
      )}
      <span style={{ fontSize, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
        {LABELS[status]}
      </span>
    </span>
  )
}
