import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRuns } from '../api/endpoints'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Loader } from '../components/Loader'
import { useProjects } from '../hooks/useProjects'
import type { Run } from '../types'
import { relativeTime } from '../utils/time'

const STATUS_COLOR: Record<Run['status'], string> = {
  running: 'var(--saffron)',
  success: 'var(--lichen)',
  failed: 'var(--fault)',
}

function MiniStrataStrip({ projectId }: { projectId: string }) {
  const [runs, setRuns] = useState<Run[]>([])
  const [ready, setReady] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    fetchRuns(projectId, { limit: 12 })
      .then(data => {
        if (mounted.current) {
          setRuns(data)
          setReady(true)
        }
      })
      .catch(() => {
        if (mounted.current) setReady(true)
      })
    return () => {
      mounted.current = false
    }
  }, [projectId])

  if (!ready) {
    return <div style={{ width: 18, height: 72, background: 'var(--ink-raised)' }} />
  }

  if (runs.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: 18, height: 72, background: 'var(--ink-raised)' }}
      />
    )
  }

  return (
    <div
      aria-label={`Last ${runs.length} runs`}
      className="flex flex-col"
      style={{ width: 18, height: 72, gap: 1, flexShrink: 0 }}
    >
      {runs.map(run => (
        <div
          key={run._id}
          title={`${run.status} ${relativeTime(run.started_at)}`}
          style={{
            flex: 1,
            background: STATUS_COLOR[run.status],
            minHeight: 3,
          }}
        />
      ))}
    </div>
  )
}

interface Props {
  onReconnect?: (handler: () => void) => void
}

export function ProjectsPage({ onReconnect }: Props = {}) {
  const { projects, loading, error, reload } = useProjects()

  useEffect(() => {
    if (!onReconnect) return
    onReconnect(reload)
    return () => onReconnect(() => {})
  }, [onReconnect, reload])

  if (loading) return <Loader label="Loading projects" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        body={'Run `cnt init` in your project directory to register it and start recording runs.'}
      />
    )
  }

  return (
    <main className="mx-auto" style={{ maxWidth: 900, padding: 'var(--sp-10) var(--sp-6)' }}>
      <h1
        className="font-display"
        style={{
          fontWeight: 800,
          fontSize: 'var(--text-3xl)',
          color: 'var(--fossil)',
          marginBottom: 'var(--sp-2)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          fontStretch: '112%',
        }}
      >
        Projects
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginBottom: 'var(--sp-10)' }}>
        {projects.length} project{projects.length !== 1 ? 's' : ''} tracked
      </p>

      <div role="list" className="flex flex-col">
        {projects.map(project => {
          const stats = project.stats
          return (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              role="listitem"
              className="project-row flex items-center justify-between"
              style={{
                gap: 'var(--sp-6)',
                padding: 'var(--sp-6) 0',
                borderBottom: '6px solid var(--ink-raised)',
                textDecoration: 'none',
              }}
            >
              <div className="min-w-0 flex-1">
                <h2
                  className="font-display"
                  style={{
                    fontWeight: 700,
                    fontSize: 'var(--text-2xl)',
                    color: 'var(--fossil)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    marginBottom: 6,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontStretch: '108%',
                  }}
                >
                  {project.name}
                </h2>

                <div className="flex flex-wrap items-center" style={{ gap: 16 }}>
                  {project.repo_url && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--fossil-dim)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 280,
                      }}
                    >
                      {project.repo_url.replace('https://github.com/', '')}
                    </span>
                  )}

                  {stats && (
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)' }}>
                      {stats.total_runs} run{stats.total_runs !== 1 ? 's' : ''}, {stats.failed_runs} failed
                    </span>
                  )}

                  {stats?.last_run_at && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
                      last run {relativeTime(stats.last_run_at)}
                    </span>
                  )}
                </div>
              </div>

              <MiniStrataStrip projectId={project._id} />
            </Link>
          )
        })}
      </div>
    </main>
  )
}
