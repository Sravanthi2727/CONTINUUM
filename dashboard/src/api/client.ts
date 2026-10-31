import { API_URL } from '../config'
import type { User } from '../types'

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

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('continuum_token')
  } catch {
    return null
  }
}

export function getAuthUser(): User | null {
  try {
    const raw = localStorage.getItem('continuum_user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function setAuthSession(token: string, user: User): void {
  try {
    localStorage.setItem('continuum_token', token)
    localStorage.setItem('continuum_user', JSON.stringify(user))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('continuum_auth_change'))
    }
  } catch {
    // ignore local storage restrictions
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem('continuum_token')
    localStorage.removeItem('continuum_user')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('continuum_auth_change'))
    }
  } catch {
    // ignore
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...options?.headers,
      },
    })
  } catch (fetchErr) {
    if (path.startsWith('/') && API_URL.startsWith('http')) {
      res = await fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
          ...options?.headers,
        },
      })
    } else {
      throw fetchErr
    }
  }

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
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }
  const resBody = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: resBody }
}
