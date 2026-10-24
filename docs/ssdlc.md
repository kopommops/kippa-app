# Pelo Finance secure software development lifecycle (SSDLC)

**Status:** intended lifecycle and current planning guidance. This document is not evidence that every gate has passed for the current prototype.

![Secure software development lifecycle](assets/ssdlc-lifecycle.svg)

## Lifecycle stages

1. **Discover:** define user problem, value, scope, acceptance criteria, assumptions and data classification. Use synthetic records for demos.
2. **Design and threat model:** document the current and intended architecture, data flows and trust boundaries. Use STRIDE to identify threats, then record mitigations, owners and verification tests.
3. **Build:** make small, reviewable changes; validate untrusted input on the server; avoid secrets in source/client bundles; review new dependencies.
4. **Verify:** run builds, unit and API integration tests, accessibility checks, dependency/security scans and negative authorization tests appropriate to the change.
5. **Release:** deploy a reviewed revision with environment configuration, health checks, rollback ownership and migration readiness understood.
6. **Observe and improve:** collect low-sensitivity operational signals and feedback, prioritise fixes, revisit threats and update the documentation.

## Minimum release evidence

- Changed code builds and relevant tests pass.
- Acceptance criteria have been exercised.
- Threats affecting the changed flow have been reviewed.
- Errors and logs do not expose secrets or financial payloads.
- Accessibility and responsive behaviour are checked for affected screens.
- Demo/simulation language matches actual behaviour.
- Known risks and unfinished controls are recorded.
- Deployment, configuration and rollback impacts are understood.

## Current scope boundary

Pelo Finance is a synthetic-data hackathon prototype. Authentication, tenant ownership, cross-user isolation, production migrations, real bank integration and a validated PeloScore model must not be assumed to exist merely because they appear in the lifecycle or architecture diagram.
