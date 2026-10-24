# Pelo Finance

**Make your money story visible.** Pelo Finance is a hackathon prototype for people whose income may be irregular, seasonal, cash-based, or spread across several small sources. The current public demo helps users explore synthetic cash-flow history, a seven-day forecast, a lean-week scenario, and PeloScore, an early illustrative financial-consistency signal.

> **Demo safety:** all profiles and transaction records in this build are synthetic. The prototype is not connected to a bank and must not be used for lending, pricing, eligibility, or other consequential financial decisions. PeloScore is not a validated credit score.

## Current implementation

### Frontend

- React 18, TypeScript, Vite, Tailwind CSS, Headless UI, Lucide icons, and Recharts.
- Terracotta-led landing and workspace shell, with cream data surfaces in light mode and charcoal surfaces in dark mode.
- Syne display typography and Scoutie Sans body typography, with resilient system fallbacks.
- Device-preference theme on first visit, persisted user selection, and a pre-paint theme script to reduce flash.
- Desktop compact/revealing sidebar, animated navigation glyph, mobile drawer, and mobile bottom navigation.
- Public product landing page at `/`; choosing “Explore the demo” opens the synthetic-demo onboarding.
- Route-aware workspace views at `/app/overview`, `/app/activity`, `/app/forecast`, `/app/peloscore`, and `/app/settings`.
- Loading, error/retry, empty, score-disclaimer, and synthetic-data disclosure states.

### Backend

- FastAPI with SQLAlchemy and SQLite as the local default.
- Seeded synthetic personas and transactions, dashboard summaries, a seven-day forecast, and a toggleable lean-week scenario.
- Health endpoint: `GET /api/health`.
- Persona endpoints: `GET /api/personas`, `GET /api/personas/{id}/dashboard`, and `GET /api/personas/{id}/transactions`.
- Scenario endpoints: `POST /api/personas/{id}/simulate-lean-week` and `POST /api/personas/{id}/reset-scenario`.

## Run locally

Use Node.js 20 or newer and Python 3.11 or newer.

### 1. Start the API

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API reads environment variables from `backend/.env`. Copy `backend/.env.example` to `backend/.env` if you need to override the defaults. The local SQLite database file is `pelo_finance.db` in the backend working directory.

### 2. Start the frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

For PowerShell, use `Copy-Item .env.example .env.local` rather than `cp`. Set `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env.local` for local development. Set `VITE_CURRENCY=BWP` unless you are intentionally testing another supported display currency.

### 3. Build and check

```bash
cd frontend
npm run build
```

Backend tests:

```bash
cd backend
python -m pytest
```

The browser SPA fallback is configured in `frontend/vercel.json` so refreshing a `/app/...` view serves the frontend entry point. The production frontend still needs a correctly configured `VITE_API_BASE_URL` pointing to the deployed API origin.

## Important constraints before real users

This package improves brand, navigation, appearance, and demo disclosure. It does **not** implement authentication, account ownership, tenant isolation, real bank linking, production migrations, or a validated score model. The current scenario toggle is stored on the seeded persona; demo visitors may affect the same profile state. Keep this build synthetic-only until isolation is implemented and tested.

Before storing real financial data, establish and test all of the following:

1. Server-verified authentication and per-user/business ownership checks on every data path.
2. Managed PostgreSQL, versioned Alembic migrations, tested backup/restore, and a defined retention/deletion policy.
3. Transaction values represented in integer minor units or exact decimal arithmetic, never binary floating point for ledger calculations.
4. Private scenario state with isolation from shared seeded records and other sessions.
5. An approved privacy and regulatory review, explicit consent, secure provider-based bank authorization, and a reviewed security threat model.
6. A documented, versioned PeloScore methodology with representative consented data, temporal validation, calibration, and fairness testing before making outcome claims.

## Product language

- Product: **Pelo Finance**
- Flagship concept: **PeloScore**
- Currency display: configurable, defaulting to **BWP**
- Data status in the public demo: **synthetic data**
- Positioning: financial pattern visibility and planning support, not a credit decision

See [PRD.md](PRD.md), [DESIGN.md](DESIGN.md), [docs/ASSET-REGISTER.md](docs/ASSET-REGISTER.md), [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md), and [docs/IMPLEMENTATION-NOTES.md](docs/IMPLEMENTATION-NOTES.md).
