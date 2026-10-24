# Pelo — Design System

## Design principle
Modern Swiss minimalism with a restrained glassmorphism layer. Use clear grid alignment, large confident type, quiet surfaces, deliberate spacing, and one energetic accent. Avoid the generic blue fintech dashboard look.

## Brand architecture
- Product: **pelo** (lowercase wordmark)
- Signature feature: **KippaScore**
- Promise: make the financial story of irregular earners visible

## Palette — 60 / 30 / 10
- Obsidian `#1A1A1A`: structure, dark brand moments, primary type, loading/welcome canvas
- Warm cream `#F5F2EB`: main app canvas and human, editorial surfaces
- Burnt terracotta `#D96B43`: primary actions, active chart/score indicators, risk highlights
- Supporting neutrals: `#FFFDF8`, `#E4DFD5`, `#777168`
- Green is used sparingly for positive context only, not as a competing brand accent.

## Typography
- **Nunito 800/900**: kippa wordmark, page headings, KippaScore, key numeric display
- **DM Sans 400–700**: body, labels, navigation, form controls, data labels
- Use sentence case for headings and tabular numerals for financial amounts.

## Signature asset: obsidian-glass K
The welcome/loading screen centres a large K rendered as a standalone SVG. The mark uses a dark glass-like gradient, restrained highlight strokes, terracotta edge detail, soft shadow, and a translucent container. Keep it as the hero; avoid adding decorative blobs or extra glow everywhere else.

## UI principles
- 8px spacing rhythm; content width capped around 1240px.
- Rounded corners: 11–18px; pills reserved for status.
- Border-first surfaces with subtle shadows; blur only on the top bar, hero glass mark, and score panel.
- Terracotta CTA contrast must remain readable.
- Respect `prefers-reduced-motion`; all controls have visible focus states.
- Mobile: stack dashboard panels, use 2-column metric cards, keep primary actions full width, avoid horizontal scrolling.

## Screen hierarchy
1. Dark welcome screen: glass K, lowercase wordmark, concise value proposition, one CTA, synthetic-data disclosure.
2. Dashboard header and persona picker.
3. KippaScore feature panel: number, explanation factors, synthetic/unvalidated notice.
4. Four financial metrics.
5. Income history and forecast/stress-test panels.
6. Next-action insights and recent synthetic activity.

## Assets
All authored assets live in `frontend/public/assets/`: `kippa-mark.svg`, `kippa-favicon.svg`, `kippa-wordmark.svg`, `kippa-glass-k.svg`, and `onboarding-pattern.svg`. They are normal SVG files, not base64 data URLs.

## Accessibility
Semantic landmarks, labels, keyboard-operated Headless UI selector, focus-visible styles, reduced-motion support, and plain-language synthetic data disclaimers. Do not communicate risk by colour alone; include text.
