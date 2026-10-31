import type { Divergence, RunEvent } from '../types'
import { eventSummary, truncate } from '../utils/format'

interface Props {
  divergence: Divergence
}

function Stop({
  step,
  color,
  summary,
  errorMessage,
  match,
}: {
  step: number
  color: string
  summary: string
  errorMessage?: string
  match?: boolean
}) {
  return (
    <div className="flex items-start" style={{ gap: 12, minHeight: 52, marginBottom: 6 }}>
      <div className="flex flex-col items-center" style={{ width: 28, flexShrink: 0 }}>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
          {step}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <circle cx="7" cy="7" r="5" fill={color} stroke="var(--ink)" strokeWidth="2" />
          {match === false && (
            <line x1="4" y1="4" x2="10" y2="10" stroke="var(--ink)" strokeWidth="1.4" />
          )}
        </svg>
      </div>
      <div style={{ paddingTop: 8, maxWidth: '62ch' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil)', lineHeight: 1.4 }}>
          {truncate(summary, 110)}
        </p>
        {errorMessage && (
          <p
            className="font-mono"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--fault)', marginTop: 4, wordBreak: 'break-word' }}
          >
            {truncate(errorMessage, 120)}
          </p>
        )}
      </div>
    </div>
  )
}

function PathColumn({
  title,
  color,
  items,
}: {
  title: string
  color: string
  items: { step: number; event?: RunEvent }[]
}) {
  return (
    <div className="min-w-0 flex-1">
      <p style={{ fontSize: 'var(--text-xs)', color, fontWeight: 700, marginBottom: 8 }}>{title}</p>
      <div
        style={{
          borderLeft: `2px solid ${color}`,
          paddingLeft: 10,
        }}
      >
        {items.length === 0 && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', padding: '8px 0' }}>No further events</p>
        )}
        {items.map(item => (
          <Stop
            key={`${title}-${item.step}`}
            step={item.step}
            color={color}
            summary={eventSummary(item.event)}
            errorMessage={item.event?.error_message}
            match={color === 'var(--lichen)'}
          />
        ))}
      </div>
    </div>
  )
}

export function ForkTrack({ divergence }: Props) {
  const { aligned, first_mismatch_step, explanation } = divergence
  const forkIdx = aligned.findIndex(a => !a.match)
  const shared = forkIdx < 0 ? aligned : aligned.slice(0, forkIdx)
  const fork = forkIdx >= 0 ? aligned[forkIdx] : undefined
  const after = forkIdx >= 0 ? aligned.slice(forkIdx + 1) : []

  const baselineAfter = [
    ...(fork?.baseline ? [{ step: fork.step, event: fork.baseline }] : []),
    ...after.filter(a => a.baseline).map(a => ({ step: a.step, event: a.baseline })),
  ]
  const currentAfter = [
    ...(fork?.current ? [{ step: fork.step, event: fork.current }] : []),
    ...after.filter(a => a.current).map(a => ({ step: a.step, event: a.current })),
  ]

  return (
    <div
      className="fork-track"
      role="region"
      aria-label="Divergence track"
    >
      {/* Shared baseline line up to the mismatch */}
      <div style={{ borderLeft: '2px solid var(--fossil-dim)', paddingLeft: 4 }}>
        {shared.map(entry => (
          <Stop
            key={`shared-${entry.step}`}
            step={entry.step}
            color="var(--lichen)"
            summary={eventSummary(entry.current ?? entry.baseline)}
            errorMessage={entry.current?.error_message ?? entry.baseline?.error_message}
            match
          />
        ))}
      </div>

      {/* The Fork: SVG split + explanation callout */}
      {fork && (
        <div className="relative" style={{ margin: '8px 0 16px' }}>
          <svg
            className="fork-track-svg"
            width="100%"
            height="52"
            viewBox="0 0 320 52"
            aria-hidden
            style={{ display: 'block', maxWidth: 360 }}
          >
            <line x1="18" y1="0" x2="18" y2="18" stroke="var(--fossil-dim)" strokeWidth="2" />
            <line x1="18" y1="18" x2="70" y2="48" stroke="var(--lichen)" strokeWidth="2" />
            <line x1="18" y1="18" x2="250" y2="48" stroke="var(--fault)" strokeWidth="2" />
            <circle cx="18" cy="18" r="6" fill="var(--saffron)" stroke="var(--ink)" strokeWidth="2" />
          </svg>
          <div
            style={{
              background: 'var(--ink-raised)',
              borderLeft: '3px solid var(--saffron)',
              padding: '10px 14px',
              marginTop: 4,
              maxWidth: '68ch',
            }}
          >
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--saffron)', fontWeight: 600, marginBottom: 4 }}>
              Split at step {first_mismatch_step ?? fork.step}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil)', lineHeight: 1.45 }}>
              {explanation}
            </p>
          </div>
        </div>
      )}

      {/* Split paths: Baseline on left (lichen), This run on right (fault pink) */}
      {fork && (
        <div className="fork-after flex" style={{ gap: 24 }}>
          <PathColumn title="Last good run" color="var(--lichen)" items={baselineAfter} />
          <PathColumn title="This run" color="var(--fault)" items={currentAfter} />
        </div>
      )}
    </div>
  )
}
