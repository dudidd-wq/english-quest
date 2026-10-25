// Service worker: precache the app shell, cache word audio on demand (with Range support for Safari).
const VERSION = 'eq-3.0.0';
const SHELL = 'eq-shell-' + VERSION;
const AUDIO = 'eq-audio-v1';            // audio file names never change, kept across versions
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'fonts/rubik.woff2',
  'js/app.js', 'js/util.js', 'js/data.js', 'js/store.js', 'js/audio.js', 'js/games.js',
  'data/pre1.json', 'data/b1c1.json', 'data/b1c2.json', 'data/g7.json', 'data/g9.json', 'data/b3c1.json', 'data/b3c2.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // only touch this app's caches (the same github.io origin hosts other apps)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('eq-shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
async function rangeResponse(req, res) {
  const range = req.headers.get('range');
  if (!range || !res) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range); const size = buf.byteLength;
  let start = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : size - 1;
  if (m && !m[1] && m[2]) { start = Math.max(0, size - +m[2]); end = size - 1; }
  end = Math.min(end, size - 1);
  if (start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (/\/audio\/(en|he)\/\d+\.mp3$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(AUDIO); const key = new Request(url.href);
      let res = await cache.match(key);
      if (!res) {
        try { const net = await fetch(key); if (!net.ok) return net; await cache.put(key, net.clone()); res = net; }
        catch { return new Response('', { status: 504 }); }
      }
      return rangeResponse(req, res);
    })());
    return;
  }
  // data JSON: network-first so content fixes arrive, fall back to cache offline
  if (/\/data\/(g7|g9)\.json$/.test(url.pathname)) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cl = r.clone(); caches.open(SHELL).then(c => c.put(req, cl)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // app shell: cache-first (new versions arrive via a new SW VERSION), network fallback
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await caches.match('index.html') : null);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && r.type === 'basic') { const cl = r.clone(); caches.open(SHELL).then(c => c.put(req, cl)); }
      return r;
    } catch { return req.mode === 'navigate' ? caches.match('index.html') : new Response('', { status: 504 }); }
  })());
});
