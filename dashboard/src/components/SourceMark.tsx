import type { Run } from '../types'

interface Props {
  source: Run['source']
  agentName?: string
  size?: 'sm' | 'md'
  onFill?: boolean
  variant?: 'default' | 'on-light' | 'on-fault'
}

export function SourceMark({ source, agentName, size = 'md', onFill = false, variant }: Props) {
  const isAgent = source === 'agent'
  const computedVariant = variant ?? (onFill ? 'on-light' : 'default')

  let color = isAgent ? 'var(--glacier)' : 'var(--sandstone)'
  let bg = isAgent ? 'rgba(127,209,193,0.14)' : 'rgba(201,162,126,0.14)'
  let border = 'none'

  if (computedVariant === 'on-light') {
    color = 'var(--ink)'
    bg = 'rgba(36,26,43,0.12)'
  } else if (computedVariant === 'on-fault') {
    color = 'var(--fossil)'
    bg = 'rgba(36,26,43,0.35)'
    border = '1px solid rgba(232,224,210,0.25)'
  }

  const label = isAgent ? (agentName ?? 'agent') : 'human'
  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)'
  const iconSize = size === 'sm' ? 9 : 11

  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5,
        color,
        background: bg,
        border,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        fontSize,
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
      }}
      aria-label={`Source: ${label}`}
    >
      {isAgent ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" aria-hidden>
          <polygon points="6,1 11,3.5 11,8.5 6,11 1,8.5 1,3.5" fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" aria-hidden>
          <circle cx="6" cy="4" r="2.5" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M1 11 C1 8 3 7 6 7 C9 7 11 8 11 11" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </span>
  )
}
