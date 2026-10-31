import type { Divergence, Finding, Project, Run, RunEvent, SimilarFailure } from '../../types'
import {
  MOCK_DIVERGENCE,
  MOCK_EVENTS_MAP,
  MOCK_FINDINGS,
  MOCK_PROJECTS,
  MOCK_RUNS,
  MOCK_SIMILAR_FAILURES,
} from './data'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const projects: Project[] = clone(MOCK_PROJECTS)
let runs: Run[] = clone(MOCK_RUNS)
const eventsByRun: Record<string, RunEvent[]> = clone(MOCK_EVENTS_MAP)
const divergences: Record<string, Divergence> = { run_failed_01: clone(MOCK_DIVERGENCE) }
const similarByRun: Record<string, SimilarFailure[]> = { run_failed_01: clone(MOCK_SIMILAR_FAILURES) }
const findings: Finding[] = clone(MOCK_FINDINGS)

function eventIdSet(): Set<string> {
  const ids = new Set<string>()
  for (const list of Object.values(eventsByRun)) {
    for (const evt of list) ids.add(evt._id)
  }
  return ids
}

interface RunFilters {
  source?: 'human' | 'agent'
  status?: 'running' | 'success' | 'failed'
  limit?: number
}

function sortNewest(list: Run[]): Run[] {
  return [...list].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  )
}

export const mockStore = {
  listProjects(): Project[] {
    return projects.map(p => {
      const projectRuns = runs.filter(r => r.project_id === p._id)
      const last = sortNewest(projectRuns)[0]
      return {
        ...p,
        stats: {
          total_runs: projectRuns.length,
          failed_runs: projectRuns.filter(r => r.status === 'failed').length,
          last_run_at: last?.started_at,
        },
      }
    })
  },

  getProject(id: string): Project | undefined {
    return this.listProjects().find(p => p._id === id)
  },

  listRuns(projectId: string, filters?: RunFilters): Run[] {
    let list = runs.filter(r => r.project_id === projectId)
    if (filters?.source) list = list.filter(r => r.source === filters.source)
    if (filters?.status) list = list.filter(r => r.status === filters.status)
    list = sortNewest(list)
    if (filters?.limit) list = list.slice(0, filters.limit)
    return list
  },

  getRun(id: string): Run | undefined {
    return runs.find(r => r._id === id)
  },

  listEvents(runId: string): RunEvent[] {
    return [...(eventsByRun[runId] ?? [])].sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
  },

  getDivergence(runId: string): Divergence | null {
    return divergences[runId] ?? null
  },

  listSimilar(runId: string): SimilarFailure[] {
    return similarByRun[runId] ?? []
  },

  listFindings(runId: string): Finding[] {
    const run = this.getRun(runId)
    if (!run) return []
    return findings.filter(f => f.project_id === run.project_id)
  },

  upsertRun(run: Run): void {
    const idx = runs.findIndex(r => r._id === run._id)
    if (idx >= 0) {
      runs[idx] = run
    } else {
      runs = [run, ...runs]
    }
  },

  addEvent(evt: RunEvent): void {
    const list = eventsByRun[evt.run_id] ?? []
    if (list.some(e => e._id === evt._id)) return
    eventsByRun[evt.run_id] = [...list, evt]
  },

  setDivergence(div: Divergence): void {
    divergences[div.run_id] = div
  },

  setSimilar(runId: string, items: SimilarFailure[]): void {
    similarByRun[runId] = items
  },

  postEvent(body: Record<string, unknown>): { ok: boolean; status: number; body: unknown } {
    if (typeof body.run_id !== 'string' || !body.run_id) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Schema validation failed', details: { missing: 'run_id' } },
      }
    }
    const id = typeof body._id === 'string' ? body._id : `evt_${Date.now()}`
    if (eventIdSet().has(id)) {
      return {
        ok: false,
        status: 409,
        body: { error: 'Duplicate event_id', details: { id } },
      }
    }
    const evt: RunEvent = {
      _id: id,
      run_id: body.run_id,
      type: (body.type as RunEvent['type']) ?? 'command_run',
      step: typeof body.step === 'number' ? body.step : undefined,
      payload: (body.payload as Record<string, unknown>) ?? {},
      error_message: typeof body.error_message === 'string' ? body.error_message : undefined,
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString(),
    }
    this.addEvent(evt)
    return { ok: true, status: 201, body: evt }
  },

  postRun(body: Record<string, unknown>): { ok: boolean; status: number; body: unknown } {
    const run: Run = {
      _id: typeof body._id === 'string' ? body._id : `run_${Date.now()}`,
      project_id: typeof body.project_id === 'string' ? body.project_id : 'proj_alpha',
      source: body.source === 'human' ? 'human' : 'agent',
      agent_name: typeof body.agent_name === 'string' ? body.agent_name : undefined,
      triggered_by: typeof body.triggered_by === 'string' ? body.triggered_by : 'demo_user',
      commit_sha: typeof body.commit_sha === 'string' ? body.commit_sha : undefined,
      task_description: typeof body.task_description === 'string' ? body.task_description : undefined,
      status: (body.status as Run['status']) ?? 'running',
      started_at: typeof body.started_at === 'string' ? body.started_at : new Date().toISOString(),
      ended_at: typeof body.ended_at === 'string' ? body.ended_at : undefined,
      verdict: body.verdict as Run['verdict'],
    }
    this.upsertRun(run)
    return { ok: true, status: 201, body: run }
  },
}
