# Font loading and fallback checks

## Primary pairing

- Display: Syne, 400 to 800.
- Body/UI: Scoutie Sans, 200 to 800, normal and italic.
- Body fallback stack: `"Scoutie Sans", "Google Sans", "Inter", "Aptos", "Segoe UI", sans-serif`.
- Display fallback stack: `"Syne", "Montserrat", "Arial Black", sans-serif`.

The Google Fonts stylesheet is linked in `frontend/index.html`. The CSS fallback list is applied even if the stylesheet is blocked or fonts have not loaded yet. No font binary is bundled in this package.

## Browser verification

1. Run the app in a browser with network access and wait for the page to finish loading.
2. In DevTools Console, run:

   ```js
   await document.fonts.ready;
   ({ scoutie: document.fonts.check('400 16px "Scoutie Sans"'), syne: document.fonts.check('700 32px Syne') });
   ```

   A `true` result indicates that the requested family/face is available for the tested sample. Also verify the Network panel shows successful font stylesheet and font file requests.
3. Use DevTools Request Blocking to block `fonts.googleapis.com` and `fonts.gstatic.com`, then reload.
4. Confirm the app still has readable body copy, distinct headings, visible navigation labels, legible currency values, no horizontal overflow, and functioning controls at 320 px, tablet, and desktop widths.
5. Run the check in both theme modes. Font loading must not change state, route, or theme.

This repository package was validated for declared CSS fallback stacks and TypeScript syntax, but the browser/network font-loading test above remains a local release check because the package authoring environment did not have the frontend npm dependencies or external network available.

## Licensing

Scoutie Sans and Syne are available through Google Fonts and distributed under the SIL Open Font License 1.1. If the project later self-hosts the font files, copy the official OFL notice alongside the files and preserve the copyright and licensing information.

References: https://fonts.google.com/specimen/Scoutie+Sans and https://fonts.google.com/specimen/Syne
