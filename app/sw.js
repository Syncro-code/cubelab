// Offline support: precache the app shell, then serve cache-first and refresh
// in the background. Bump VERSION on every release so phones pick up updates.
const VERSION = 'cubelab-v1.0.0';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'vendor/three.module.min.js',
  'js/app.js',
  'js/version.js',
  'js/store.js',
  'js/stats.js',
  'js/timer.js',
  'js/sound.js',
  'js/scrambler.js',
  'js/cube/model.js',
  'js/cube/colors.js',
  'js/cube/scramble.js',
  'js/cube/solver333.js',
  'js/cube/scramble-worker.js',
  'js/data/algs.js',
  'js/data/guides.js',
  'js/ui/dom.js',
  'js/ui/cube3d.js',
  'js/ui/diagrams.js',
  'js/ui/chart.js',
  'js/ui/confetti.js',
  'js/ui/player.js',
  'js/views/shared.js',
  'js/views/timerView.js',
  'js/views/timesView.js',
  'js/views/learnView.js',
  'js/views/cubeView.js',
  'js/views/settingsView.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') return cache.match('index.html');
    return new Response('Offline', { status: 503 });
  })());
});
