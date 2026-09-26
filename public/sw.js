// Caches same-origin static files only. Supabase (REST/Realtime) and any other
// cross-origin request is never intercepted, so user data never lands in Cache Storage.
const CACHE = 'firstgig-v3';
const PRECACHE = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

const store = (req, res) => {
  if (res.ok && res.type === 'basic') {
    const clone = res.clone();
    caches.open(CACHE).then(c => c.put(req, clone));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: network-first, fall back to the cached app shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => store('/', res)).catch(() => caches.match('/'))
    );
    return;
  }

  // Hashed build assets never change: cache-first
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => store(req, res)))
    );
    return;
  }

  // Other static files (icon, manifest): network-first with cache fallback
  e.respondWith(
    fetch(req).then(res => store(req, res)).catch(() => caches.match(req))
  );
});
