const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("continuum_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem("continuum_token", data.token);
    localStorage.setItem("continuum_user", JSON.stringify(data.user));
  }
  return { ok: res.ok, status: res.status, data };
}

export async function registerUser(email: string, password: string, name?: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem("continuum_token", data.token);
    localStorage.setItem("continuum_user", JSON.stringify(data.user));
  }
  return { ok: res.ok, status: res.status, data };
}

export function getCurrentUser() {
  const u = localStorage.getItem("continuum_user");
  return u ? JSON.parse(u) : null;
}

export function logoutUser() {
  localStorage.removeItem("continuum_token");
  localStorage.removeItem("continuum_user");
}

export async function fetchProjects() {
  const res = await fetch(`${API_URL}/projects`, {
    headers: { ...getAuthHeader() },
  });
  return res.json();
}

export async function createProject(name: string, repo_url?: string) {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ name, repo_url }),
  });
  return res.json();
}

export async function fetchRuns(projectId: string) {
  const res = await fetch(`${API_URL}/runs?project_id=${projectId}`, {
    headers: { ...getAuthHeader() },
  });
  return res.json();
}

export async function fetchRun(runId: string) {
  const res = await fetch(`${API_URL}/runs/${runId}`, {
    headers: { ...getAuthHeader() },
  });
  return res.json();
}

export async function fetchEvents(runId: string) {
  const res = await fetch(`${API_URL}/events?run_id=${runId}`, {
    headers: { ...getAuthHeader() },
  });
  return res.json();
}

export async function fetchDivergence(runId: string) {
  const res = await fetch(`${API_URL}/intelligence/divergence?run_id=${runId}`, {
    headers: { ...getAuthHeader() },
  });
  return res.json();
}

export async function fetchSimilarFailures(errorText: string) {
  const res = await fetch(
    `${API_URL}/intelligence/similar?error_text=${encodeURIComponent(errorText)}`,
    { headers: { ...getAuthHeader() } }
  );
  return res.json();
}

export async function postEvent(event: any) {
  const res = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(event),
  });
  return { status: res.status, data: await res.json() };
}
