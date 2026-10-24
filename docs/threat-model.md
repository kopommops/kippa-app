# Pelo Finance initial STRIDE threat model

**Status:** initial design-time threat review. Not an independent penetration test, security audit or certification.

## Scope

The prototype contains a browser-based React/TypeScript UI and a FastAPI/SQLAlchemy API. Seeded user profiles and transaction records are synthetic. A future production product would introduce authenticated users, private financial records, imports and potentially provider integrations. These future capabilities expand the threat surface and are not assumed to be implemented today.

## STRIDE review

| Category | Example risk | Planned defensive direction | Evidence required |
|---|---|---|---|
| **Spoofing** | An unauthenticated caller acts as a user or forges identity | Verify sessions/tokens on the server and deny protected access by default | Tests for missing, invalid and expired credentials |
| **Tampering** | A client changes record IDs, transaction values or scenario inputs | Validate schemas and business rules; calculate authority on the server; enforce ownership | Invalid-value tests and tampering / IDOR tests |
| **Repudiation** | A privileged change cannot be traced | Record appropriately redacted security/audit events | Verify event completeness without logging sensitive payloads |
| **Information disclosure** | Users read other users' records or logs expose sensitive values | Owner-scoped queries, data minimisation and redacted logs | Two-user isolation tests and log review |
| **Denial of service** | Requests or future CSV files exhaust resources | Bound payload sizes and row counts; add timeouts, rate limits and safe workload limits | Boundary tests and authorised staging checks |
| **Elevation of privilege** | A lower-privilege user gains administrative or owner permissions | Explicit role checks, least privilege and protected deployment configuration | Negative permission tests and access review |

## Immediate rule

Keep the prototype synthetic-data-only until server-verified authentication, ownership enforcement, scenario isolation, privacy review and the relevant negative tests are implemented and verified. Do not ask users for bank passwords or real bank OTPs. A simulated provider must be unmistakably labelled and isolated from live provider credentials.

## References

- [NIST SP 800-218: Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
