# Pelo Finance release and visual QA checklist

Use this checklist on the exact build that will be demonstrated. A successful compile is not a substitute for browser and API checks.

## Build and API

- [ ] `frontend/npm run build` completes without TypeScript or Vite errors.
- [ ] `backend/python -m pytest` passes.
- [ ] `GET /api/health` returns HTTP 200 and identifies the application as `pelo-finance`.
- [ ] `GET /api/personas` returns seeded synthetic profiles.
- [ ] Browser Network panel shows profile/dashboard requests going to the configured backend origin, not accidentally to the frontend host.
- [ ] `VITE_API_BASE_URL` in Vercel points to the deployed API origin without a trailing slash; the backend CORS allowlist includes the exact frontend origin.
- [ ] Direct refresh on every `/app/...` view returns the SPA entry point.

## Brand and assets

- [ ] No old product names, logos, favicon links, splash assets, or old CSS selectors remain in active code or current documentation.
- [ ] Favicon, sidebar mark, horizontal lockup, wordmark, and transparent P render without broken paths.
- [ ] Loading and onboarding show the transparent P mark; the mark is decorative and does not block controls.
- [ ] Current product references use Pelo Finance and PeloScore consistently.

## Theme and typography

- [ ] First visit follows the operating-system preference when no theme has been saved.
- [ ] Manual theme selection persists after reload and direct route load.
- [ ] No light-theme flash is noticeable when dark mode is already saved.
- [ ] Both font requests can fail and the page still renders readable body text, headings, monetary figures, and controls.
- [ ] Verify card borders, dialog backgrounds, listbox options, focus rings, chart grid, chart labels, and tooltips in both themes.
- [ ] Confirm visible focus states and sufficient contrast for muted labels on terracotta and data surfaces.

## Navigation and motion

- [ ] Desktop sidebar starts compact; expand and collapse preserve selected navigation and do not obscure content.
- [ ] The hamburger glyph transitions into an X when the drawer is open; Escape and clicking the backdrop close the drawer.
- [ ] Focus stays within the modal drawer while open and returns to its trigger on close.
- [ ] Mobile bottom navigation fits at 320 px width, respects device safe areas, and leaves the final content scrollable.
- [ ] Browser Back and Forward update the selected view.
- [ ] Route view, drawer, listbox, and onboarding transitions behave without layout jumps.
- [ ] `prefers-reduced-motion: reduce` disables floating and other non-essential animation.

## Product flow

- [ ] Welcome screen opens, explains the demo, and dismisses by CTA and Escape.
- [ ] Changing profile loads the corresponding dashboard.
- [ ] Overview renders metrics, chart, score explanation, forecast, insights, and recent synthetic activity.
- [ ] Activity, Forecast, PeloScore, and Settings render the correct view and have no broken links.
- [ ] Lean-week simulation shows a busy/disabled button state and only updates after the API response succeeds.
- [ ] Reset returns the scenario to baseline after a successful server response.
- [ ] Failed requests show an alert and actionable retry, without a false success state.
- [ ] Empty/loading states remain readable with reduced motion and keyboard navigation.

## Product safety boundary

- [ ] The UI states that data is synthetic and no bank account is connected.
- [ ] PeloScore is described as illustrative and unvalidated, never as creditworthiness or a lending decision.
- [ ] No real bank password, account number, or OTP is requested.
- [ ] The public demo has no route into personal data because real-user authentication is not implemented.

## Production gap before real data

- [ ] Authentication, data ownership, tenant isolation, and authorization tests are implemented.
- [ ] Shared demo scenario state is replaced by per-session state or read-only simulation.
- [ ] Database migrations, backup/recovery, retention/deletion, monitoring, and incident response are implemented.
- [ ] Security and Botswana regulatory/privacy reviews are complete before live account connection.
