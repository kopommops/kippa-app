# Kippa — hackathon MVP

Kippa helps people with irregular income understand their cash-flow rhythm and prepare for lean weeks. **KippaScore** is the flagship concept: an explainable, illustrative financial-consistency signal designed for people underserved by conventional credit histories. It is not a validated credit score or lending decision.

## Stack
- Frontend: React, Vite, TypeScript, Tailwind CSS, Headless UI, Recharts, Lucide
- Backend: Python, FastAPI, SQLAlchemy, scikit-learn baseline forecast
- Local database: SQLite; PostgreSQL/Supabase-compatible through `DATABASE_URL`
- Assets: hand-authored SVG files in `frontend/public/assets` (no base64 images)

## Run locally

### Backend (PowerShell)
```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend (second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. API docs: http://127.0.0.1:8000/docs.

## Demo path
1. Enter through the welcome screen featuring the obsidian-glass K.
2. Select one of the three synthetic personas.
3. Review KippaScore, its explanatory factors, recent activity and the seven-day forecast.
4. Trigger **Simulate a lean week** and explain how the outlook changes.
5. Reset to baseline.

## Honest demo boundaries
- All seeded transactions are synthetic. No bank is connected.
- KippaScore is a prototype heuristic, not statistically validated, and must not be used for lending decisions. Its number is demonstrative only.
- Forecasts are estimates. They do not guarantee future balances.
- The buffer is illustrative and is not an offer of credit.

## Before production
Add real authentication and consent, account/tenant isolation, request throttling, audit trails, production logging/monitoring, persistent PostgreSQL, migrations, secrets management, backup/restore tests, model validation, bias/fairness assessment, and security/privacy review. Integrate bank feeds only through approved providers and explicit user consent.

See [`PRD.md`](PRD.md) and [`DESIGN.md`](DESIGN.md) for scope, visual system, architecture, and decision rules.
