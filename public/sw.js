/**
 * Clearline service worker (P0.6 base) — app-shell + font caching.
 *
 * Scope: makes the app installable and gives an offline shell. The HONEST offline behaviour
 * for commute data (last-known times + a freshness banner, never a fake live value) is layered
 * on later (P11.4 / ERD §9) — this base only caches the static shell, never transit times.
 */
const CACHE = "clearline-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never cache cross-origin (APIs, tiles)

  // Never cache API responses — commute/plan data must stay live-or-honestly-stale, not SW-cached.
  if (url.pathname.startsWith("/api/")) return;

  // Static assets → cache-first. Navigations/pages → network-first with cached shell fallback.
  const isAsset = url.pathname.startsWith("/_next/") || /\.(?:svg|png|woff2?|ico|css|js)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => cachePut(request, res))),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => cachePut(request, res))
      .catch(() => caches.match(request).then((hit) => hit || caches.match("/"))),
  );
});

function cachePut(request, response) {
  if (response && response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}
