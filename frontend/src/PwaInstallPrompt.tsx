import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform?: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

type StandaloneNavigator = Navigator & { standalone?: boolean };

function isRunningInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as StandaloneNavigator).standalone === true;
}

function isAppleMobile(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** A non-blocking install affordance shared by the landing, demo and account views. */
export function PwaInstallPrompt() {
  const [installed, setInstalled] = useState(isRunningInstalled);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [appleMobile] = useState(isAppleMobile);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setHelpOpen(false);
    };
    const media = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => setInstalled(isRunningInstalled());

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);
    media.addEventListener?.('change', onDisplayModeChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener?.('change', onDisplayModeChange);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setHelpOpen(true);
      return;
    }
    setBusy(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    } catch {
      setHelpOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="pwa-install-button"
        onClick={handleInstall}
        disabled={busy}
        aria-haspopup="dialog"
        aria-label="Install Pelo Finance as an app"
      >
        <Download size={17} aria-hidden="true" />
        <span>{busy ? 'Opening…' : 'Install app'}</span>
      </button>

      {helpOpen && (
        <div className="pwa-install-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setHelpOpen(false);
        }}>
          <section className="pwa-install-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
            <button className="pwa-install-close" type="button" aria-label="Close install help" onClick={() => setHelpOpen(false)}>
              <X size={18} />
            </button>
            <p className="pwa-install-eyebrow">TAKE PELO WITH YOU</p>
            <h2 id="pwa-install-title">Install Pelo Finance</h2>
            {appleMobile ? (
              <p>On an iPhone or iPad, open this page in Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</p>
            ) : (
              <p>In Chrome or Edge, open the browser menu and look for <strong>Install Pelo Finance</strong> or the install icon in the address bar.</p>
            )}
            <p className="pwa-install-note">If the menu offers only “Create shortcut”, reload the latest deployed version and check that the app manifest and service worker are available. On desktop Chrome, inspect DevTools → Application → Manifest and Service Workers.</p>
            <button type="button" className="pwa-install-dismiss" onClick={() => setHelpOpen(false)}>Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
