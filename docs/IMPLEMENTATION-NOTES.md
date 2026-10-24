# Implementation notes for this replacement package

This package is an overlay for the existing React/Vite + FastAPI project. It is not a database migration, a production-readiness claim, or a replacement for deployment verification.

## Frontend changes

- Replaces the single-view layout with route-aware workspace views at `/app/overview`, `/app/activity`, `/app/forecast`, `/app/peloscore`, and `/app/settings` without introducing an additional routing dependency.
- Preserves the existing API paths and demo data model. The History API and `popstate` event support browser Back and Forward; `frontend/vercel.json` supplies the Vercel SPA fallback.
- Uses Headless UI Dialog/Transition for the mobile navigation drawer and onboarding modal; the persona selector remains a Headless UI Listbox.
- Uses a theme token layer and a small pre-paint script in `frontend/index.html`. Saved user preference takes precedence; otherwise the operating system preference is used.
- Changes the API client local-development fallback to `http://localhost:8000`, and URL-encodes profile IDs. The production build must set `VITE_API_BASE_URL` to the deployed API origin.
- The score calculation remains a front-end demo heuristic. It has been renamed, re-labelled, and surrounded with clearer caveats, but it has not been made a backend methodology or validated model.

## Backend changes

- Updates the application label, health response, local database filename default, CORS-origin normalisation, and missing-profile copy to Pelo Finance naming.
- Does not change data models, scenario semantics, endpoints, or the database schema.
- Keeps `Base.metadata.create_all()` for compatibility with the existing prototype, with a code comment that production schema changes need migrations. Replace this with Alembic before production use.

## Deploy/configuration steps after copying

1. Set the frontend build environment `VITE_API_BASE_URL` to the deployed FastAPI origin and `VITE_CURRENCY=BWP` on Vercel.
2. Set the backend `CORS_ORIGINS` value to the exact frontend origin, without a trailing slash.
3. Rebuild and deploy both services, then inspect the browser Network panel.
4. Open each `/app/...` path directly and refresh it.
5. Complete the checklist in [QA-CHECKLIST.md](QA-CHECKLIST.md).

## Known limits intentionally not hidden by the UI refresh

The backend's scenario flag is stored on the seeded persona, so public visitors may observe the same scenario toggle. There is no authentication, ownership model, transaction create/update/delete, bank integration, per-user state, schema migration management, or production-grade forecasting/score validation. Treat the build as a synthetic-data demo only.
