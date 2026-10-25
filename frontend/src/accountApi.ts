export type AccountUser = { id: number; owner_name: string; email: string }
export type AccountBusiness = { business_name: string; business_type: string }
export type AuthResponse = { access_token: string; token_type: string; user: AccountUser; business: AccountBusiness }
export type AccountTransaction = {
  id: number
  occurred_at: string
  kind: 'income' | 'expense'
  amount: number
  category: string
  description: string
}
export type PeloScoreFactor = { label: string; value: string; explanation: string; tone: 'positive' | 'warning' | 'neutral' | string }
export type AccountDashboard = {
  business_name: string
  business_type: string
  currency: string
  opening_balance: number
  current_balance: number
  income_last_30d: number
  expenses_last_30d: number
  projected_end_balance_7d: number
  lean_week_end_balance_7d: number
  reserve_floor: number
  runway_days: number | null
  observed_days: number
  signal_quality: string
  shortfall_risk: boolean
  peloscore: number | null
  peloscore_status: string
  peloscore_factors: PeloScoreFactor[]
  recent_transactions: AccountTransaction[]
}
export type PeloyameReply = {
  answer: string
  remaining_questions: number
  daily_questions_remaining: number
  mode: 'read_only' | string
}

const configuredBase = import.meta.env.VITE_API_BASE_URL
const API_BASE = (configuredBase?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (authenticated) {
    const token = window.sessionStorage.getItem('pelo-access-token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const payload = await response.json()
      if (typeof payload.detail === 'string') detail = payload.detail
      else if (Array.isArray(payload.detail)) detail = payload.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(' ')
    } catch {
      // Keep the status-based message if the server did not return JSON.
    }
    throw new Error(detail)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const accountApi = {
  register: (payload: {
    owner_name: string; email: string; password: string; business_name: string; business_type: string; opening_balance: number
  }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }, false),
  login: (payload: { email: string; password: string }) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }, false),
  me: () => request<AuthResponse>('/api/auth/me'),
  dashboard: () => request<AccountDashboard>('/api/account/dashboard'),
  addTransaction: (payload: { kind: 'income' | 'expense'; amount: number; category: string; description: string; occurred_at: string }) =>
    request<AccountTransaction>('/api/account/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  deleteTransaction: (id: number) => request<void>(`/api/account/transactions/${id}`, { method: 'DELETE' }),
  simulateLeanWeek: () => request<AccountDashboard>('/api/account/scenarios/lean-week', { method: 'POST' }),
  askPeloyame: (payload: { question: string; session_id: string }) =>
    request<PeloyameReply>('/api/peloyame/chat', { method: 'POST', body: JSON.stringify(payload) }),
}
