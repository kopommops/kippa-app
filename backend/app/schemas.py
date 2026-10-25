from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator
import re
from uuid import UUID


class PersonaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    occupation: str
    description: str
    scenario_active: bool


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    occurred_at: datetime
    kind: str
    amount: float = Field(ge=0)
    category: str
    description: str
    source: str


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


class UserOut(BaseModel):
    id: int
    owner_name: str
    email: str


class BusinessOut(BaseModel):
    business_name: str
    business_type: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    business: BusinessOut


class RegisterIn(BaseModel):
    owner_name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=10, max_length=128)
    business_name: str = Field(min_length=2, max_length=100)
    business_type: str = Field(min_length=2, max_length=64)
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0"), le=Decimal("10000000"))

    @field_validator("owner_name", "business_name", "business_type")
    @classmethod
    def clean_text(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned or any(ord(ch) < 32 for ch in cleaned):
            raise ValueError("Please enter valid text.")
        return cleaned

    @field_validator("opening_balance")
    @classmethod
    def validate_opening_balance(cls, value: Decimal) -> Decimal:
        if value.as_tuple().exponent < -2:
            raise ValueError("Amounts may have no more than two decimal places.")
        return value.quantize(Decimal("0.01"))

    @field_validator("business_type")
    @classmethod
    def validate_business_type(cls, value: str) -> str:
        allowed = {
            "retail / tuck shop": "Retail / tuck shop",
            "food vendor": "Food vendor",
            "market trader": "Market trader",
            "personal services": "Personal services",
            "transport": "Transport",
            "other microbusiness": "Other microbusiness",
        }
        canonical = allowed.get(value.strip().casefold())
        if canonical is None:
            raise ValueError("Choose one of the available business types.")
        return canonical

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", value):
            raise ValueError("Enter a valid email address.")
        return value


class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", value):
            raise ValueError("Enter a valid email address.")
        return value


class TransactionCreate(BaseModel):
    kind: str
    amount: Decimal = Field(gt=Decimal("0"), le=Decimal("10000000"))
    category: str = Field(min_length=2, max_length=64)
    description: str = Field(min_length=2, max_length=160)
    occurred_at: datetime | None = None

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in {"income", "expense"}:
            raise ValueError("Transaction type must be income or expense.")
        return value

    @field_validator("amount")
    @classmethod
    def validate_minor_units(cls, value: Decimal) -> Decimal:
        if value.as_tuple().exponent < -2:
            raise ValueError("Amounts may have no more than two decimal places.")
        return value.quantize(Decimal("0.01"))

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str, info: ValidationInfo) -> str:
        categories = {
            "income": {
                "sales": "Sales",
                "service income": "Service income",
                "customer payment": "Customer payment",
                "other income": "Other income",
            },
            "expense": {
                "stock": "Stock",
                "supplier payment": "Supplier payment",
                "rent / stall costs": "Rent / stall costs",
                "transport / fuel": "Transport / fuel",
                "utilities / data": "Utilities / data",
                "wages": "Wages",
                "household / owner draw": "Household / owner draw",
                "other expense": "Other expense",
            },
        }
        kind = info.data.get("kind")
        canonical = categories.get(kind, {}).get(value.strip().casefold())
        if canonical is None:
            raise ValueError("Choose a category that matches the transaction type.")
        return canonical

    @field_validator("occurred_at")
    @classmethod
    def reject_future_transaction_date(cls, value: datetime | None) -> datetime | None:
        # The MVP records historical/current activity, not scheduled future cash events.
        # Compare calendar dates so a local date submitted around midday is still valid.
        botswana_today = datetime.now(timezone(timedelta(hours=2))).date()
        if value is not None and value.date() > botswana_today:
            raise ValueError("Transaction date cannot be in the future.")
        return value

    @field_validator("description")
    @classmethod
    def clean_transaction_description(cls, value: str) -> str:
        value = " ".join(value.strip().split())
        if not value or any(ord(ch) < 32 for ch in value):
            raise ValueError("Enter a valid transaction description.")
        return value


class AccountTransactionOut(BaseModel):
    id: int
    occurred_at: datetime
    kind: str
    amount: float
    category: str
    description: str


class PeloScoreFactorOut(BaseModel):
    label: str
    value: str
    explanation: str
    tone: str = "neutral"


class AccountDashboardOut(BaseModel):
    business_name: str
    business_type: str
    currency: str
    opening_balance: float
    current_balance: float
    income_last_30d: float
    expenses_last_30d: float
    projected_end_balance_7d: float
    lean_week_end_balance_7d: float
    reserve_floor: float
    runway_days: float | None
    observed_days: int
    signal_quality: str
    shortfall_risk: bool
    peloscore: int | None
    peloscore_status: str
    peloscore_factors: list[PeloScoreFactorOut]
    recent_transactions: list[AccountTransactionOut]


class PeloyameRequest(BaseModel):
    question: str = Field(min_length=2, max_length=600)
    session_id: UUID

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Please enter a little more detail.")
        if sum(1 for ch in value if ord(ch) < 32 and ch not in "\n\t"):
            raise ValueError("The question contains unsupported control characters.")
        return value


class PeloyameResponse(BaseModel):
    answer: str
    remaining_questions: int
    daily_questions_remaining: int
    mode: str = "read_only"
