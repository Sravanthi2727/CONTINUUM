/**
 * All API calls live here.
 * Contract changes touch this file only.
 * VITE_USE_MOCKS=true → local mock store (no backend needed).
 * VITE_USE_MOCKS=false → real Express API.
 */

import { API_URL, USE_MOCKS } from '../config'
import type { Divergence, Finding, Project, Run, RunEvent, SimilarFailure } from '../types'
import { apiFetch } from './client'
import { mockStore } from './mocks/store'

/** Realistic mock latency */
function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise(res => setTimeout(() => res(data), ms))
}

// ─── Defensive Normalization Layer ────────────────────────────────────────────

function parseDate(raw: unknown, fallback?: string): string {
  if (!raw) return fallback ?? new Date().toISOString()
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number') return new Date(raw).toISOString()
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'object' && raw !== null && '$date' in raw) {
    const val = (raw as { $date: unknown }).$date
    if (typeof val === 'string') return val
    if (typeof val === 'number') return new Date(val).toISOString()
  }
  return fallback ?? new Date().toISOString()
}

function parseOptionalDate(raw: unknown): string | undefined {
  if (!raw) return undefined
  return parseDate(raw)
}

export function normalizeProject(raw: unknown): Project {
  if (!raw || typeof raw !== 'object') {
    return {
      _id: 'unknown_project',
      owner_id: '',
      name: 'Untitled project',
      created_at: new Date().toISOString(),
    }
  }
  const obj = raw as Record<string, unknown>
  const id = obj._id ?? obj.id ?? 'unknown_project'

  let stats: Project['stats']
  if (obj.stats && typeof obj.stats === 'object') {
    const s = obj.stats as Record<string, unknown>
    stats = {
      total_runs: typeof s.total_runs === 'number' ? s.total_runs : parseInt(String(s.total_runs || 0), 10) || 0,
      failed_runs: typeof s.failed_runs === 'number' ? s.failed_runs : parseInt(String(s.failed_runs || 0), 10) || 0,
      last_run_at: parseOptionalDate(s.last_run_at),
    }
  }

  return {
    _id: String(id),
    owner_id: String(obj.owner_id ?? ''),
    name: String(obj.name ?? id),
    repo_url: obj.repo_url ? String(obj.repo_url) : undefined,
    created_at: parseDate(obj.created_at),
    stats,
  }
}

export function normalizeRun(raw: unknown): Run {
  if (!raw || typeof raw !== 'object') {
    return {
      _id: 'unknown_run',
      project_id: '',
      source: 'agent',
      triggered_by: 'system',
      status: 'running',
      started_at: new Date().toISOString(),
    }
  }
  const obj = raw as Record<string, unknown>
  const id = obj._id ?? obj.id ?? 'unknown_run'
  const source = obj.source === 'human' ? 'human' : 'agent'
  const status =
    obj.status === 'success' || obj.status === 'failed' || obj.status === 'running'
      ? obj.status
      : 'running'
  const verdict =
    obj.verdict === 'safe' || obj.verdict === 'risky' || obj.verdict === 'blocked'
      ? obj.verdict
      : undefined

  return {
    _id: String(id),
    project_id: String(obj.project_id ?? ''),
    source,
    agent_name: obj.agent_name ? String(obj.agent_name) : undefined,
    triggered_by: String(obj.triggered_by ?? (source === 'human' ? 'human' : 'agent')),
    commit_sha: obj.commit_sha ? String(obj.commit_sha) : undefined,
    task_description: obj.task_description ? String(obj.task_description) : undefined,
    status,
    started_at: parseDate(obj.started_at),
    ended_at: parseOptionalDate(obj.ended_at),
    verdict,
  }
}

const VALID_EVENT_TYPES = new Set([
  'command_run',
  'tool_call',
  'diff_submitted',
  'test_result',
  'error',
  'plan_step',
])

export function normalizeEvent(raw: unknown): RunEvent {
  if (!raw || typeof raw !== 'object') {
    return {
      _id: `evt_${Date.now()}`,
      run_id: '',
      type: 'command_run',
      payload: {},
      timestamp: new Date().toISOString(),
    }
  }
  const obj = raw as Record<string, unknown>
  const id = obj._id ?? obj.id ?? `evt_${Date.now()}`
  const rawType = typeof obj.type === 'string' ? obj.type : 'command_run'
  const type = VALID_EVENT_TYPES.has(rawType) ? (rawType as RunEvent['type']) : 'command_run'
  const payload = obj.payload && typeof obj.payload === 'object' ? (obj.payload as Record<string, unknown>) : {}

  return {
    _id: String(id),
    run_id: String(obj.run_id ?? ''),
    type,
    step: typeof obj.step === 'number' ? obj.step : undefined,
    payload,
    error_message: obj.error_message ? String(obj.error_message) : undefined,
    timestamp: parseDate(obj.timestamp),
  }
}

export function normalizeDivergence(raw: unknown): Divergence | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const runId = obj.run_id ?? obj._id ?? obj.id
  if (!runId && !obj.explanation && !obj.aligned) return null

  const rawAligned = Array.isArray(obj.aligned) ? obj.aligned : []
  const aligned = rawAligned.map((a: unknown, idx: number) => {
    if (!a || typeof a !== 'object') {
      return { step: idx + 1, match: false }
    }
    const item = a as Record<string, unknown>
    return {
      step: typeof item.step === 'number' ? item.step : idx + 1,
      baseline: item.baseline ? normalizeEvent(item.baseline) : undefined,
      current: item.current ? normalizeEvent(item.current) : undefined,
      match: Boolean(item.match),
    }
  })

  return {
    run_id: String(runId ?? ''),
    baseline_run_id: obj.baseline_run_id ? String(obj.baseline_run_id) : null,
    first_mismatch_step:
      typeof obj.first_mismatch_step === 'number' ? obj.first_mismatch_step : null,
    explanation: String(obj.explanation ?? 'Divergence detected in execution sequence.'),
    aligned,
  }
}

