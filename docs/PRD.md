# Pelo Finance: Product Requirements Document

**Status:** hackathon prototype, public synthetic-data demo  
**Flagship concept:** PeloScore  
**Primary audience:** people who earn irregularly or through several small income sources, including independent traders, service providers, and gig workers.

## 1. Product intent

Pelo Finance makes cash-flow patterns easier to understand when income does not arrive on a fixed schedule. It should help a person interpret their own money movement, recognise periods of pressure, and consider practical next steps without implying that a model can guarantee a future balance or judge a person's worth.

The public demo is an exploration of the product concept. It uses seeded fictional profiles and transactions, not connected accounts or user-provided financial data.

## 2. Core problem

Conventional financial summaries can be hard to interpret for people whose income is variable, cash-heavy, seasonal, or fragmented. A single monthly total may hide the rhythm of earnings, periods of low liquidity, and the effect of one unusually quiet week.

Pelo Finance provides a clearer view of past activity and a simple short-term estimate, with assumptions and limits stated close to the relevant output.

## 3. User groups and tasks

### Primary

- Independent and informal traders who need to understand whether money coming in is keeping pace with money going out.
- Gig and ride-hailing workers whose income varies by day or week.
- Service providers whose revenue depends on bookings, seasonal demand, or repeat customers.

### Key tasks

1. Discover the product on `/`, then choose “Explore the demo” to enter the onboarding flow.
2. Select a synthetic profile and understand that the demo data is fictional.
3. Review current balance, recent inflows/outflows, and an eight-week activity pattern.
4. Explore a seven-day estimated outlook.
5. Apply a lean-week stress scenario and return to the baseline.
6. Understand what the illustrative PeloScore is showing and what it does not mean.
7. Switch between light and dark themes and navigate comfortably on desktop and mobile.

## 4. Success criteria for the hackathon demo

- Users can distinguish the synthetic demo from a connected personal account.
- Every dashboard metric is labelled with its timeframe, source, or modelling limitation where relevant.
- Primary navigation works with pointer, keyboard, and touch input.
- Mobile navigation does not cover important content, including the final dashboard items.
- Theme choice is respected during initial render and remains selected after reload.
- Scenario actions show their working state and update the displayed result only after the API responds successfully.
- PeloScore includes an explicit statement that it is not validated and must not be used as a credit decision.

## 5. Current scope

### Implemented in the demo

- Synthetic persona selector.
- Balance and recent income/outgoing summaries.
- Weekly historical chart and recent transaction list.
- Seven-day projected income, expenses, and closing balance from the current prototype forecast service.
- Lean-week scenario and baseline reset.
- Frontend-generated illustrative PeloScore with supporting factors.
- Overview, Activity, Forecast, PeloScore, and Settings views.
- Terracotta-led surfaces, responsive navigation, light/dark themes, SVG brand assets, and reduced-motion support.

### Out of scope for this build

- User registration, identity verification, authentication, and per-account ownership.
- Real financial institution connections, credential capture, or real bank data.
- User transaction creation/edit/delete, CSV imports, or financial-data exports.
- Production-grade scenario isolation, multi-tenant authorisation, migrations, audit trails, and account deletion.
- A statistically validated credit score, lending decision, or probability of default model.
- Use of the synthetic prototype for actual eligibility, pricing, or credit assessment.

## 6. PeloScore product guardrails

PeloScore is currently a front-end demonstration heuristic built from demo forecast coverage, recent income activity, a forecast-quality label, and a shortfall flag. Its 0 to 100 value is not calibrated, statistically validated, or shown to predict a real-world outcome.

Required guardrails:

- Use the phrase **illustrative demo signal** in context. Never describe this value as a validated credit score or a measure of a person's creditworthiness.
- Show the synthetic-data disclosure beside the score and its factors.
- Treat missing or insufficient evidence as insufficient evidence, rather than automatically as poor performance.
- Never use this value for real lending, insurance, pricing, employment, eligibility, or other consequential decisions.
- Before any production version, move calculation to a versioned backend service, publish a methodology, define an outcome and evaluation protocol, and perform temporal validation, calibration, subgroup fairness analysis, and monitoring using appropriately consented representative data.

## 7. Experience requirements

- Theme: respect OS preference when no saved choice exists; persist explicit user choices.
- Navigation: desktop sidebar can reveal labels; mobile has a bottom bar and a keyboard-accessible drawer.
- Motion: consistent easing and duration tokens; short transitions; no flashing status lights; disable non-essential animation when reduced motion is requested.
- Loading: mark loading regions as busy and keep status text available to assistive technology.
- Errors: explain that a connection failed and provide a retry action. Do not show success until the server response succeeds.
- Forms and controls: visible focus, meaningful accessible names, sufficient contrast, and comfortable touch target sizes.
- Visual hierarchy: terracotta is the expressive brand colour, while cream surfaces carry data-heavy cards in light mode. Dark mode uses charcoal surfaces and the same warm accent family.

## 8. Risks and dependencies

- **Shared demo state:** scenario state is currently stored on a shared seeded persona and is not session-isolated.
- **Forecast validation:** the current forecasting service is a prototype estimate, not a financial guarantee.
- **Score validity:** the visible score is a hand-authored heuristic and is not outcome-validated.
- **Data protection:** there is no authentication, account ownership, or personal-data lifecycle implementation. Use synthetic data only.
- **Production configuration:** the frontend must be built with its actual deployed API base URL; CORS origins must exactly match the deployed frontend origin.

## 9. Roadmap

1. Complete branding and accessible interaction foundations.
2. Add server-verified authentication, ownership-aware data model, managed PostgreSQL, and database migrations.
3. Implement transaction lifecycle, CSV import validation, duplicate handling, and safe export.
4. Move forecast and PeloScore calculations to versioned backend services with tests.
5. Build an isolated bank sandbox adapter; consider real providers only after legal, operational, and security review.
6. Verify cross-user isolation, accessibility, responsive behaviour, model limitations, backup/recovery, and release operations.