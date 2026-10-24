# Pelo Finance Design System

**Design intention:** confident, human, and precise. Terracotta supplies warmth and energy; cream gives financial information room to breathe; charcoal provides a quiet dark-mode foundation. The design should feel distinctive without obscuring the figures.

## 1. Brand

- Product name: **Pelo Finance**
- Feature name: **PeloScore**
- Brand promise: **Make your money story visible.**
- Voice: clear, grounded, respectful, and specific about uncertainty.
- Data disclosure: write **Demo uses synthetic data** as normal supporting text, not a flashing badge or status light.

Avoid suggesting that an estimate is guaranteed, that the score represents creditworthiness, or that a real bank account is connected.

## 2. Colour tokens

### Base palette

| Token | Value | Use |
| --- | --- | --- |
| `--terracotta` | `#D96B43` | Primary action, hero surface, selected navigation, brand accents |
| `--terracotta-deep` | `#B74D2E` | Hover/pressed action and high-contrast text accent |
| `--terracotta-soft` | `#F6DED3` | Soft accent surface in light mode; remapped for dark mode |
| `--obsidian` | `#1A1A1A` | Brand dark and dark-mode base |
| `--cream` | `#F5F2EB` | Light-mode canvas |
| `--cream-bright` | `#FFFDF8` | Raised cards and content surfaces |

### Semantic tokens

Components must reference semantic tokens, not hard-code light-theme values throughout their CSS.

- `--text-primary`, `--text-secondary`, `--text-muted`
- `--surface-page`, `--surface-raised`, `--surface-soft`, `--surface-muted`
- `--border`, `--border-strong`
- `--positive`, `--positive-soft`
- `--warning`, `--warning-soft`
- `--chart-grid`, `--focus-ring`
- `--shadow-soft`, `--shadow-raised`

Light mode uses a cream page canvas with cream-white data surfaces, while a terracotta shell and hero keep the brand colour prominent. Dark mode remaps the same semantic names to charcoal surfaces and warm light text; charts, focus outlines, menus, dialogs, navigation and data labels use those tokens too.

## 3. Typography

- **Display:** Syne, using 600 to 800 weights for primary headings, product wordmark treatment, scores, and key figures.
- **Body/UI:** Scoutie Sans, variable 200 to 800, for body copy, navigation, labels, transactions, and controls.
- **Body fallback stack:** `"Scoutie Sans", "Google Sans", "Inter", "Aptos", "Segoe UI", sans-serif`.
- **Display fallback stack:** `"Syne", "Montserrat", "Arial Black", sans-serif`.
- Use tabular numerals for balances, transaction amounts, score values, and other changing financial figures.
- Avoid using overly small labels for information needed to understand a forecast. Eyebrow labels are decorative hierarchy, not the only explanation of a metric.

The web build loads Scoutie Sans and Syne from Google Fonts. If the request is blocked, either font fails to load, or the device is offline, the fallback stacks remain defined. The SVG wordmark is artwork, so it renders consistently even when the display font is unavailable. If the design is later self-hosted, bundle licensed webfont files and retain their required licence notices.

## 4. Shape, depth, and surfaces

- Primary page hero: expressive terracotta gradient with readable light text and restrained decorative P artwork.
- Dense financial information: raised cream/charcoal cards with subtle borders and shadows, not translucent glass everywhere.
- Sidebar: terracotta gradient, simple line icons, visible selected state, expanding labels.
- Card radius: typically 14 to 19 px; major hero radius: 19 to 23 px; small controls: 10 to 13 px.
- Borders: low contrast but visible in both themes. Use shadows to separate layers, not replace borders.
- P mark: standalone mark or floating glass artwork. Do not invent a replacement wordmark in product UI when the supplied SVG exists.

## 5. Layout and navigation

### Desktop

