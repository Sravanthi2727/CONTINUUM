interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      style={{
        padding: 'var(--sp-8)',
        borderLeft: '3px solid var(--fault)',
        margin: 'var(--sp-6)',
        background: 'rgba(240,69,127,0.06)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--fault)', marginBottom: 4, fontSize: 'var(--text-sm)' }}>
        Something went wrong
      </p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginBottom: onRetry ? 12 : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--fossil)',
            background: 'var(--ink-raised)',
            padding: '4px 12px',
            cursor: 'pointer',
            border: '1px solid var(--fossil-dim)',
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}
