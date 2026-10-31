import { API_URL } from '../config'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(typeof window !== 'undefined' && localStorage.getItem('continuum_token') ? { Authorization: 'Bearer ' + localStorage.getItem('continuum_token')} : {}), ...options?.headers },
  })

  if (!res.ok) {
    let body: { error?: string; message?: string; details?: unknown } = {}
    try {
      body = (await res.json()) as { error?: string; message?: string; details?: unknown }
    } catch {
      // ignore JSON parse error on non-JSON response
    }
    const msg = body.error ?? body.message ?? res.statusText ?? 'Request failed'
    throw new ApiError(res.status, `HTTP ${res.status}: ${msg}`, body.details)
  }

  return res.json() as Promise<T>
}

export async function apiPostRaw(
  path: string,
  body?: unknown,
): Promise<{
  ok: boolean
  status: number
  body: unknown
}> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(typeof window !== 'undefined' && localStorage.getItem('continuum_token') ? { Authorization: 'Bearer ' + localStorage.getItem('continuum_token') } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const resBody = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: resBody }
}
