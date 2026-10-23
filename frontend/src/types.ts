export type Persona = {
  id: string
  name: string
  occupation: string
  description: string
  scenario_active: boolean
}

export type Transaction = {
  id: number
  occurred_at: string
  kind: 'income' | 'expense'
  amount: number
  category: string
  description: string
  source: string
}

export type WeeklyPoint = {
  week_label: string
  income: number
  expenses: number
}

export type ForecastDay = {
  date: string
  label: string
  income: number
  expenses: number
  closing_balance: number
}

export type Insight = {
  title: string
  body: string
  tone: 'warning' | 'neutral' | 'positive' | string
}

export type Dashboard = {
  persona: Persona
  currency: string
  balance: number
  income_last_7d: number
  expenses_last_7d: number
  forecast: {
    model: string
    signal_quality: string
    scenario_active: boolean
    scenario_assumption: string
    projected_income_7d: number
    projected_expenses_7d: number
    projected_end_balance: number
    baseline_end_balance: number
    stress_end_balance: number
    lower_bound_end_balance: number
    reserve_floor: number
    buffer_estimate: number
    shortfall_risk: boolean
    days: ForecastDay[]
  }
  weekly_history: WeeklyPoint[]
  insights: Insight[]
  recent_transactions: Transaction[]
}
