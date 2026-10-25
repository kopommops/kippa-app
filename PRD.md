# Pelo Finance — Product Requirements Document

**Version:** Hackathon implementation sprint | **Owner:** Kgotla Data Labs

## 1. Product intent

Pelo Finance helps owner-operated micro and small businesses see their recorded cash position, understand recent money-in/money-out patterns, and consider the next seven days. PeloScore is the flagship illustrative signal; Peloyame is a read-only assistant that explains selected information from the account's permitted financial summary.

The objective for this sprint is an end-to-end working MVP—not an unbounded feature set. A new user must be able to register, create a single business profile, record transactions, refresh the app and return to their own data. Synthetic demo data remains optional.

## 2. User and problem hypotheses

The primary hypothesis is that some Botswana owner-operators need a clearer way to understand near-term cash availability and prepare for a difficult week. The initial validation cohort should focus on accessible Gaborone segments such as tuck shops, food vendors, market traders and small retailers. This is a research direction, not an established description of all local owners.

Research must establish what users currently do, which decisions are difficult, whether enough records can be entered consistently, and whether users will pay. The initial P0 / P25 / P49 pricing structure remains an experiment rather than validated willingness-to-pay evidence.

## 3. Journeys

### Public synthetic demo

A visitor can explore labelled synthetic personas, a dashboard, transaction history, a seven-day illustrative forecast, a lean-week scenario and PeloScore explanations. No persona should be mistaken for a signed-in user's business.

### Authenticated account journey

1. Register with owner name, email, password, business name, business type and optional opening cash.
2. Sign in to a 12-hour signed-token session.
3. View account-only summary with current recorded cash, 30-day totals and a transparent average-based outlook.
4. Add and delete manual income and expense records, with type, positive amount, category, date and description.
5. Test a lean-week estimate without writing scenario values into actual ledger records.
6. Review the account-level PeloScore preview and its factor explanations once enough recent records exist; otherwise see the minimum-data explanation.
7. Ask Peloyame questions about the supplied summary; receive concise answers or clear fallback messages.
8. Sign out and later sign in again. A second account must never see the first account's records.

## 4. Requirements

- Passwords are hashed using Argon2; raw passwords are never stored or logged.
- Authenticated endpoints check ownership from the server-verified user identity. The client cannot choose another user ID to read or mutate account entries.
- Monetary ledger entries are stored as positive integer minor units (thebe); type determines whether they add to or subtract from cash.
- Required inputs are validated by the backend. The frontend provides UX validation, not the sole security boundary.
- The account dashboard discloses that its forecast uses recent average totals, indicates the number of distinct recent dates with records, and does not claim a validated forecasting model.
- PeloScore appears only after at least three recent records across two distinct dates. It shows four transparent factors, and is explicitly not a credit score or lending decision.
- The lean-week scenario reduces forecast inflows by 45% for demonstration purposes; it must not mutate actual transactions.
- Peloyame receives a minimal generated summary, not user email, user identity or raw descriptions. It is read-only, enforces a five-question session cap and a separate daily user cap, and has bounded request/response sizes.
- API keys are backend-only. Provider outages and 429 responses produce helpful fallback messages.
- Public OTP, bank, mobile-money or credit-verification flows must not claim to be real unless a provider integration has been implemented and tested.

## 5. Forecast and PeloScore guardrails

The account MVP's forecast is an average-based baseline, not an ML model. It is weak when transaction history is sparse, incomplete or irregular. Display the signal-quality indicator and assumptions. Negative cash or a reserve warning is a planning signal only, not a guarantee or professional recommendation.

The existing demo PeloScore is heuristic and front-end generated. Do not market it as a credit score or use it for lending, eligibility or pricing. A future score requires a documented methodology and appropriate representative data, validation, calibration, explainability and fairness assessment.

## 6. Peloyame scope

Supported: explanations of current recorded balance, recent totals, category summaries, runway estimate, the average-based seven-day outlook and its limitations. The model should make practical suggestions only where supported by supplied context.

Out of scope: executing payments, changing ledger records, connecting to bank or mobile-money systems, revealing secrets or other users' data, definitive tax/legal/investment advice, or making credit decisions. The instruction primer and heuristic filters are defence-in-depth rather than a guarantee of blocking every malicious or unsupported request.

## 7. Hackathon success criteria

- A first-time visitor can register and reach a personalised account dashboard without selecting a synthetic persona.
- A newly saved income and expense update current recorded cash correctly to the nearest thebe.
- A refresh and sign-in preserve account records.
- A second account cannot list, delete or infer the first account's transactions.
- The lean-week action changes a projection but not the ledger.
- Peloyame answers an in-scope question from generated context, refuses a request to reveal secrets, and handles missing API key or provider limits without disabling the ledger.
- Both `/account` and `/app/overview` can be refreshed directly in the browser.
- Frontend production build and backend test suite pass before deployment.

## 8. Not included in this sprint

Live bank or mobile-money connections, real OTP, credit bureau checks, multi-user team roles, invoicing, accounting exports, recurring transaction automation, a validated score, payment collection, marketplace referrals, underwriting, production-grade regulatory compliance and scale testing.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Existing database path changes silently | Keep existing `DATABASE_URL`, back up first, add new tables non-destructively. |
| User data crosses account boundaries | Server-side ownership checks and a two-user negative test. |
| Numbers become inconsistent | Integer minor-unit ledger; backend calculates current balance and forecasts. |
| AI hallucinates or follows hostile text | Minimal context, strict instruction primer, bounded output, validation, safe fallbacks and human review of demo answers. |
| Free-tier limits or model availability change | Check the active Groq model/limits, enforce local quotas, stop gracefully rather than upgrade automatically. |
| Demo appears more integrated than it is | Label all synthetic and simulated flows; do not claim real provider connections. |
| Shared deployment loses records | Use a persistent database and test restart/restore before relying on it. |

## 10. Tomorrow's polish

After critical flow and tests pass: review responsive spacing, wording, empty states, keyboard flow, chart annotations, icon alignment and minor visual refinements. Do not defer broken authentication, data isolation, persistence, calculation correctness or secret handling.
