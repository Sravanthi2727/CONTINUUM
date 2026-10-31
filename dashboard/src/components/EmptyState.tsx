interface Props {
  title: string
  body?: string
}

export function EmptyState({ title, body }: Props) {
  return (
    <div
      style={{
        padding: 'var(--sp-12) var(--sp-8)',
        color: 'var(--fossil-dim)',
        textAlign: 'center',
      }}
    >
      {/* Stratum glyph — a few thin horizontal lines */}
      <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden style={{ marginBottom: 16, opacity: 0.4 }}>
        <rect x="0" y="4"  width="48" height="5" rx="0" fill="var(--ink-raised)" />
        <rect x="0" y="13" width="48" height="5" rx="0" fill="var(--ink-raised)" />
        <rect x="0" y="22" width="48" height="5" rx="0" fill="var(--ink-raised)" />
      </svg>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--fossil)', marginBottom: 6 }}>
        {title}
      </p>
      {body && (
        <p style={{ fontSize: 'var(--text-sm)', maxWidth: 360, margin: '0 auto' }}>{body}</p>
      )}
    </div>
  )
}
