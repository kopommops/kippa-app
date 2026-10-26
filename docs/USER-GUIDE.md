# Pelo Finance — User Guide

**Purpose:** Help reviewers understand the current hackathon MVP and navigate the public demo and private account experience.

> Pelo Finance supports cash-flow awareness and forward planning. It is not a bank, lender, credit bureau, tax adviser or source of guaranteed financial predictions.

## Open the application

- **Live app:** <https://pelo-finance.vercel.app/>
- **Source code:** <https://github.com/kopommops/pelo-finance>
- **Backend API:** <https://pelo-finance.onrender.com>

The app can be installed as a web app where supported. See [Install Pelo Finance](PWA-INSTALLATION.md).

## Choose how to explore

### Public synthetic demo

Use the demo if you want to explore the interface without registering or entering personal information. Select an example livelihood and move through the available sections:

1. **Overview:** read the example cash position and recent activity.
2. **Activity:** inspect synthetic income and expenses.
3. **Forecast:** explore the short-term estimate and its assumptions.
4. **PeloScore:** inspect the illustrative financial-consistency signal and explanatory factors.
5. **Settings:** review the available demo preferences and reset controls.

Use the lean-week scenario to compare the baseline with a quieter trading period. The scenario is an illustration, not a prediction of a guaranteed balance.

### Private account

Register with the designated test account details supplied for your evaluation or create your own prototype account. Use fictional/test financial values during a hackathon demonstration. The private workspace contains:

- **Overview:** your recorded cash summary and key indicators.
- **Activity:** add and review income/expense entries. Check the event label to distinguish a manual entry from a simulated bank event.
- **Forecast:** explore the estimated near-term cash position and scenario tools.
- **PeloScore:** understand the illustrative factors. It is not a validated credit score.
- **Peloyame:** ask concise questions about the permitted financial context you recorded. Peloyame is read-only and cannot move money.
- **Settings:** manage available profile/business details, review simulated connections, export account data or request account deletion.

Account records are stored by the deployed backend in the configured hosted database. Cross-device persistence should be demonstrated by signing in on another device against the same deployed service; do not infer that a successful local test proves hosted data has migrated.

## Peloyame

Ask focused questions such as:

- “What changed in my cash position this week?”
- “Which expenses make up most of my recorded outflow?”
- “What should I review before a quieter trading week?”

Answer quality depends on the data supplied and the current prototype's calculation methods. Peloyame may decline questions when evidence is insufficient. It does not execute transactions or provide definitive lending, legal, tax or investment decisions.

## Simulated bank connection

The bank-connection feature is for demonstration only. It can show a simulated connection, incoming/outgoing events and in-app notifications. It does not connect to a live bank or mobile-money provider, verify an account, transfer funds or receive real-time banking events. Look for labels identifying the activity as simulated.

## Important limitations

- Forecasts are estimates and can be unreliable with sparse, incomplete or unusual inputs.
- PeloScore is illustrative and has not been statistically validated.
- The simulated bank flow does not establish a real banking integration.
- The offline app shell does not cache private account records or make account functionality available offline.
- Use only test information for hackathon evaluation. Never enter bank passwords, card security codes or OTPs.

## Feedback

Reviewers should report confusing terminology, broken links, installation issues, accessibility problems or unexpected behaviour through the repository's issue workflow.
