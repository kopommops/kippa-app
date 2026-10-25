# Implementation Sprint File Manifest

## Updated files

| Destination in repository | Purpose | Important note |
|---|---|---|
| `README.md` | Local setup, product scope and demo disclosures | Replaces previous demo-only scope language. |
| `PRD.md` | Updated MVP requirements and non-goals | Distinguishes the account journey from the synthetic demo. |
| `DESIGN.md` | Account portal interaction and style guidance | Retains the existing design system and adds account-portal rules. |
| `backend/app/config.py` | JWT and Groq configuration | Reads secrets only from backend environment. |
| `backend/app/models.py` | Adds users, business profile, user ledger and AI usage tables | Retains existing Persona/Transaction models. |
| `backend/app/schemas.py` | Registration, login, ledger, dashboard and chat validation/output models | Amounts are bounded; ledger amounts allow two decimals. |
| `backend/app/main.py` | Preserves demo endpoints and adds account/auth/AI endpoints | New private endpoints require a signed access token. |
| `backend/requirements.txt` | Adds `PyJWT`, `pwdlib[argon2]`, and `groq` | Reinstall dependencies in the existing virtual environment. |
| `backend/.env.example` | Documents required backend values | Do not copy over an existing `.env`. |
| `frontend/.env.example` | Documents the local API base URL | Do not copy over an existing `.env.local`. |
| `frontend/vercel.json` | Adds SPA rewrites for `/account` and `/app/*` refreshes | Created only when no existing Vercel configuration exists; if one exists, the script leaves it untouched for manual merge. |
| `frontend/src/App.tsx` | Adds an `/account` route and landing-page account CTAs | Based on the current Pelo branding overlay. Review your diff first. |
| `frontend/src/index.css` | Adds landing-page account CTA styles | Preserves existing Pelo styling from the design overlay. |

## New application files

- `backend/app/security.py` — password hashing, access-token minting and current-user dependency.
- `backend/app/account_service.py` — account dashboard arithmetic and minimal AI context aggregation.
- `backend/app/ai_service.py` — Peloyame prompt, input checks, usage limits and provider error handling.
- `backend/tests/conftest.py` — test-only database configuration.
- `backend/tests/test_account_mvp.py` — auth, ledger arithmetic, isolation, validation and missing-key tests.
- `frontend/src/AccountPortal.tsx` — register/sign-in, ledger, forecast/scenario and Peloyame user experience.
- `frontend/src/accountApi.ts` — typed account API calls, bearer token handling and friendly error translation.
- `frontend/src/account.css` — responsive account portal styling.
- `frontend/public/assets/peloyame-mark.svg` — Peloyame assistant mark.
- `frontend/public/assets/pelo-empty-ledger.svg` — empty-ledger illustration.

## New documentation

- `docs/IMPLEMENTATION-RUNBOOK.md` — apply, configure, launch, verify and commit steps.
- `docs/PELOYAME-PROMPT-AND-GUARDRAILS.md` — prompt structure, supported use, safety boundaries and adversarial tests.
- `docs/SECURITY-AND-DATA-BOUNDARIES.md` — data domains, controls and limitations.
- `docs/IMPLEMENTATION-NOTES.md` — expected database and authentication behaviour.
- `docs/QA-CHECKLIST.md` — end-to-end test plan.
- `docs/ASSET-REGISTER.md` — branded and assistant SVG register.

## Files deliberately not replaced or deleted

- `backend/app/database.py`, `backend/app/seed.py`, `backend/app/services.py`, `backend/app/forecasting.py` — existing database and synthetic-demo logic.
- `frontend/src/api.ts`, `frontend/src/types.ts`, `frontend/src/main.tsx`, `frontend/index.html`, `frontend/package.json` — existing app/bootstrap/routing and dependencies.
- `.env`, `backend/.env`, `frontend/.env.local`, local databases, user-uploaded assets and existing design documentation not listed above.

## Cleanup guidance

No tracked file is deleted by this package. Only remove old `kippa-*.svg` assets after searching the repository for references and confirming they are unused. Do not delete `kippa.db` or any `.db`/`.sqlite` file simply because the old brand remains in its name; it may contain the current demo data. Generated `__pycache__`, `.pytest_cache`, and `test_pelo_implementation.db` files must not be committed.
