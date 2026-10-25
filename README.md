# Pelo Finance

**Make your money story visible.**

![Pelo Finance hero: a small-business owner recording daily sales in a warmly lit, terracotta-toned shop](docs/assets/pelo-landing-hero.webp)

[Live demo](https://pelo-finance.vercel.app/) · [Source repository](https://github.com/kopommops/pelo-finance)

Pelo Finance is a hackathon prototype exploring a practical question: how can people who earn irregularly make better sense of the money that moves through their lives? Income may arrive by day, week, season, cash sale, client job or several small streams. A single balance rarely tells the whole story. People also need to understand the pattern behind the balance: what came in, what went out, what a lean week might look like, and which assumptions shape the forecast.

Pelo Finance is being built around visibility rather than judgement. The goal is to turn a scattered money story into something people can explore, explain and plan around. **PeloScore** is an early, illustrative financial-consistency concept within that experience, not a credit score or a lending decision.

>**Prototype safety:** the public demo profiles and their transactions are synthetic. Registered users can also create their own prototype account and enter test financial records, which are persisted through the hosted backend and database. The bank-connection workflow and its incoming/outgoing events are simulations—not live bank or mobile-money connections. Forecasts are estimates, and PeloScore is illustrative and not statistically validated. Do not enter bank passwords, card security codes or OTPs, and do not use this prototype for lending, eligibility or other consequential decisions.

![Pelo Finance mark](frontend/public/assets/pelo-mark.svg)


## The experience

Pelo Finance has two ways to explore the product:

1. **Synthetic demo:** choose an example livelihood and review its dashboard, transaction activity, forecast, lean-week scenario and illustrative PeloScore without sharing personal financial information.
2. **Private account:** register or sign in to manage a business profile and the test financial records entered for that account.

The private account has six sections: **Overview**, **Activity**, **Forecast**, **PeloScore**, **Peloyame** and **Settings**. Peloyame provides read-only explanations grounded in the permitted account context. Settings provides account-management controls.

The bank-connection flow is a demonstration only. It can show simulated incoming/outgoing events and in-app notifications, but it does not connect to a real bank or move money. Look for the simulation label wherever these events appear.

The synthetic-demo routes include `/app/overview`, `/app/activity`, `/app/forecast`, `/app/peloscore` and `/app/settings`. The authenticated workspace is available through `/account`; its sections are navigated within the private account experience.

## Product snapshot

| | Current prototype |
|---|---|
| Product | Pelo Finance |
| Flagship concept | PeloScore |
| Team | Kgotla Data Labs |
| Audience hypothesis | Owner-operated micro and small businesses, including small traders and independent service providers; initial validation focus is Botswana |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Headless UI, Lucide and Recharts |
| Backend | Python, FastAPI and SQLAlchemy |
| Database | SQLite for local development where configured; Supabase PostgreSQL for the deployed backend |
| Migrations | Alembic; current deployed migration target is `20261025_0002` |
| Hosting | Frontend on Vercel; API on Render; database on Supabase PostgreSQL |
| Data | Synthetic public-demo profiles plus registered-account prototype records; bank events are simulated |
| AI | Peloyame uses the Groq API for bounded, contextual explanations |
| Readiness | Hackathon MVP; not a production banking service, and not validated for consequential financial decisions |

## How the system fits together

The deployed prototype uses Vercel for the browser UI, a FastAPI backend on Render, Supabase PostgreSQL for persistent hosted data, and Groq for Peloyame responses. Local development may use SQLite depending on `DATABASE_URL`. Simulated bank activity is a prototype workflow, not a live financial institution integration.

![Pelo Finance current prototype architecture and planned hardening](docs/assets/system-architecture.svg)

Current technology responsibilities:

- **React + TypeScript** provide the browser experience and route-level screens.
- **Vite and Tailwind CSS** support frontend development and styling.
- **Headless UI, Lucide and Recharts** provide accessible interface primitives, icons and data visualisations.
- **FastAPI** exposes the demo API, including persona, dashboard, transaction and scenario endpoints.
- **SQLAlchemy** provides the persistence layer; SQLite is the local default. Confirm the actual deployed database from deployment configuration rather than inferring it from local settings.
- **Vercel and the separate API host** publish the web UI and backend independently. The frontend's API base URL must point to the intended deployed API origin.

### Demo API surface

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/personas` | List synthetic demo profiles |
| `GET` | `/api/personas/{id}/dashboard` | Return a profile dashboard summary |
| `GET` | `/api/personas/{id}/transactions` | Return synthetic transactions |
| `POST` | `/api/personas/{id}/simulate-lean-week` | Activate a lean-week demo scenario |
| `POST` | `/api/personas/{id}/reset-scenario` | Reset a profile to baseline |

These are prototype endpoints, not a user-authenticated financial-data API.

The backend also exposes authenticated account operations for registration/login, account summaries, transaction management, settings, data export/deletion, Peloyame and the bank-simulation/notification workflow. These operations must be used through the deployed API and are subject to backend authentication and ownership checks; they are not the same as the public synthetic-demo endpoints.

## Behind the scenes: how we're approaching development

Pelo Finance is being developed incrementally: start with a small end-to-end experience, test the journey, collect feedback, and prioritise the next improvement. Product decisions, visual design, code and security notes should describe the same reality.

### Agile delivery, pragmatically applied

We break work into manageable slices such as the demo journey, responsive navigation, cash-flow views, forecasting and scenario behaviour. The intended loop is to prioritise a small backlog, agree what a change should achieve, implement it, review the result, test the changed path and record follow-up issues. Scrum-style planning, check-ins, reviews and retrospectives are useful team practices where the team actually performs them; this README does not imply that every formal Scrum ceremony has been conducted.

### Secure Software Development Lifecycle (SSDLC)

Security belongs throughout the development lifecycle, not only just before deployment. Our documented lifecycle is:

![Pelo Finance secure software development lifecycle](docs/assets/ssdlc-lifecycle.svg)

The lifecycle is a process target. Each release still needs evidence that its relevant build, functional, accessibility and security checks passed. A diagram or checklist alone is not proof of a completed review.

### STRIDE threat modelling

STRIDE gives the team a vocabulary for exploring six classes of threat:

- **Spoofing:** someone pretends to be another user or service.
- **Tampering:** a client alters transaction values, identifiers or scenario inputs.
- **Repudiation:** a sensitive action cannot be traced to a reliable event record.
- **Information disclosure:** a user sees someone else's records or a log exposes sensitive data.
- **Denial of service:** an endpoint or import consumes excessive resources.
- **Elevation of privilege:** a user or service gets permissions beyond its role.

For Pelo Finance, these risks make authentication, server-side ownership checks, safe import handling, secret management, data minimisation and negative authorization tests important future gates. The prototype now includes an authenticated account path and hosted persistence, but these are not a security certification. Account isolation, session lifecycle, data handling, operational monitoring and production threat mitigations must continue to be tested. The threat-modelling work is an initial design exercise, not an independent penetration test or security certification.

### Engineering principles

- **Make the demo honest:** synthetic data and simulation are labelled as such.
- **Protect money meaning:** keep authoritative calculations in validated backend logic and use integer minor units for the account ledger; forecasts remain estimates with visible assumptions and data limitations.
- **Trust the server, not client IDs:** authenticated account routes must derive identity from verified authentication and enforce record ownership on every request; regression tests should attempt cross-account access.
- **Design for failure:** loading, empty, validation, error and retry states should be clear and accessible.
- **Reduce data exposure:** do not place secrets in frontend variables or logs; collect only data the product needs.
- **Verify before claiming:** treat planned controls as planned until code and tests provide evidence.

### Frameworks and references

The secure-development plan is informed by the NIST Secure Software Development Framework (SSDF), OWASP Application Security Verification Standard (ASVS), and OWASP application-security guidance. They are reference frameworks, not certifications, and no compliance claim is made by naming them.

- [NIST Secure Software Development Framework (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Run locally

Use Node.js 20 or newer and Python 3.11 or newer.

### 1. Start the API

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Then install and run the backend:

```bash
python -m pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
For a new, empty database, this applies the baseline and subsequent migrations. For an existing database whose tables were created before Alembic tracking, inspect and back up the database before applying migrations. Never run the baseline migration against an existing schema without first verifying the starting revision.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Copy the example environment file:

```powershell
Copy-Item .env.example .env.local
```

Set `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env.local` for local development and set `VITE_CURRENCY=BWP` unless you are deliberately testing another display currency. Then run:

```bash
npm run dev
```

### 3. Build and test

```bash
cd frontend
npm run build
```

From the backend directory:

```bash
python -m pytest
```

The browser SPA fallback is configured in `frontend/vercel.json` so refreshing a workspace route should serve the frontend entry point. Verify that network requests use the intended backend origin in the browser developer tools.

## What is implemented, and what is still ahead?

### Implemented in the current hackathon MVP

- Public landing page and synthetic-demo journey.
- Registration and login for the private account experience.
- Account-scoped business profile and ledger operations.
- Overview, Activity, Forecast, PeloScore, Peloyame and Settings sections.
- Short-term forecast and lean-week scenario experience.
- Illustrative PeloScore with stated limitations.
- Groq-backed Peloyame with bounded input/context and read-only intent.
- Simulated bank connections, transaction events and in-app notifications.
- Supabase PostgreSQL hosting and Alembic schema migrations.
- Responsive layouts and light/dark theme support.

### Remaining work before any real financial integration or commercial launch

1. Complete broader security testing, including session lifecycle and cross-account isolation.
2. Review privacy, retention/deletion, incident response, backup/restore and operational monitoring.
3. Complete a full production threat review and validate all deployed settings/secrets.
4. Obtain a suitable bank/mobile-money provider and implement an approved consent/authorization flow before claiming real account connectivity.
5. Validate forecasting performance against suitable data and document PeloScore methodology before making predictive or outcome-related claims.
6. Conduct relevant legal and regulatory review before processing real customer financial data commercially.

Do not enter bank passwords, card security codes or OTPs into Pelo Finance. The bank simulation is not a live provider integration. Do not use forecasts or PeloScore to make lending, eligibility or other consequential decisions.

## Project documentation

- [Product requirements](PRD.md)
- [Design system](DESIGN.md)
- [Secure development lifecycle](docs/ssdlc.md)
- [STRIDE threat model](docs/threat-model.md)
- [Architecture notes](docs/system-architecture.md)

## Feedback

This is an evolving hackathon project. Feedback is especially useful on whether the product story is clear, whether the cash-flow and lean-week views are understandable, and what a user would need to trust the experience. Please report UI issues, confusing language, accessibility problems or missing test cases through the repository's issue workflow.

---

**Pelo Finance** — *Make your money story visible.*