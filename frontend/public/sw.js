/* Pelo Finance PWA service worker.
 * Cache only the app shell and same-origin static assets. Never cache API calls,
 * authentication responses, financial records, or Peloyame conversations.
 */
'use strict';

const CACHE_PREFIX = 'pelo-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}shell-v1`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/pelo-app-icon-192.png',
  '/assets/pelo-app-icon-512.png',
  '/assets/pelo-app-icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // API calls are network-only, even when a same-origin proxy is used in development.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('/index.html', response.clone());
        }
        return response;
      } catch {
        const cachedShell = await caches.match('/index.html') || await caches.match('/');
        if (cachedShell) return cachedShell;
        return new Response(
          '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pelo Finance offline</title><body style="font:16px system-ui;padding:2rem;background:#F5F2EB;color:#1A1A1A"><h1>You are offline</h1><p>Reconnect to use your Pelo Finance account and refresh this page.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        );
      }
    })());
    return;
  }

  const isStaticAsset = url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.webmanifest' ||
    ['script', 'style', 'image', 'font'].includes(request.destination);
  if (!isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
