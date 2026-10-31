interface Props {
  label?: string
}

export function Loader({ label = 'Loading…' }: Props) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 'var(--sp-12)',
        color: 'var(--fossil-dim)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--ink-raised)" strokeWidth="2" />
        <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="var(--fossil-dim)" strokeWidth="2" strokeLinecap="round"
          style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '10px 10px' }}
        />
      </svg>
      {label}
    </div>
  )
}
