import { Link } from 'react-router-dom'
import type { SimilarFailure } from '../types'
import { similarityPct } from '../utils/format'
import { relativeTime } from '../utils/time'

interface Props {
  failures: SimilarFailure[]
}

export function DepthMarkers({ failures }: Props) {
  if (failures.length === 0) {
    return (
      <p style={{ color: 'var(--fossil-dim)', fontSize: 'var(--text-sm)', padding: 'var(--sp-4) 0' }}>
        No similar failures found.
      </p>
    )
  }

  const sorted = [...failures].sort((a, b) => b.similarity - a.similarity)
  const SCALE_H = 240
  const TOP_PAD = 18
  const RULER_X = 54
  const CARD_X = 104
  const ROW_MIN_H = 74

  // Calculate non-overlapping vertical positions for each failure row
  const layout = sorted.map((f, i) => {
    const clamped = Math.min(Math.max(f.similarity, 0), 1)
    const notchY = TOP_PAD + (1 - clamped) * SCALE_H
    return { f, i, notchY, rowY: 0 }
  })

  let currentY = TOP_PAD
  layout.forEach((item, idx) => {
    const idealY = Math.max(TOP_PAD, item.notchY - 14)
    item.rowY = idx === 0 ? idealY : Math.max(idealY, currentY + 12)
    currentY = item.rowY + ROW_MIN_H
  })

  const totalHeight = Math.max(SCALE_H + TOP_PAD * 2, currentY + 16)

  return (
    <div
      className="depth-markers-wrap relative"
      role="region"
      aria-label="Depth marker scale of similar past failures"
      style={{
        position: 'relative',
        height: totalHeight,
        minWidth: 320,
        maxWidth: 720,
      }}
    >
      {/* SVG Axis, ticks, and leader lines */}
      <svg
        width="100%"
        height={totalHeight}
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
      >
        {/* Vertical ruler spine */}
        <line
          x1={RULER_X}
          y1={TOP_PAD}
          x2={RULER_X}
          y2={TOP_PAD + SCALE_H}
          stroke="var(--ink-raised)"
          strokeWidth="3"
        />

        {/* Ruler ticks every 25% */}
        {[1, 0.75, 0.5, 0.25, 0].map(pct => {
          const y = TOP_PAD + (1 - pct) * SCALE_H
          return (
            <g key={pct}>
              <line
                x1={RULER_X - 6}
                y1={y}
                x2={RULER_X + 6}
                y2={y}
                stroke="var(--ink-raised)"
                strokeWidth="2"
              />
              <text
                x={RULER_X - 10}
                y={y + 3}
                fill="var(--fossil-dim)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {Math.round(pct * 100)}%
              </text>
            </g>
          )
        })}

        {/* Notches and leader lines to cards */}
        {layout.map(({ f, i, notchY, rowY }) => {
          const isTop = i === 0
          const color = isTop ? 'var(--fault)' : 'var(--fossil-dim)'
          const cardAnchorY = rowY + 18
          const elbow1X = RULER_X + 16
          const elbow2X = CARD_X - 14

          return (
            <g key={`${f.run_id}-${f.event_id}`}>
              {/* Leader path */}
              <path
                d={`M ${RULER_X} ${notchY} L ${elbow1X} ${notchY} L ${elbow2X} ${cardAnchorY} L ${CARD_X} ${cardAnchorY}`}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={isTop ? 'none' : '3 3'}
              />
              {/* Diamond depth pin */}
              <rect
                x={RULER_X - 4}
                y={notchY - 4}
                width="8"
                height="8"
                fill={color}
                stroke="var(--ink)"
                strokeWidth="1.5"
                transform={`rotate(45 ${RULER_X} ${notchY})`}
              />
            </g>
          )
        })}
      </svg>

      {/* Failure cards */}
      {layout.map(({ f, i, rowY }) => {
        const isTop = i === 0
        const accent = isTop ? 'var(--fault)' : 'var(--fossil-dim)'

        return (
          <div
            key={`${f.run_id}-${f.event_id}-card`}
            style={{
              position: 'absolute',
              left: CARD_X,
              top: rowY,
              right: 0,
              background: 'var(--ink-raised)',
              borderLeft: `3px solid ${accent}`,
              padding: '8px 12px',
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between" style={{ gap: 8 }}>
              <Link
                to={`/runs/${f.run_id}`}
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: isTop ? 'var(--fault)' : 'var(--fossil)',
                  textDecoration: 'underline',
                  textDecorationColor: isTop ? 'var(--fault)' : 'rgba(232,224,210,0.3)',
                }}
              >
                {similarityPct(f.similarity)} similar
              </Link>

              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
                {relativeTime(f.created_at)}
              </span>
            </div>

            <p
              className="font-mono"
              style={{
                fontSize: 'var(--text-xs)',
                color: isTop ? 'var(--fault)' : 'var(--fossil-dim)',
                marginTop: 4,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {f.error_message}
            </p>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginTop: 4 }}>
              Past run{' '}
              <Link
                to={`/runs/${f.run_id}`}
                className="font-mono"
                style={{ color: 'var(--fossil)', textDecoration: 'underline' }}
              >
                {f.run_id}
              </Link>
            </p>
          </div>
        )
      })}
    </div>
  )
}
