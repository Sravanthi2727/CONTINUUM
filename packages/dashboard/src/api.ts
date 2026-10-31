const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function fetchProjects() {
  const res = await fetch(`${API_URL}/projects`);
  return res.json();
}

export async function fetchRuns(projectId: string) {
  const res = await fetch(`${API_URL}/runs?project_id=${projectId}`);
  return res.json();
}

export async function fetchRun(runId: string) {
  const res = await fetch(`${API_URL}/runs/${runId}`);
  return res.json();
}

export async function fetchEvents(runId: string) {
  const res = await fetch(`${API_URL}/events?run_id=${runId}`);
  return res.json();
}

export async function fetchDivergence(runId: string) {
  const res = await fetch(`${API_URL}/intelligence/divergence?run_id=${runId}`);
  return res.json();
}

export async function fetchSimilarFailures(errorText: string) {
  const res = await fetch(
    `${API_URL}/intelligence/similar?error_text=${encodeURIComponent(errorText)}`
  );
  return res.json();
}

export async function postEvent(event: any) {
  const res = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return { status: res.status, data: await res.json() };
}
