/* eslint-disable no-restricted-globals */

// Minimal cache-first SW for static assets + offline fallback.
// Note: keep this file in /public so it is served from "/sw.js".

const CACHE_NAME = "ordix-static-v4";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        "/",
        "/manifest.webmanifest",
        "/boxes-icon-192.png",
        "/boxes-icon-512.png",
        "/boxes.png",
        "/favicon.ico",
        OFFLINE_URL
      ]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Avoid caching API routes.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache-first for same-origin GET.
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);

        // Only cache successful basic/cors responses.
        if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        // If navigation fails, show offline page.
        if (req.mode === "navigate") {
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
        }
        throw new Error("Offline");
      }
    })()
  );
});

