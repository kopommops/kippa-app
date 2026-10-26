/** Register the static app-shell service worker in production builds only. */
export function registerPeloServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      // Keep the application usable when service-worker registration is blocked.
      console.warn('Pelo Finance offline shell could not be registered.', error);
    });
  }, { once: true });
}
