import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProject } from '../api/endpoints'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Loader } from '../components/Loader'
import { StrataBand } from '../components/StrataBand'
import { useToast } from '../components/Toast'
import { useRuns } from '../hooks/useRuns'
import type { Project, Run } from '../types'

type SourceFilter = 'all' | 'human' | 'agent'
type StatusFilter = 'all' | 'running' | 'success' | 'failed'

function FilterChip({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean
  label: string
  color?: string
  onClick: () => void
}) {
  const activeColor = color ?? 'var(--fossil)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '4px 12px',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-body)',
        fontWeight: active ? 600 : 400,
        color: active ? activeColor : 'var(--fossil-dim)',
        background: active ? 'var(--ink-raised)' : 'transparent',
        border: `1px solid ${active ? activeColor : 'rgba(165,150,168,0.25)'}`,
      }}
    >
      {label}
    </button>
  )
}

function FilterBar({
  source,
  status,
  onSource,
  onStatus,
}: {
  source: SourceFilter
  status: StatusFilter
  onSource: (s: SourceFilter) => void
  onStatus: (s: StatusFilter) => void
}) {
  return (
    <div
      role="toolbar"
      aria-label="Filter runs"
      className="flex flex-wrap items-center"
      style={{ gap: 8, padding: 'var(--sp-4) 0' }}
    >
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginRight: 4 }}>Source</span>
      <FilterChip active={source === 'all'} label="All" onClick={() => onSource('all')} />
      <FilterChip active={source === 'human'} label="Human" color="var(--sandstone)" onClick={() => onSource('human')} />
      <FilterChip active={source === 'agent'} label="Agent" color="var(--glacier)" onClick={() => onSource('agent')} />

      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginLeft: 8, marginRight: 4 }}>
        Status
      </span>
      <FilterChip active={status === 'all'} label="All" onClick={() => onStatus('all')} />
      <FilterChip active={status === 'running'} label="Running" color="var(--saffron)" onClick={() => onStatus('running')} />
      <FilterChip active={status === 'success'} label="Success" color="var(--lichen)" onClick={() => onStatus('success')} />
      <FilterChip active={status === 'failed'} label="Failed" color="var(--fault)" onClick={() => onStatus('failed')} />
    </div>
  )
}

interface Props {
  onRunUpsert: (handler: (run: Run) => void) => void
  onReconnect?: (handler: () => void) => void
}

export function TimelinePage({ onRunUpsert, onReconnect }: Props) {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [newRunIds, setNewRunIds] = useState<Set<string>>(new Set())
  const newRunTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const runsFilters = {
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }

  const { runs, loading, error, reload, upsertRun } = useRuns(projectId ?? '', runsFilters)

  useEffect(() => {
    if (!projectId) return
    fetchProject(projectId).then(setProject).catch(() => {
      setProject(null)
    })
  }, [projectId])

  // Refetch on reconnect so runs during network blip are caught
  useEffect(() => {
    if (!onReconnect) return
    onReconnect(reload)
    return () => onReconnect(() => {})
  }, [onReconnect, reload])

  useEffect(() => {
    onRunUpsert((run: Run) => {
      if (run.project_id !== projectId) return
      const isNew = upsertRun(run)
      if (!isNew) return

      setNewRunIds(prev => {
        const next = new Set(prev)
        next.add(run._id)
        return next
      })
      const timer = setTimeout(() => {
        setNewRunIds(s => {
          const n = new Set(s)
          n.delete(run._id)
          return n
        })
      }, 2200)
      newRunTimers.current.set(run._id, timer)

      if (run.status === 'running') {
        showToast({
          type: 'info',
          title: `New ${run.source} run started`,
          body: run.task_description ?? run.triggered_by,
        })
      }
    })
    return () => onRunUpsert(() => {})
  }, [projectId, upsertRun, showToast, onRunUpsert])

  useEffect(() => {
    const timers = newRunTimers.current
    return () => {
      timers.forEach(t => clearTimeout(t))
    }
  }, [])

  const handleRunClick = useCallback((runId: string) => {
    navigate(`/runs/${runId}`)
  }, [navigate])

  if (!projectId) return <ErrorState message="No project ID in URL." />

  return (
    <main className="mx-auto" style={{ maxWidth: 1000, padding: 'var(--sp-8) var(--sp-6)' }}>
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--sp-4)' }}>
        <Link to="/projects" style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>Projects</Link>
        <span aria-hidden style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', margin: '0 6px' }}>/</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil)' }}>
          {project?.name ?? projectId}
        </span>
      </nav>

      <div className="flex flex-wrap items-end justify-between" style={{ gap: 16, marginBottom: 'var(--sp-4)' }}>
        <div>
          <h1
            className="font-display"
            style={{
              fontWeight: 800,
              fontSize: 'var(--text-3xl)',
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontStretch: '112%',
            }}
          >
            {project?.name ?? projectId}
          </h1>
          {project?.repo_url && (
            <p className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginTop: 4 }}>
              {project.repo_url}
            </p>
          )}
        </div>

        {!loading && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', flexShrink: 0 }}>
            {runs.length} run{runs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <FilterBar
        source={sourceFilter}
        status={statusFilter}
        onSource={setSourceFilter}
        onStatus={setStatusFilter}
      />

      {loading && <Loader label="Loading runs" />}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && runs.length === 0 && (
        <EmptyState
          title="No runs yet"
          body={'No runs yet. Run `cnt run "npm test"` in your project to record one.'}
        />
      )}

      {!loading && !error && runs.length > 0 && (
        <div
          role="list"
          aria-label="Run timeline"
          className="flex flex-col"
          style={{
            borderLeft: '3px solid var(--ink-raised)',
            gap: 3,
            background: 'var(--ink)',
          }}
        >
          {runs.map((run, index) => (
            <div key={run._id} role="listitem">
              <StrataBand
                run={run}
                index={index}
                isNew={newRunIds.has(run._id)}
                onClick={handleRunClick}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
