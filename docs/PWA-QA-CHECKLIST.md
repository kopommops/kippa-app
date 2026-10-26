# PWA acceptance checklist

Run this checklist against the deployed Vercel site after merging the PWA files.

## Build and static files

- [X] `npm run build` succeeds from `frontend/`.
- [X] `/manifest.webmanifest` returns a valid web app manifest.
- [X] `/sw.js` returns JavaScript, not the SPA HTML fallback.
- [X] `/assets/pelo-app-icon-192.png` is 192×192.
- [X] `/assets/pelo-app-icon-512.png` is 512×512.
- [X] `/assets/pelo-app-icon-maskable-512.png` is 512×512.
- [X] `/assets/apple-touch-icon.png` is 180×180.

## Browser installation

- [X] Chrome DevTools → Application → Manifest shows Pelo Finance, standalone display and icons with no manifest errors.
- [X] Application → Service Workers shows `/sw.js` installed and activated.
- [X] The in-app **Install app** button triggers the browser prompt when supported.
- [X] If no prompt is available, the in-app help gives relevant manual install directions.
- [X] Installed app opens in a standalone window and recognises it is already installed.
- [X] Test Chrome desktop; test Android Chrome or iOS Safari if a device is available.

## Regression and data-safety checks

- [X] Landing, login/signup, synthetic demo and private account still render.
- [X] Light/dark theme toggle continues working.
- [X] No private API response is present in Cache Storage.
- [X] Offline navigation may show the app shell, but account/API features report network unavailability honestly.
- [X] Service worker does not intercept/cache API requests or non-GET mutations.
- [X] Refresh direct SPA routes such as `/app/overview` and `/account` to verify Vercel rewrites still work.
- [X] The installed app updates after a new deployment and stale caches are removed when the worker version changes.
