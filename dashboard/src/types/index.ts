export interface Project {
  _id: string
  owner_id: string
  name: string
  repo_url?: string
  created_at: string
  stats?: {
    total_runs: number
    failed_runs: number
    last_run_at?: string
  }
}

export interface Run {
  _id: string
  project_id: string
  source: 'human' | 'agent'
  agent_name?: string
  triggered_by: string
  commit_sha?: string
  task_description?: string
  status: 'running' | 'success' | 'failed'
  started_at: string
  ended_at?: string
  verdict?: 'safe' | 'risky' | 'blocked'
}

export interface RunEvent {
  _id: string
  run_id: string
  type:
    | 'command_run'
    | 'tool_call'
    | 'diff_submitted'
    | 'test_result'
    | 'error'
    | 'plan_step'
  step?: number
  payload: Record<string, unknown>
  error_message?: string
  timestamp: string
}

export interface Divergence {
  run_id: string
  baseline_run_id: string | null
  first_mismatch_step: number | null
  explanation: string
  aligned: {
    step: number
    baseline?: RunEvent
    current?: RunEvent
    match: boolean
  }[]
}

export interface SimilarFailure {
  run_id: string
  event_id: string
  error_message: string
  similarity: number // 0..1
  created_at: string
}

export interface Finding {
  _id: string
  project_id: string
  type:
    | 'flaky_test'
    | 'regression'
    | 'divergence'
    | 'similar_past_failure'
  details: Record<string, unknown>
  created_at: string
}
