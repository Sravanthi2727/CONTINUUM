import { useState } from 'react'
import type { RunEvent } from '../types'
import { eventSummary, truncate } from '../utils/format'
import { relativeTime } from '../utils/time'

interface Props {
  event: RunEvent
  highlighted?: boolean
}

function EventGlyph({ type, color }: { type: RunEvent['type']; color: string }) {
  const s = 14
  switch (type) {
    case 'command_run':
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <polyline points="2,4 6,7 2,10" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="7" y1="10" x2="12" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'tool_call':
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <rect x="3" y="5" width="8" height="6" rx="0" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="7" y1="5" x2="7" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="3" x2="9" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'diff_submitted':
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <line x1="2" y1="7" x2="12" y2="7" stroke={color} strokeWidth="1.5" />
          <line x1="7" y1="2" x2="7" y2="12" stroke={color} strokeWidth="1.5" />
        </svg>
      )
    case 'test_result':
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <polyline points="2,7 5,10 12,3" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'error':
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <line x1="3" y1="3" x2="11" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="11" y1="3" x2="3" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'plan_step':
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="7" y1="4" x2="7" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="7" cy="9.5" r="1" fill={color} />
        </svg>
      )
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" aria-hidden>
          <circle cx="7" cy="7" r="4" fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
      )
  }
}

export function EventItem({ event, highlighted = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isError = event.type === 'error'
  const color = isError ? 'var(--fault)' : highlighted ? 'var(--saffron)' : 'var(--fossil-dim)'
  const bg = isError ? 'rgba(240,69,127,0.08)' : highlighted ? 'rgba(227,169,43,0.08)' : 'transparent'

  return (
    <div
      className="flex"
      style={{
        gap: 'var(--sp-3)',
        padding: '8px var(--sp-4)',
        background: bg,
        borderLeft: isError ? '2px solid var(--fault)' : '2px solid transparent',
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 2, flexShrink: 0, paddingTop: 2 }}>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            lineHeight: 1,
            minWidth: 20,
            textAlign: 'right',
          }}
        >
          {event.step ?? ''}
        </span>
        <EventGlyph type={event.type} color={color} />
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          className="w-full text-left"
        >
          <span
            className="block"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: isError ? 'var(--fault)' : 'var(--fossil)',
              fontWeight: isError ? 600 : 400,
              wordBreak: 'break-word',
            }}
          >
            {truncate(eventSummary(event), 120)}
          </span>
          {isError && event.error_message && (
            <span className="font-mono block" style={{ fontSize: 'var(--text-xs)', color: 'var(--fault)', marginTop: 2 }}>
              {truncate(event.error_message, 100)}
            </span>
          )}
          <span className="block" style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginTop: 2 }}>
            {relativeTime(event.timestamp)}
            {Object.keys(event.payload).length > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>
                {expanded ? 'Hide payload' : 'Show payload'}
              </span>
            )}
          </span>
        </button>

        {expanded && Object.keys(event.payload).length > 0 && (
          <pre
            aria-label="Event payload"
            className="font-mono"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--fossil-dim)',
              background: 'var(--ink)',
              padding: 'var(--sp-3)',
              marginTop: 6,
              overflow: 'auto',
              maxHeight: 200,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
