import type { Dashboard, Persona } from './types'

const configuredBase = import.meta.env.VITE_API_BASE_URL
const API_BASE = (configuredBase?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const payload = await response.json()
      if (typeof payload.detail === 'string') detail = payload.detail
    } catch {
      // Keep the status-based message if the server did not return JSON.
    }
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export const api = {
  personas: () => request<Persona[]>('/api/personas'),
  dashboard: (id: string) => request<Dashboard>(`/api/personas/${encodeURIComponent(id)}/dashboard`),
  simulate: (id: string) => request<Dashboard>(`/api/personas/${encodeURIComponent(id)}/simulate-lean-week`, { method: 'POST' }),
  reset: (id: string) => request<Dashboard>(`/api/personas/${encodeURIComponent(id)}/reset-scenario`, { method: 'POST' }),
}