export function normalizeSimilarFailure(raw: unknown): SimilarFailure {
  if (!raw || typeof raw !== 'object') {
    return {
      run_id: '',
      event_id: '',
      error_message: 'Unknown failure',
      similarity: 0,
      created_at: new Date().toISOString(),
    }
  }
  const obj = raw as Record<string, unknown>
  const sim =
    typeof obj.similarity === 'number'
      ? obj.similarity
      : parseFloat(String(obj.similarity || 0)) || 0

  return {
    run_id: String(obj.run_id ?? obj._id ?? obj.id ?? ''),
    event_id: String(obj.event_id ?? ''),
    error_message: String(
      obj.error_message ?? obj.error ?? obj.message ?? 'Failure details unavailable',
    ),
    similarity: Math.min(Math.max(sim, 0), 1),
    created_at: parseDate(obj.created_at ?? obj.timestamp),
  }
}

export function normalizeFinding(raw: unknown): Finding {
  if (!raw || typeof raw !== 'object') {
    return {
      _id: `finding_${Date.now()}`,
      project_id: '',
      type: 'flaky_test',
      details: {},
      created_at: new Date().toISOString(),
    }
  }
  const obj = raw as Record<string, unknown>
  const id = obj._id ?? obj.id ?? `finding_${Date.now()}`
  const validTypes = new Set(['flaky_test', 'regression', 'divergence', 'similar_past_failure'])
  const rawType = typeof obj.type === 'string' ? obj.type : 'flaky_test'
  const type = validTypes.has(rawType) ? (rawType as Finding['type']) : 'flaky_test'
  const details =
    obj.details && typeof obj.details === 'object' ? (obj.details as Record<string, unknown>) : {}

  return {
    _id: String(id),
    project_id: String(obj.project_id ?? ''),
    type,
    details,
    created_at: parseDate(obj.created_at),
  }
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  if (USE_MOCKS) return delay(mockStore.listProjects().map(normalizeProject))
  const data = await apiFetch<unknown[]>('/projects')
  return (Array.isArray(data) ? data : []).map(normalizeProject)
}

export async function fetchProject(id: string): Promise<Project> {
  if (USE_MOCKS) {
    const p = mockStore.getProject(id)
    if (!p) throw new Error('Project not found')
    return delay(normalizeProject(p))
  }
  const data = await apiFetch<unknown>(`/projects/${id}`)
  return normalizeProject(data)
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export interface RunFilters {
  source?: 'human' | 'agent'
  status?: 'running' | 'success' | 'failed'
  limit?: number
}

export async function fetchRuns(projectId: string, filters?: RunFilters): Promise<Run[]> {
  if (USE_MOCKS) return delay(mockStore.listRuns(projectId, filters).map(normalizeRun))
  const params = new URLSearchParams()
  if (filters?.source) params.set('source', filters.source)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.limit)  params.set('limit', String(filters.limit))
  const data = await apiFetch<unknown[]>(`/projects/${projectId}/runs?${params}`)
  return (Array.isArray(data) ? data : []).map(normalizeRun)
}

export async function fetchRun(runId: string): Promise<Run> {
  if (USE_MOCKS) {
    const r = mockStore.getRun(runId)
    if (!r) throw new Error('Run not found')
    return delay(normalizeRun(r))
  }
  const data = await apiFetch<unknown>(`/runs/${runId}`)
  return normalizeRun(data)
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function fetchEvents(runId: string): Promise<RunEvent[]> {
  if (USE_MOCKS) return delay(mockStore.listEvents(runId).map(normalizeEvent))
  const data = await apiFetch<unknown[]>(`/runs/${runId}/events`)
  return (Array.isArray(data) ? data : []).map(normalizeEvent)
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export async function fetchDivergence(runId: string): Promise<Divergence | null> {
  if (USE_MOCKS) return delay(normalizeDivergence(mockStore.getDivergence(runId)))
  try {
    const data = await apiFetch<unknown>(`/runs/${runId}/divergence`)
    return normalizeDivergence(data)
  } catch {
    return null
  }
}

export async function fetchSimilarFailures(runId: string): Promise<SimilarFailure[]> {
  if (USE_MOCKS) return delay(mockStore.listSimilar(runId).map(normalizeSimilarFailure))
  try {
    const data = await apiFetch<unknown[]>(`/runs/${runId}/similar`)
    return (Array.isArray(data) ? data : []).map(normalizeSimilarFailure)
  } catch {
    return []
  }
}

export async function fetchFindings(runId: string): Promise<Finding[]> {
  if (USE_MOCKS) return delay(mockStore.listFindings(runId).map(normalizeFinding))
  try {
    const data = await apiFetch<unknown[]>(`/runs/${runId}/findings`)
    return (Array.isArray(data) ? data : []).map(normalizeFinding)
  } catch {
    return []
  }
}

// ─── Demo writes ──────────────────────────────────────────────────────────────

export interface DemoResult {
  ok: boolean
  status: number
  body: unknown
}

export async function postEvent(body: Record<string, unknown>): Promise<DemoResult> {
  if (USE_MOCKS) return delay(mockStore.postEvent(body))
  const res = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const resBody = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: resBody }
}

export async function postRun(body: Record<string, unknown>): Promise<DemoResult> {
  if (USE_MOCKS) return delay(mockStore.postRun(body))
  const res = await fetch(`${API_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const resBody = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: resBody }
}

export async function postDemoScenario(scenario: string): Promise<DemoResult> {
  const res = await fetch(`${API_URL}/demo/${scenario}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  const resBody = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: resBody }
}
