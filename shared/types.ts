export interface Project {
  _id: string;
  owner_id: string;
  name: string;
  repo_url?: string;
  instrumentation_enabled: boolean;
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
  timestamp: Date;
}