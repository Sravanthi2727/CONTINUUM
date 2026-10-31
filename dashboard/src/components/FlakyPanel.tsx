import type { Finding } from '../types'

interface Props {
  findings: Finding[]
}

export function FlakyPanel({ findings }: Props) {
  const flaky = findings.filter(f => f.type === 'flaky_test' || f.type === 'regression')
  if (flaky.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {flaky.map(f => {
        const isFlaky = f.type === 'flaky_test'
        const color = isFlaky ? 'var(--saffron)' : 'var(--fault)'
        const bg = isFlaky ? 'rgba(227,169,43,0.08)' : 'rgba(240,69,127,0.08)'
        const verdict = (f.details.verdict as string | undefined) ?? f.type
        const rate = f.details.failure_rate as number | undefined
        const testName = f.details.test_name as string | undefined

        return (
          <div
            key={f._id}
            style={{
              background: bg,
              borderLeft: `3px solid ${color}`,
              padding: '10px 14px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
            role="region"
            aria-label={`${verdict} finding`}
          >
            {/* Verdict label */}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'var(--text-lg)',
                color,
                flexShrink: 0,
                lineHeight: 1,
                paddingTop: 2,
              }}
            >
              {verdict}
            </span>

            <div>
              {testName && (
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--fossil)',
                  marginBottom: 4,
                }}>
                  {testName}
                </p>
              )}
              {rate !== undefined && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)' }}>
                  Failure rate:{' '}
                  <span style={{ color, fontWeight: 600 }}>
                    {Math.round(rate * 100)}%
                  </span>
                  {' '}over recent runs
                </p>
              )}
              {typeof f.details.introduced_in_run === 'string' && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginTop: 4 }}>
                  First seen in run{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fossil)' }}>
                    {f.details.introduced_in_run}
                  </span>
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
