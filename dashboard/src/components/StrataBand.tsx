import { useEffect, useRef, useState } from 'react'
import type { Run } from '../types'
import { shortSha, truncate } from '../utils/format'
import { formatDuration, relativeTime } from '../utils/time'
import { SourceMark } from './SourceMark'
import { StatusMark } from './StatusMark'

interface Props {
  run: Run
  index: number
  isNew?: boolean
  onClick: (runId: string) => void
}

const STATUS_FILL: Record<Run['status'], string> = {
  running: 'var(--saffron)',
  success: 'var(--lichen)',
  failed: 'var(--fault)',
}

const SOURCE_EDGE: Record<Run['source'], string> = {
  human: 'var(--sandstone)',
  agent: 'var(--glacier)',
}

const FRACTURE_CLIP =
  'polygon(0 10px, 4% 2px, 9% 11px, 15% 3px, 22% 9px, 30% 1px, 38% 10px, 47% 2px, 55% 9px, 63% 1px, 72% 8px, 80% 2px, 88% 10px, 95% 3px, 100% 8px, 100% 100%, 0 100%)'

function bandHeight(run: Run): number {
  const start = new Date(run.started_at).getTime()
  const end = run.ended_at ? new Date(run.ended_at).getTime() : Date.now()
  const secs = Math.max(0, (end - start) / 1000)
  const ratio = Math.min(secs / 600, 1)
  return Math.round(56 + ratio * 80)
}

export function StrataBand({ run, index, isNew = false, onClick }: Props) {
  const fill = STATUS_FILL[run.status]
  const edge = SOURCE_EDGE[run.source]
  const height = bandHeight(run)
  const failed = run.status === 'failed'
  const onLight = run.status === 'success' || run.status === 'running'
  const text = onLight ? 'var(--ink)' : 'var(--fossil)'
  const muted = onLight ? 'rgba(36,26,43,0.72)' : 'var(--fossil)'
  const sourceVariant = run.status === 'failed' ? 'on-fault' : onLight ? 'on-light' : 'default'

  const wasFailed = useRef(run.status === 'failed')
  const [fracturing, setFracturing] = useState(false)
  const [highlighted, setHighlighted] = useState(isNew)

  useEffect(() => {
    if (run.status === 'failed' && !wasFailed.current) {
      setFracturing(true)
    }
    wasFailed.current = run.status === 'failed'
  }, [run.status])

  useEffect(() => {
    if (!isNew) return
    setHighlighted(true)
    const t = setTimeout(() => setHighlighted(false), 1800)
    return () => clearTimeout(t)
  }, [isNew])

  const label = run.task_description ?? run.triggered_by ?? 'Untitled run'
  const animDelay = `${Math.min(index, 12) * 50}ms`

  return (
    <button
      type="button"
      onClick={() => onClick(run._id)}
      aria-label={`${run.status} ${run.source} run: ${label}`}
      className="strata-band-btn w-full text-left"
      style={{
        height,
        background: fill,
        borderLeft: `6px solid ${edge}`,
        padding: '0 var(--sp-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        clipPath: failed ? FRACTURE_CLIP : 'none',
        animation: [
          isNew
            ? 'band-push-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : `strata-settle 0.5s ${animDelay} cubic-bezier(0.22, 1, 0.36, 1) both`,
          fracturing ? 'fracture-in 0.45s ease-out forwards' : '',
        ]
          .filter(Boolean)
          .join(', '),
        outline: highlighted ? `2px solid var(--ink)` : 'none',
        outlineOffset: -2,
      }}
    >
      <div className="min-w-0 flex-1" style={{ paddingTop: failed ? 8 : 0 }}>
        <p
          className="font-display"
          style={{
            fontWeight: 700,
            fontSize: height > 80 ? 'var(--text-lg)' : 'var(--text-base)',
            color: text,
            lineHeight: 1.2,
            marginBottom: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '70ch',
            fontStretch: '110%',
          }}
        >
          {truncate(label, 90)}
        </p>

        <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
          <SourceMark source={run.source} agentName={run.agent_name} size="sm" variant={sourceVariant} />
          {run.commit_sha && (
            <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: muted }}>
              {shortSha(run.commit_sha)}
            </span>
          )}
          <span style={{ fontSize: 'var(--text-xs)', color: muted }}>
            {relativeTime(run.started_at)}
          </span>
          {run.ended_at && (
            <span style={{ fontSize: 'var(--text-xs)', color: muted }}>
              {formatDuration(run.started_at, run.ended_at)}
            </span>
          )}
        </div>
      </div>

      <StatusMark status={run.status} size="sm" onFill />
    </button>
  )
}
