# Pelo Finance

**Make your money story visible.** Pelo Finance is a Botswana-first cash-flow companion for owner-operated micro and small businesses. This hackathon build keeps the public synthetic demo separate from an authenticated MVP where a user can create an account, enter their own financial activity, view a transparent cash summary, see a factor-based illustrative PeloScore when enough records exist, test a lean week, and ask Peloyame for a read-only explanation.

> **Scope and disclosures:** no live bank, mobile-money, OTP or credit-verification provider is connected by this implementation. Any such screen must be labelled as simulated. Forecasts use recent averages and are not validated predictions. PeloScore remains illustrative and is not a credit score or lending decision. Do not enter data you are not comfortable storing in a hackathon prototype.

## Implemented product paths

- `/` — public product landing page, with separate paths into the account journey and the synthetic demo.
- `/account` — registration, sign-in, business setup, manual transaction entry, account dashboard, lean-week calculation and Peloyame Lite.
- `/app/overview`, `/app/activity`, `/app/forecast`, `/app/peloscore`, `/app/settings` — the existing synthetic-data demonstration. This remains optional and must not be presented as the user's real account.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Headless UI, Lucide icons and Recharts.
- Backend: FastAPI, SQLAlchemy, Pydantic, SQLite for local development; PostgreSQL is supported by the existing database URL normalisation.
- Authentication: Argon2 password hashing through `pwdlib`, signed short-lived JWTs via `PyJWT`.
- Peloyame: Groq API using `openai/gpt-oss-20b` as the default free-tier model, subject to the account's current model availability and rate limits.

## Local setup (Windows PowerShell)

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If `backend/.env` already exists, **do not overwrite it**. Preserve the current `DATABASE_URL` so you do not accidentally point the application at a new, empty SQLite file. Add or update these values in that existing file:

```dotenv
APP_NAME=Pelo Finance API
ENVIRONMENT=development
JWT_SECRET_KEY=<a unique random string, at least 32 characters>
GROQ_API_KEY=<your own Groq API key>
GROQ_MODEL=openai/gpt-oss-20b
PELOYAME_SESSION_LIMIT=5
PELOYAME_DAILY_USER_LIMIT=20
```

Generate a local JWT secret with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Use the API key only in `backend/.env` or your hosting provider's backend environment settings. Never put it in `frontend/.env.local`, React code, screenshots, documentation, Git history or public issue comments.

Start the API from the `backend` directory:

```powershell
uvicorn app.main:app --reload --port 8000
```

Check `http://127.0.0.1:8000/api/health` and `http://127.0.0.1:8000/docs`.

### 2. Frontend

In a second PowerShell terminal:

```powershell
cd frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Confirm `frontend/.env.local` contains `VITE_API_BASE_URL=http://localhost:8000`. Visit the URL printed by Vite, usually `http://localhost:5173`.

### 3. User-flow rehearsal

1. Choose **Create account** from the landing page or visit `/account` directly.
2. Register a test business with a unique email address and an opening cash balance.
3. Add at least three income/expense records across two dates. Confirm the balance reconciles as opening cash + recorded income − recorded expenses, and PeloScore becomes available only when its minimum history threshold is met.
4. Refresh the page and confirm the session and entries still work. Sign out and sign back in.
5. Register a second account. Verify it sees no transactions from the first account.
6. Test the lean-week calculation and confirm it changes only the displayed projection—not the ledger.
7. Ask Peloyame a question about the recorded summary, use up to five requests in the same browser session, then test a provider-limit or missing-key fallback.
8. Separately enter the synthetic demo and confirm its data is labelled synthetic.

### 4. Automated checks

```powershell
cd backend
python -m pytest
```

In another terminal:

```powershell
cd frontend
npm run build
```

The tests exercise registration, login, user-level transaction isolation, ledger arithmetic, input validation and missing-key behaviour. Passing tests are necessary, not proof of production security.

## Peloyame policy

Peloyame is read-only. Its API request includes a concise instruction primer, a JSON-encoded user question, and a server-generated financial summary. For the selected GPT-OSS model, instructions and input are sent in one user message, following the provider's current reasoning-model guidance. The model does not receive owner email, identity details or raw transaction descriptions. The backend enforces a five-question session limit and a separate daily user cap; client-side counters are only a user interface aid. Deterministic application code calculates balances and forecast values. Peloyame can explain them but must not invent data, expose secrets, access other users' records, execute transactions or make lending decisions.

Groq's free-tier rate limits are organisation-level and can change. Do not configure automatic upgrades or add a paid tier for the hackathon. When the provider returns a rate limit or becomes unavailable, show a friendly fallback and keep the ledger usable. Verify the model and your organisation's current limits in the [Groq model list](https://console.groq.com/docs/models) and [rate-limit documentation](https://console.groq.com/docs/rate-limits) before a live demonstration.

## Data and deployment cautions

- This is a hackathon MVP, not a production financial service. Use test data during development and demonstration.
- `Base.metadata.create_all()` is used to add missing MVP tables while retaining the existing schema. It is not a replacement for Alembic migrations. Back up the database before integration and never delete a database file to fix a naming issue.
- Local SQLite is suitable for development. A shared deployment needs a persistent database; ephemeral SQLite storage can lose user accounts and entries when the host restarts.
- Configure the exact deployed frontend origin in backend `CORS_ORIGINS`. Use HTTPS in the deployed environment and a unique JWT secret.
- JWTs are kept in `sessionStorage` for this sprint. This improves the UX over memory-only tokens but remains exposed to successful same-origin script injection. Add a strict content security policy and consider server-managed HttpOnly secure cookies before public use.
- The lightweight usage limiter uses database rows and is suitable for a bounded hackathon. A multi-instance production service needs atomic shared rate limiting and concurrency tests.
- Before inviting real customers, complete privacy/legal review, retention and deletion processes, backup/restore testing, access-control review and any applicable regulatory assessment.

See [PRD.md](PRD.md), [DESIGN.md](DESIGN.md), [docs/IMPLEMENTATION-RUNBOOK.md](docs/IMPLEMENTATION-RUNBOOK.md), [docs/PELOYAME-PROMPT-AND-GUARDRAILS.md](docs/PELOYAME-PROMPT-AND-GUARDRAILS.md) and [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md).
