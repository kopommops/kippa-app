# Kippa — Product Requirements Document

## Product statement
Kippa makes the financial patterns of irregular earners easier to understand and, over time, easier to communicate to formal financial services. KippaScore is an explainable financial-consistency signal, not a replacement for regulated credit scoring.

## Users
- Informal traders and spaza-shop operators
- Ride-hailing and delivery drivers
- Freelancers and home-based service providers

## Problem
Income can be real but irregular. Conventional products often expect payslips, stable monthly salary, or an established credit history. People may therefore struggle to demonstrate the patterns behind their income and expenses.

## Hackathon objective
Ship one complete, deployed experience that proves how a financial pattern can be made legible and actionable, using synthetic data clearly identified as synthetic.

## Core journey
1. Enter through a branded welcome screen.
2. Select one of three demo personas.
3. View the cash-flow summary and KippaScore explanation.
4. Review the next-seven-day forecast.
5. Trigger a 45% lower-inflow stress scenario.
6. See updated risk context and recommended next action.
7. Reset the scenario to baseline.

## MVP requirements
- Responsive layout for mobile and desktop, keyboard-accessible controls.
- SVG logo, favicon, wordmark, and obsidian-glass K illustration.
- Synthetic demo data disclosed in the UI.
- KippaScore demonstration heuristic with explanatory factors and an explicit unvalidated disclaimer.
- Deterministic scenario changes; no alteration of historical transaction records.
- Forecast endpoint, health endpoint, persona endpoint, dashboard endpoint, scenario endpoint.
- Local SQLite default and environment-based PostgreSQL-compatible connection.

## Out of scope
- Real bank integration or claiming that a feed is verified
- Actual loan or buffer disbursement, underwriting, or approval
- Production credit score or claims of predictive validity
- Real user onboarding/KYC, financial account linking, or storing sensitive bank credentials
- LLM-driven scoring

## KippaScore prototype factors
The interface surfaces cash-flow resilience, observed income activity, and source/evidence quality. The visible 0–100 number is a demo heuristic. It is not a creditworthiness determination, and synthetic transactions do not prove real-world reliability. A production version requires representative data, a documented target outcome, calibration, out-of-sample evaluation, explainability, bias testing, consent, governance, and approval from relevant legal/compliance stakeholders.

## Acceptance criteria
- User can load each persona without typing.
- A lean-week simulation visibly changes forecast outputs.
- Reset restores the baseline.
- UI works at 320px width and on desktop.
- No base64-embedded raster assets; branding assets are SVG files.
- No financial output is described as an approved loan or validated credit score.
- All synthetic-data disclaimers are visible without opening documentation.

## Success measures for judging
- Demo journey completes in under two minutes.
- Judges can explain the problem, signal, and value after a short walkthrough.
- The app remains usable if an API call fails and offers a retry path.
- Demo is deployed, rehearsed, and backed by a short recorded walkthrough.
