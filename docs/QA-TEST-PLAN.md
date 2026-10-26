# Pelo Finance focused update — QA plan

Use a disposable local database first. Do not test account deletion on a real owner's account.

## Automated backend tests

From `backend/`:

```powershell
python -m pytest -q
python -m alembic current
```

The existing 17 tests must continue to pass; the focused update adds tests for account settings, data export, account deletion and simulated bank connections/events. The expected migration head is `20261025_0002`.

## User journey

1. Open the landing page. Test light/dark mode and sticky navigation while scrolling.
2. Open login/signup. Confirm the theme applies to logo, headings, form fields, help text, dropdowns and buttons. No OTP is required for the hackathon prototype.
3. Register a disposable user and confirm the authenticated private workspace opens.
4. Navigate through Overview, Activity, Forecast, PeloScore, Peloyame and Settings on desktop and mobile.
5. Add an income and expense, refresh the page, then verify the balance, activity and forecast reconcile.
6. Check PeloScore with insufficient data, then add enough records to activate it. Confirm the factor explanations are visible and the score is labelled illustrative, not a credit score.
7. Ask Peloyame a question about the current cash summary. Test missing `GROQ_API_KEY`, rate-limit response, out-of-scope input and an attempted prompt injection. The UI must show a useful error/fallback rather than raw provider details.
8. In Settings, edit the owner/business details. Email is not changed by the profile update form.
9. Export the account JSON and confirm it excludes the password hash and access tokens.
10. Connect a **simulation-only** bank profile. Trigger an incoming event and an outgoing event. Confirm each creates a ledger record with source `bank_simulation`, updates the account summary and creates an in-app notification.
11. Confirm the screen explicitly says no real bank activity occurred. No bank password, card PIN or OTP should be requested.
12. Sign out, sign back in and verify records persist.
13. Register a second user and verify that first-user transactions, connections and notifications cannot be read, changed or deleted by the second user, including by calling API endpoints directly.
14. Delete the first disposable account after typing the confirmation phrase required by the UI. Confirm subsequent login fails and its associated records are gone.
15. Test synthetic demo profile dropdown and confirm it is not clipped or overlapped by the next section.
16. Test the public page, demo and account workspace in both themes at desktop/tablet/mobile widths. The sticky header, sidebar/bottom navigation and floating back-to-top control must not cover content or controls.

## Manual deployment checks

- The backend uses the intended `DATABASE_URL` and reports health.
- Supabase migration revision is at the expected head.
- The deployed frontend points to the intended backend, not localhost.
- CORS allows the exact deployed frontend origin.
- No `.env`, database backup, export file, JWT, password or Groq key appears in `git status` or a staged diff.
- Existing logo and image assets remain unchanged unless explicitly listed in the package manifest.
- Run `git diff --check` and `npm run build`; fix errors before deployment.

## Evidence to save for review

Record the test summary, migration revision, build result and any failures that remain. Do not include secret values or real customer data in screenshots/logs.
