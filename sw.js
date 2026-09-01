/* ═══════════ sw.js — offline cache (v0.9: added reminders system) ═══════════
   DEV RULE: bump CACHE whenever files change. */

const CACHE = 'loop-v8';

const ASSETS = [
  './', './index.html', './stats.html',
  './css/base.css', './css/app.css', './css/site.css', './css/stats.css', './css/theme.css',
  './css/mobile.css', './css/pro.css',
  './js/storage.js', './js/habits.js', './js/fx.js', './js/timer.js', './js/extras.js',
  './js/app.js', './js/stats.js', './js/report.js', './js/settings.js', './js/pro.js', './js/pwa.js',
  './js/reminders.js', './js/reminder-ui.js',
  './manifest.json', './icons/icon.svg', './favicon.ico'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      /* allSettled: cache what exists, skip what doesn't — never crash */
      Promise.allSettled(ASSETS.map(a => c.add(a).catch(() => console.warn('sw: skipped', a))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});