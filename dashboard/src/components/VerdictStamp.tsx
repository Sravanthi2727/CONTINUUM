import type { Run } from '../types'

interface Props {
  verdict: Run['verdict']
}

const VERDICT_CONFIG = {
  safe: { label: 'Safe', color: 'var(--lichen)' },
  risky: { label: 'Risky', color: 'var(--saffron)' },
  blocked: { label: 'Blocked', color: 'var(--fault)' },
}

export function VerdictStamp({ verdict }: Props) {
  if (!verdict) return null
  const cfg = VERDICT_CONFIG[verdict]

  return (
    <div
      aria-label={`Verdict: ${cfg.label}`}
      style={{
        display: 'inline-block',
        transform: 'rotate(-4deg)',
        border: `4px solid ${cfg.color}`,
        outline: `1px solid ${cfg.color}`,
        outlineOffset: -7,
        padding: '8px 22px 10px',
        userSelect: 'none',
      }}
    >
      <span
        className="font-display block"
        style={{
          fontWeight: 800,
          fontSize: 'var(--text-4xl)',
          color: cfg.color,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontStretch: '115%',
        }}
      >
        {cfg.label}
      </span>
    </div>
  )
}
