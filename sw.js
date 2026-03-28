const CACHE_NAME = 'lighthouse-v3-resilient';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './gcp-orchestrator.js',
  './manifest.json'
];

// 1. Install Phase: Cache the Core App Shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate Phase: Cleanup old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => k !== CACHE_NAME && caches.delete(k))
    ))
  );
});

// 3. Fetch Strategy: Tiered Approach
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API calls: Network First, Fallback to informative error
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline: Intelligence Bridge requires a connection." }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Assets: Stale-While-Revalidate for speed
  e.respondWith(
    caches.match(e.request).then((res) => {
      const fetchPromise = fetch(e.request).then((networkRes) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkRes.clone()));
        return networkRes;
      });
      return res || fetchPromise;
    })
  );
});
