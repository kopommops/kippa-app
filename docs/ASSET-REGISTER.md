# Pelo Finance Asset Register

SVG assets are editable source files stored in `frontend/public/assets/`; the app references them via `/assets/...` paths.

| Asset | Role | Notes |
|---|---|---|
| `pelo-mark.svg` | Primary brand mark | Used by landing and account navigation. |
| `pelo-mark-mono.svg` | Monochrome mark | Light-surface fallback. |
| `pelo-mark-mono-dark.svg` | Reverse monochrome mark | Dark-surface fallback. |
| `pelo-favicon.svg` | Browser icon | High-contrast simplified mark. |
| `pelo-wordmark.svg` | Standalone wordmark | Fixed brand artwork. |
| `pelo-horizontal.svg` | Horizontal product lockup | Docs and landscape placements. |
| `pelo-glass-p.svg` | Decorative transparent P | Landing/brand art; not an interaction or status. |
| `onboarding-pattern.svg` | Decorative background pattern | Keep subtle and non-interactive. |
| `peloyame-mark.svg` | Peloyame assistant mark | Read-only helper identity; not a bank/payment badge. |
| `pelo-empty-ledger.svg` | Empty ledger illustration | Decorative only (`alt=""`); nearby copy explains the empty state. |

## Accessibility notes

- Keep meaning and status in live text, not only inside SVG artwork.
- Give linked product marks an accessible link name; use empty alt text for decorative images.
- Avoid rasterising SVGs unless a platform requires it.
- Preserve contrast in both themes and honour reduced-motion preferences.
- Do not embed changing copy, prices, financial metrics or simulation disclosures into the SVG source.
