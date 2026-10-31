import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProject } from '../api/endpoints'
import { DepthMarkers } from '../components/DepthMarkers'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { EventItem } from '../components/EventItem'
import { FlakyPanel } from '../components/FlakyPanel'
import { ForkTrack } from '../components/ForkTrack'
import { Loader } from '../components/Loader'
import { SourceMark } from '../components/SourceMark'
import { StatusMark } from '../components/StatusMark'
import { VerdictStamp } from '../components/VerdictStamp'
import { useRun } from '../hooks/useRun'
import type { Project, Run, RunEvent } from '../types'
import { shortSha } from '../utils/format'
import { formatDuration, relativeTime, shortTimestamp } from '../utils/time'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--sp-12)' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 'var(--text-lg)',
        color: 'var(--fossil)',
        marginBottom: 'var(--sp-4)',
        paddingBottom: 'var(--sp-2)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

// ─── Run header ───────────────────────────────────────────────────────────────

function RunHeader({ run }: { run: Run }) {
  const sourceEdge: Record<Run['source'], string> = {
    human: 'var(--sandstone)',
    agent: 'var(--glacier)',
  }

  return (
    <div style={{
      borderLeft: `5px solid ${sourceEdge[run.source]}`,
      paddingLeft: 'var(--sp-5)',
      paddingRight: 'var(--sp-5)',
      paddingTop: 'var(--sp-3)',
      paddingBottom: 'var(--sp-4)',
      marginBottom: 'var(--sp-8)',
      background: 'var(--ink-raised)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {/* Run ID */}
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginBottom: 6 }}>
          Run{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>{run._id}</span>
        </p>

        {/* Task / title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'var(--text-2xl)',
          color: 'var(--fossil)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: 'var(--sp-4)',
          maxWidth: '72ch',
        }}>
          {run.task_description ?? run.triggered_by}
        </h1>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <StatusMark status={run.status} />
          <SourceMark source={run.source} agentName={run.agent_name} />

          {run.commit_sha && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
              commit {shortSha(run.commit_sha)}
            </span>
          )}

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
            Started {shortTimestamp(run.started_at)} ({relativeTime(run.started_at)})
          </span>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
            {run.ended_at
              ? `Finished in ${formatDuration(run.started_at, run.ended_at)}`
              : 'Still running'}
          </span>
        </div>
      </div>

      {/* Verdict stamp */}
      {run.verdict && <VerdictStamp verdict={run.verdict} />}
    </div>
  )
}

// ─── Event sequence ───────────────────────────────────────────────────────────

function EventSequence({ events, highlightedStep }: { events: RunEvent[]; highlightedStep?: number }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No events recorded"
        body="Events will appear here as the run progresses."
      />
    )
  }

  return (
    <div
      role="list"
      aria-label="Event sequence"
      style={{ display: 'flex', flexDirection: 'column', borderLeft: '2px solid rgba(255,255,255,0.08)' }}
    >
      {events.map(evt => (
        <div key={evt._id} role="listitem">
          <EventItem
            event={evt}
            highlighted={highlightedStep !== undefined && evt.step === highlightedStep}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  onRunUpdate: (handler: (run: Run) => void) => void
  onEventCreate: (handler: (evt: RunEvent) => void) => void
  onReconnect?: (handler: () => void) => void
}

export function RunDetailPage({ onRunUpdate, onEventCreate, onReconnect }: Props) {
  const { runId } = useParams<{ runId: string }>()
  const {
    run, events, divergence, similarFailures, findings,
    loading, error, reload, updateRun, addEvent,
  } = useRun(runId ?? '')

  const [project, setProject] = useState<Project | null>(null)

  // Load project name for breadcrumb once the run is known
  useEffect(() => {
    if (!run?.project_id) return
    fetchProject(run.project_id).then(setProject).catch(() => {})
  }, [run?.project_id])

  // Register live socket handlers
  useEffect(() => {
    onRunUpdate(updateRun)
    onEventCreate(addEvent)
    return () => {
      onRunUpdate(() => {})
      onEventCreate(() => {})
    }
  }, [onRunUpdate, onEventCreate, updateRun, addEvent])

  // Refetch on socket reconnect so data is never missed
  useEffect(() => {
    if (!onReconnect) return
    onReconnect(reload)
    return () => onReconnect(() => {})
  }, [onReconnect, reload])

  if (!runId) return <ErrorState message="No run ID in URL." />
  if (loading) return <Loader label="Loading run…" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!run) return <EmptyState title="Run not found" body="This run ID doesn't exist." />

  const isFailed = run.status === 'failed'
  const firstMismatch = divergence?.first_mismatch_step ?? undefined

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--sp-8) var(--sp-6)' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--sp-5)' }}>
        <Link to="/projects" style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
          Projects
        </Link>
        <span aria-hidden style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', margin: '0 6px' }}>
          /
        </span>
        <Link to={`/projects/${run.project_id}`} style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
          {project?.name ?? run.project_id}
        </Link>
        <span aria-hidden style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', margin: '0 6px' }}>
          /
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil)', fontFamily: 'var(--font-mono)' }}>
          {run._id}
        </span>
      </nav>

      {/* Header with verdict stamp */}
      <RunHeader run={run} />

      {/* Event sequence */}
      <Section title="What happened">
        <EventSequence events={events} highlightedStep={firstMismatch} />
      </Section>

      {/* Divergence — failed runs only */}
      {isFailed && (
        <Section title="Where it split">
          {divergence ? (
            <>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginBottom: 'var(--sp-4)', maxWidth: '68ch', lineHeight: 1.6 }}>
                {divergence.explanation}
              </p>
              {divergence.baseline_run_id && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginBottom: 'var(--sp-5)' }}>
                  Compared to baseline{' '}
                  <Link
                    to={`/runs/${divergence.baseline_run_id}`}
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--lichen)', textDecoration: 'underline' }}
                  >
                    {shortSha(divergence.baseline_run_id)}
                  </Link>
                </p>
              )}
              <ForkTrack divergence={divergence} />
            </>
          ) : (
            <EmptyState
              title="No divergence data"
              body="The analysis pipeline hasn't processed this run yet."
            />
          )}
        </Section>
      )}

      {/* Similar failures — failed runs only */}
      {isFailed && (
        <Section title="Similar failures">
          <DepthMarkers failures={similarFailures} />
        </Section>
      )}

      {/* Flaky / regression findings */}
      {findings.length > 0 && (
        <Section title="Finding">
          <FlakyPanel findings={findings} />
        </Section>
      )}
    </main>
  )
}
