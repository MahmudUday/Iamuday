const CACHE_VERSION = "orion-v3160";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./offline.html", "./icon-192.png", "./icon-512.png"];
const OFFLINE_URL = "./offline.html";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("message", event => { if (event.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(fetch(request, { cache: "no-store" }).then(response => {
      if (response && response.ok) { const copy = response.clone(); caches.open(CACHE_VERSION).then(cache => cache.put("./index.html", copy)); }
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("./index.html")) || (await caches.match(OFFLINE_URL))));
    return;
  }
  event.respondWith(caches.open(CACHE_VERSION).then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => caches.match(request)));
});
