export interface User {
  _id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
}

export interface Project {
  _id: string;
  owner_id: string;
  name: string;
  repo_url?: string;
  created_at: Date;
}

export interface Run {
  _id: string;
  project_id: string;
  source: "human" | "agent";
  agent_name?: string;
  triggered_by: string;
  commit_sha?: string;
  task_description?: string;
  status: "running" | "success" | "failed";
  started_at: Date;
  ended_at?: Date;
}

export interface Event {
  _id: string;
  run_id: string;
  type: "command_run" | "tool_call" | "diff_submitted" | "test_result" | "error" | "plan_step";
  step?: number;
  payload: Record<string, any>;
  error_message?: string;
  error_embedding?: number[];
  timestamp: Date;
}

export interface Verification {
  _id: string;
  run_id: string;
  claims: {
    requirement: string;
    evidence_file?: string;
    evidence_test?: string;
    status: "proven" | "unproven";
  }[];
  verdict: "safe" | "risky" | "blocked";
  computed_at: Date;
}

export interface Finding {
  _id: string;
  project_id: string;
  type: "flaky_test" | "regression" | "divergence" | "similar_past_failure";
  details: Record<string, any>;
  created_at: Date;
}
