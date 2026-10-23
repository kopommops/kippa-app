from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PersonaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    occupation: str
    description: str
    scenario_active: bool


class TransactionOut(BaseModel):
    id: int
    occurred_at: datetime
    kind: str
    amount: float = Field(ge=0)
    category: str
    description: str
    source: str

    model_config = ConfigDict(from_attributes=True)


class InsightOut(BaseModel):
    title: str
    body: str
    tone: str = "neutral"


class ForecastDayOut(BaseModel):
    date: str
    label: str
    income: float
    expenses: float
    closing_balance: float


class ForecastOut(BaseModel):
    model: str
    signal_quality: str
    scenario_active: bool
    scenario_assumption: str
    projected_income_7d: float
    projected_expenses_7d: float
    projected_end_balance: float
    baseline_end_balance: float
    stress_end_balance: float
    lower_bound_end_balance: float
    reserve_floor: float
    buffer_estimate: float
    shortfall_risk: bool
    days: list[ForecastDayOut]


class WeeklyHistoryOut(BaseModel):
    week_label: str
    income: float
    expenses: float


class DashboardOut(BaseModel):
    persona: PersonaOut
    currency: str
    balance: float
    income_last_7d: float
    expenses_last_7d: float
    forecast: ForecastOut
    weekly_history: list[WeeklyHistoryOut]
    insights: list[InsightOut]
    recent_transactions: list[TransactionOut]
