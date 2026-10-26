# Install Pelo Finance as a web app

Pelo Finance can be installed as a Progressive Web App (PWA) when the deployed frontend serves the web app manifest, icons and service worker over HTTPS. Installation provides an app-style window and a launcher/home-screen icon; it does **not** turn the prototype into a native banking application.

## Install on desktop Chrome or Edge

1. Open the live application at <https://pelo-finance.vercel.app/>.
2. Select **Install app** in Pelo Finance, if the browser offers the install prompt.
3. Confirm the browser's install dialog. If the in-page prompt is unavailable, open the browser menu and look for **Install Pelo Finance** or the install icon in the address bar.
4. Launch Pelo Finance from the installed app shortcut.

If Chrome displays only **Create shortcut**, update to the deployed commit that contains `manifest.webmanifest` and `sw.js`, reload the page, and retry. In Chrome DevTools, inspect **Application → Manifest** and **Application → Service Workers**. Confirm the manifest loads, its 192×192 and 512×512 icons load, and the service worker is registered and activated.

## Install on Android

1. Open the site in Chrome.
2. Use **Install app** if available, or choose **Install app** / **Add to Home screen** in the browser menu.
3. Confirm and launch Pelo Finance from the home screen.

## Add to the iPhone or iPad Home Screen

1. Open the site in Safari.
2. Tap **Share**.
3. Select **Add to Home Screen** and confirm.

The browser-managed prompt differs across platforms; Safari on iOS does not use Chrome's `beforeinstallprompt` event.

## What works offline?

The service worker caches the application shell and same-origin static assets so the app can reopen its interface after it has loaded successfully at least once. It deliberately does **not** cache API calls, authentication responses, financial records, bank simulation events or Peloyame conversations. Signing in, loading account data, using Peloyame and creating simulated events require a network connection and a functioning backend.

Do not treat installation as evidence of data being stored offline or as a backup mechanism.

## Release checks

After deploying a change that modifies the manifest, icons or service worker:

- Open the production site over HTTPS.
- Confirm `/manifest.webmanifest` returns JSON with the app name, root scope, standalone display mode and all icon entries.
- Confirm `/sw.js` returns JavaScript, not the SPA's `index.html`.
- Confirm the 192×192, 512×512 and maskable PNG files return successfully with the correct dimensions.
- Confirm the service worker installs and activates without console errors.
- Test installation on Chrome desktop and, if available, Android Chrome.
- Test the network-offline state only as an app-shell check; account features should show their normal unavailable/error state rather than imply data is cached.
- Test that API requests are not stored in Cache Storage.

## Data and safety boundaries

Pelo Finance is a hackathon prototype. The bank connection and incoming/outgoing bank events are simulations, not live banking connections. PeloScore is illustrative and not statistically validated. Do not enter bank passwords, card security codes or OTPs.
