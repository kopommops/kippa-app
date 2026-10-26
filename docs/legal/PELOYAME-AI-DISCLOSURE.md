# Pelo Finance — Peloyame AI Disclosure (draft)

**Version:** 2026-10-26-v1

Peloyame is optional and read-only. When enabled, Pelo sends the user's question and a minimised summary of relevant financial information to Groq to generate a response. The summary may include balances, income/expense totals, category aggregates, runway estimates and illustrative PeloScore factors; it is designed to exclude the user's name, email and raw transaction descriptions.

Do not include passwords, bank credentials, OTPs, government identifiers or other sensitive personal details in a question. AI responses can be incorrect and are not professional financial, tax, legal or lending advice.

The account allowance is up to 20 accepted questions per user per UTC day, shared across sessions and devices. Provider rate limits may temporarily prevent responses. A question accepted by the server may count even if the provider later fails.

Users can disable AI processing in account settings. After withdrawal, the API blocks future Peloyame requests before sending financial context to Groq. Withdrawal does not retroactively erase data already sent to an external provider; provider retention terms and logs may apply. Verify current provider settings and retention terms before launch.
