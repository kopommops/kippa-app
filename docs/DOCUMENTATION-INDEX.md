# Pelo Finance Documentation Index

This index is the starting point for team members, reviewers and future contributors. The documentation is intentionally organised by task: understand the product, run it, operate the hosted database, inspect security boundaries, and validate a release.

## Start here

| Document | Use it for |
|---|---|
| [Repository README](../README.md) | Project overview, live links, stack and local quick start |
| [Product requirements](../PRD.md) | Product goals, scope and requirements |
| [Design system](../DESIGN.md) | Visual identity and interface principles |
| [User guide](USER-GUIDE.md) | How to explore the synthetic demo and private account |
| [PWA installation guide](PWA-INSTALLATION.md) | Installing Pelo Finance and diagnosing browser installability |
| [90-second demo video script](DEMO-VIDEO-SCRIPT-90-SECONDS.md) | Recording the sub-90-second hackathon walkthrough |

## Engineering and operations

| Document | Use it for |
|---|---|
| [System architecture](system-architecture.md) | High-level data flow and architecture boundaries |
| [Supabase setup](SUPABASE-SETUP.md) | Hosted PostgreSQL configuration |
| [Migration explanation](MIGRATIONS-EXPLAINED.md) | Schema migration concepts and safe database upgrade paths |
| [Focused update runbook](FOCUSED-UPDATE-RUNBOOK.md) | Implementation and local verification steps |
| [SSDLC](ssdlc.md) | Secure development lifecycle and release evidence |
| [STRIDE threat model](threat-model.md) | Initial threat categories, mitigations and test evidence |
| [QA test plan](QA-TEST-PLAN.md) | Acceptance and regression checks |

## Documentation maintenance rules

- Describe the current implementation separately from planned work.
- State explicitly that bank connections/events are simulated until an approved provider integration exists.
- Do not call PeloScore a credit score or imply it predicts lending outcomes.
- Never place passwords, API keys, database connection strings or live demo credentials in public Markdown.
- Prefer relative links for repository documentation and assets so the documentation works in a cloned repository.
- Update the README, user guide and QA checklist when a user-visible workflow changes.
