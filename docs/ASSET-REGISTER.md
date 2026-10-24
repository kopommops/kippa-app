# Brand asset register

All web assets are SVG source files stored in `frontend/public/assets/`. Keep these files editable in code review and use external `/assets/...` paths in the application.

| File | Role | Preferred usage | Notes |
| --- | --- | --- | --- |
| `pelo-mark.svg` | Primary logo mark | Desktop sidebar, mobile header, compact product identity | Terracotta P on warm ivory tile |
| `pelo-mark-mono.svg` | Monochrome mark | Light surfaces and monochrome applications | Dark mark on cream |
| `pelo-mark-mono-dark.svg` | Reverse monochrome mark | Dark surfaces and monochrome applications | Cream mark on charcoal tile |
| `pelo-favicon.svg` | Browser favicon | Browser tab and bookmarks | Simplified high-contrast P |
| `pelo-wordmark.svg` | Wordmark | Onboarding and splash screen | Text rendered as SVG artwork for consistent display |
| `pelo-horizontal.svg` | Horizontal logo lockup | Documentation, social cards, and landscape layouts | Brand mark plus product name |
| `pelo-glass-p.svg` | Floating transparent P | Loading and onboarding visual | Decorative only; not a button or status indicator |
| `onboarding-pattern.svg` | Decorative pattern | Optional landing/onboarding background | Low opacity and non-interactive |

## Accessibility and asset quality

- Decorative SVGs should have `alt=""` when used in the app; accessible names belong on the surrounding link or control.
- The compact product link uses the name “Pelo Finance” in its accessible label.
- Do not put critical status or meaning only inside an SVG.
- Avoid rasterising these assets for the UI unless a platform explicitly requires a raster version.
- Maintain a visible contrast ratio for the primary P against its surface in light and dark contexts.
- Do not bake changing UI copy, prices, or the synthetic-data disclosure into a logo asset.

## Font fallback behavior

The page requests Scoutie Sans and Syne from Google Fonts. CSS names Scoutie Sans first for the body, followed by Google Sans, Inter, Aptos, Segoe UI, and sans-serif. Display typography falls back from Syne to Montserrat, Arial Black, and sans-serif. The logo SVG remains legible independently of font loading. When testing without network access, disable browser cache and confirm that controls, numbers, line wrapping, and navigation remain usable with fallback fonts.