A fixed 78 px rail shows brand mark and icon-only navigation. The expand control reveals a 248 px sidebar with labels. The content area contracts with the sidebar so it does not overlap. The sidebar control animates the hamburger glyph into an X-shaped control and communicates its expanded state.

### Mobile

At widths up to 850 px, desktop sidebar is hidden. A four-item bottom bar provides Overview, Activity, Forecast, and PeloScore; Settings remains in the accessible menu drawer. The menu button opens a Headless UI dialog drawer with focus management and Escape handling. Bottom navigation includes safe-area insets and must not cover page content.

### Views

- `/app/overview`: balance summaries, PeloScore preview, cash-flow chart, forecast scenario, insights, recent activity.
- `/app/activity`: recent synthetic transactions and data source disclosure.
- `/app/forecast`: seven-day summary, scenario control, day-by-day estimates.
- `/app/peloscore`: illustrative score plus explanation and limitations.
- `/app/settings`: light/dark preference and synthetic-demo scenario reset.

These are demo views, not authenticated user workspaces. A future authenticated application must keep the public demo separate from personal account routes.

## 6. Motion system

- Fast: `150ms`
- Base: `220ms`
- Slow: `320ms`
- Standard easing: `cubic-bezier(.2, .75, .25, 1)`
- Route changes: fade with a small upward shift.
- Drawer: backdrop fade plus horizontal slide.
- Dialog/onboarding: opacity and subtle scale/vertical movement.
- Menu/listbox: short opacity and vertical movement.
- Sidebar: width and label reveal.
- Floating P mark: slow drift and a few degrees of rotation, never necessary to understand or operate the screen.
- Loading indicator: a thin travelling line; do not use strobing, repeated flashes, or decorative pulsing status dots.

`prefers-reduced-motion: reduce` disables non-essential movement and reduces transitions to near-instant. Motion should never be the only carrier of a state change.

## 7. Interaction and accessibility

- Use Headless UI for dialogs and listbox interactions. Preserve Escape handling, focus containment, and focus return.
- All controls need accessible names. Icon-only buttons need an `aria-label` and visible focus state.
- Expose selected navigation with `aria-current="page"`; expose theme selection with `aria-pressed`.
- Loading state uses a live status and `aria-busy`; errors use `role="alert"` and a retry action.
- Colour contrast must be checked for the terracotta surface, muted text, selected controls, and charts in both themes.
- Aim for 44 px or larger primary touch targets. Never let the bottom bar obscure the last item or footer.
- Keep synthetic-data disclosures as plain contextual copy. Avoid neon badges, flashing status, or pulsing green dots.

## 8. Chart and financial data treatment

- Income and outgoings must use consistent colours and persistent legend labels.
- Axes and tooltips use semantic theme tokens; hover-only tooltips cannot be the only way to access chart context.
- Use BWP unless the deployment explicitly sets another currency.
- State time ranges, forecast horizon, and model uncertainty near the figure.
- Keep numeric columns tabular and align amounts consistently.
- Use “projected”, “estimated”, “illustrative”, and “synthetic” precisely. Do not label a prototype estimate as guaranteed.

## 9. Brand asset map

Assets are regular SVGs under `frontend/public/assets/`:

- `pelo-mark.svg`: primary colour mark.
- `pelo-mark-mono.svg`: monochrome mark for light surfaces.
- `pelo-mark-mono-dark.svg`: reverse monochrome mark for dark surfaces.
- `pelo-favicon.svg`: favicon.
- `pelo-wordmark.svg`: display wordmark for onboarding.
- `pelo-horizontal.svg`: horizontal mark plus name.
- `pelo-glass-p.svg`: translucent floating P used on loading and onboarding.
- `onboarding-pattern.svg`: optional subtle repeat/hero pattern.

The web UI should reference these via `/assets/...` paths, not embed base64 content. Use `alt=""` when the SVG is purely decorative and provide the product name on the surrounding link/button. See [docs/ASSET-REGISTER.md](docs/ASSET-REGISTER.md) for file roles and usage.