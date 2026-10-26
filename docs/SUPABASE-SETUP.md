# Supabase setup for Pelo Finance

This guide configures Supabase as the hosted PostgreSQL database for Pelo's existing FastAPI backend. The prototype keeps its current FastAPI registration/login and JWT flow; it does **not** use Supabase Auth or the Supabase JavaScript client in the browser.

## 1. Create the project

1. Sign in to the Supabase dashboard and create a project for Pelo Finance.
2. Choose a strong database password and save it in your password manager. Do not put it in Git or chat.
3. Choose the region closest to your expected backend deployment where practical.
4. Wait until the database is ready.

A Supabase project may use free-tier resources, but provider quotas, inactivity pausing, connectivity options and terms may change. Check the current Supabase pricing and project settings before the hackathon demo. Do not promise uninterrupted availability from a free project.

## 2. Select the right connection string

In the Supabase project, open **Connect** and select a PostgreSQL connection string.

- **Direct connection:** preferred for a persistent backend host if its network can reach the endpoint (often IPv6; Supabase documents IPv4 add-ons for some plans/configurations).
- **Session Pooler:** appropriate when the backend network is IPv4-only and direct connectivity is not available. Use the session pooler URL/port shown by Supabase.
- Avoid choosing a transaction pooler for a persistent server unless you have checked the driver's pooling/prepared-statement compatibility and the exact provider guidance.

Copy the connection string supplied by the dashboard rather than assembling the host by hand. It usually resembles:

```text
postgresql://postgres.<project-ref>:<URL-ENCODED-PASSWORD>@<host>:<port>/postgres?sslmode=require
```

Your project may show a different username or host, depending on connection method. Use the exact value provided by Supabase. If the database password includes characters such as `@`, `:`, `/`, `#` or `%`, it must be URL-encoded in the connection string.

The project's `backend/app/database.py` normalises `postgresql://` into `postgresql+psycopg://`, and the backend requirements include the Psycopg 3 driver.

## 3. Configure the backend safely

Open the existing `backend/.env`. **Do not replace it with `.env.example`.** Merge or update the `DATABASE_URL` line manually and preserve other settings:

```dotenv
ENVIRONMENT=development
DATABASE_URL=postgresql://<username>:<URL-ENCODED-PASSWORD>@<host>:<port>/postgres?sslmode=require
JWT_SECRET_KEY=<unique-random-secret-of-at-least-32-characters>
GROQ_API_KEY=<your-key-or-empty-during-non-AI-tests>
GROQ_MODEL=openai/gpt-oss-20b
PELOYAME_SESSION_LIMIT=5
PELOYAME_DAILY_USER_LIMIT=20
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

This is a template: replace placeholders with the exact values for your environment. Do not use the example string literally.

Generate a local JWT secret if you need one:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Do not place `DATABASE_URL`, `JWT_SECRET_KEY` or `GROQ_API_KEY` in frontend files, `VITE_` variables, screenshots or documentation. For hosted deployment, enter them in the backend host's private environment-variable settings too. Keep `ENVIRONMENT=production` only when you have set a secure secret and finished the required deployment settings.

## 4. Run migrations before starting the API

**Read `MIGRATIONS-EXPLAINED.md` first.** Decide whether this Supabase database is brand new and empty or contains tables created by a previous version of Pelo.

### New empty Supabase project

From PowerShell:

```powershell
Set-Location "C:\Users\Mmopiemang\pelo-finance_v1\backend"
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m alembic current
```

Use `.venv\Scripts\python.exe` instead if your environment folder is named `.venv`. `current` should show revision `20261025_0002`.

### Existing Supabase project with Pelo tables already created

Back up/export first. Check whether `alembic_version` already exists, and inspect the tables/columns. If it is exactly the documented pre-migration schema and no migration history exists, use the **Case B** stamping instructions in `MIGRATIONS-EXPLAINED.md`. Do not run the initial migration against existing tables and do not stamp blindly.

## 5. Deploy environment variables

On the chosen backend host, configure the same private `DATABASE_URL`, `JWT_SECRET_KEY`, `GROQ_API_KEY`, model and CORS settings in its environment settings. Never upload `.env` to the host's code repository. Run `python -m alembic upgrade head` as a controlled release step against the target database, then deploy/restart the API. Do not rely on application startup to alter database schema automatically.

For frontend deployment, set only the public API base URL, for example:

```dotenv
VITE_API_BASE_URL=https://<your-backend-host>
```

Ensure `CORS_ORIGINS` on FastAPI contains the exact frontend origin, without a trailing slash. Do not use `*` with credentials, and do not put private database or AI keys into the frontend deployment.

## 6. What is protected in this design?

- Supabase stores persistent user, business, transaction, bank-simulation and notification data.
- FastAPI remains the only application gateway in this MVP and verifies the app's JWT.
- Each account endpoint filters private rows by the authenticated user ID; owner-scoping tests are required.
- The migration enables RLS on application tables and revokes direct Data API privileges from `anon` and `authenticated` roles. The backend uses a privileged server connection, so explicit FastAPI ownership checks remain mandatory.
- The frontend never receives a database password or provider service-role key.
- The account export excludes password hashes and access tokens. Account deletion removes the user's associated application records; confirm the behavior on a non-production test database first.

## 7. Verification checklist

1. `python -m alembic current` reports `20261025_0002`.
2. Start the backend and confirm `GET /api/health` returns success.
3. Register a disposable test account and add a transaction.
4. Stop and restart the backend, then sign back in and confirm the transaction remains.
5. Sign in as a second user and verify the first user's transactions and notifications are not visible or mutable.
6. Create a simulated connection, trigger an income and an expense event, and verify each creates a clearly labelled simulated ledger transaction and in-app notification.
7. Delete the disposable account and verify its records are removed; do not use a real user's account for this test.
8. Review database backups/retention, access controls and applicable data-protection requirements before handling real customer financial information.

## Official documentation

- Supabase database connection methods: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase pricing: https://supabase.com/pricing
