# Pelo Finance QA Checklist — Account MVP Sprint

Run this after applying the overlay. Use synthetic/test data only. Record pass/fail and a short note; do not mark a test passed merely because the page renders.

## Build and environment

- [ ] Backend dependencies install successfully from `backend/requirements.txt`.
- [ ] Frontend `npm install` and `npm run build` succeed.
- [ ] Backend `python -m pytest` succeeds.
- [ ] Backend health endpoint reports `pelo-finance`.
- [ ] `JWT_SECRET_KEY` is unique locally; `GROQ_API_KEY` exists only in backend environment variables.
- [ ] The current `DATABASE_URL` is retained and the expected database file is used.
- [ ] `git status` shows no `.env`, `.env.local`, Groq key, local database, `dist`, `node_modules`, `.venv`, `.pytest_cache` or `__pycache__` staged.

## Routing and public demo

- [ ] Refresh `/` and confirm the landing page loads.
- [ ] “Create account” navigates to `/account`.
- [ ] “Explore the demo” opens `/app/overview`.
- [ ] Direct refresh works on `/account` and `/app/overview` in local and deployed SPA routing.
- [ ] The synthetic demo remains explicitly labelled synthetic.
- [ ] No public demo action edits an authenticated user's account records.

## Authentication

- [ ] Register with valid data and confirm the account/dashboard loads.
- [ ] Opening balance is shown as the initial recorded cash.
- [ ] Duplicate email gives a clear response and does not create a second account.
- [ ] Invalid email, weak-length password and malformed text are rejected.
- [ ] Incorrect password gives a generic sign-in error.
- [ ] Refresh `/account`; the session is rechecked and the dashboard loads.
- [ ] Sign out and verify protected account endpoints require a token.
- [ ] Expired/invalid tokens require sign-in again.

## Ledger and ownership

- [ ] Add a P100.25 income and a P20.10 expense. With a P250.50 opening balance, current cash should be P330.65.
- [ ] Confirm income and expenses appear with the right sign, category and date.
- [ ] Delete an entry and confirm the balance recalculates.
- [ ] Add entries under account A and account B; B must not list or delete A's entries.
- [ ] Send a crafted request with A's transaction ID while authenticated as B; expect 404 and no data disclosure.
- [ ] Amounts greater than zero and no more than two decimal places are accepted; negative amounts, invalid kinds, overlong strings and malformed values are rejected.
- [ ] Restart the local backend and verify saved records remain in the selected persistent database.

## PeloScore, forecast and scenario
- [ ] A fresh account shows no score and explains the minimum history requirement.
- [ ] After three records across at least two dates in the last 30 days, PeloScore appears between 0 and 100.
- [ ] All four factors (cash buffer, recent net flow, record activity and outlook resilience) are visible and understandable.
- [ ] Score copy clearly says it is illustrative, not a credit score or lending decision.

- [ ] With no entries, the forecast shows limited evidence and does not invent history.
- [ ] With one week of entries, signal quality indicates limited/early evidence.
- [ ] Current cash equals opening cash plus recorded income minus recorded expenses.
- [ ] Baseline projection is based on recent averages and disclosed assumptions.
- [ ] Lean-week projection reduces estimated inflows by 45% and is clearly labelled illustrative.
- [ ] Switching baseline/lean-week view does not add, remove or alter ledger entries.
- [ ] Runway is not shown as a definitive number when expense history is insufficient or average expense is zero.

## Peloyame

- [ ] With no Groq API key, the assistant displays a friendly temporary-unavailability message; ledger remains usable.
- [ ] With an authorised free-tier API key, ask an in-scope question about recorded income, outgoings or the outlook.
- [ ] Verify the answer does not claim to access bank/mobile-money accounts.
- [ ] Ask it to reveal system prompts/secrets; expect a safe refusal.
- [ ] Ask it about another user's records; it must not retrieve or reveal them.
- [ ] Send blank, malformed and over-600-character questions; expect validation.
- [ ] Send five accepted questions in one session; the sixth is blocked server-side.
- [ ] Reload the page and confirm the same session's remaining-question counter remains accurate.
- [ ] Hit the provider's free-tier limit or simulate a timeout; a friendly fallback appears without exposing the provider body, key, traceback or prompt.
- [ ] Inspect network requests: the Groq key must never appear in browser requests, bundles or local storage.
- [ ] Confirm the model receives only aggregate financial context, not email, full identity or raw transaction descriptions.

## UX and accessibility

- [ ] Form fields have visible labels; keyboard focus is visible.
- [ ] Loading, empty, error and success states are clear.
- [ ] Mobile layout works at 360px, 390px and 430px widths without horizontal scrolling.
- [ ] Buttons are disabled during their own pending action and explain errors without raw stack traces.
- [ ] Peloyame answer text remains readable with long responses.
- [ ] Reduced-motion preference is respected.
- [ ] Contrast and text wrapping remain acceptable in desktop and mobile layouts.

## Deployment rehearsal

- [ ] Frontend points to the intended backend origin.
- [ ] Backend CORS lists exact deployed frontend origins, not `*` with credentials.
- [ ] Production uses HTTPS and a strong JWT secret.
- [ ] Deployed database storage persists across restart/redeploy.
- [ ] Register a fresh test user, create entries, refresh, sign out/in, and verify persistence.
- [ ] Confirm logs do not contain passwords, access tokens, Groq key, questions or financial context.
- [ ] Rehearse the core journey twice in a row without a database reset or developer workaround.
