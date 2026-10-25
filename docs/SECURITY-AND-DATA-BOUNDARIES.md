# Pelo Finance — Security and Data Boundaries (Hackathon MVP)

## Data domains

**Synthetic demo domain:** existing `Personas` and `Transaction` tables. These records are seeded examples and may be shared among demo visitors. They must never be used as a user's private account.

**Authenticated account domain:** `User`, `BusinessProfile`, `LedgerTransaction`, and `AIUsage` tables. Each ledger row has a server-populated `user_id`; routes derive that user from a signed token rather than accepting an owner ID from the client.

**AI context domain:** a server-generated summary of business type, current recorded cash, recent income/expense totals, runway estimate, top categories and forecast limitations. It omits personal identity and raw transaction descriptions.

## Security controls included in this sprint

- Argon2 password hashing via `pwdlib`.
- Signed, expiring JWTs via PyJWT.
- Pydantic input validation and length/range limits; business type and transaction category values are allowlisted to reduce context-injection surface.
- Server-side user ownership filters for transaction listing and deletion.
- Monetary records stored as integer minor units; display/API values are derived from cents.
- Prompt priming, delimiters and heuristic patterns for obvious secret-exfiltration prompts.
- Minimal AI context, bounded output, no model tools or write permissions.
- Per-session and per-user/day AI usage guardrails stored server-side.
- Friendly error translation and logs that do not intentionally include user questions, financial context or secrets.

## Explicit limitations

- SessionStorage bearer tokens can be accessed by a successful same-origin script injection. This is an MVP compromise; strict CSP, dependency review and preferably secure HttpOnly cookie sessions are needed before public launch.
- The SQL usage count is not a fully atomic distributed rate limiter. Concurrency and multi-instance deployments need shared atomic quota storage.
- Login throttling, JWT signing-secret rotation/revocation, email verification and account recovery are not implemented. Before a public pilot, add account-level and IP-aware login throttling behind the actual hosting proxy, then test to avoid collective lockout. Access ends on expiry or when the account is no longer found; there is no refresh-token flow.
- No email verification, password reset, MFA, roles, shared-business access or account deletion workflow is included.
- `create_all()` is used only to add missing MVP tables. No versioned migrations or automated rollback exist.
- CSRF controls are not applicable to the current bearer-token request pattern in the same way as cookie auth, but XSS remains a material concern.
- A prompt is not a security sandbox. Do not give the model arbitrary database, filesystem, internet, browser or transaction tools.
- Neither password hashing, validation, prompt guardrails nor these tests guarantee full production security.

## Data-handling stance

Use fictional data for judging and rehearsals. Do not collect bank credentials or sensitive personal records. Do not transmit identifiable financial context to an external AI service without documented disclosure, lawful basis, provider-term review and suitable controls. Establish retention, deletion, backup and breach response processes before a public pilot.
