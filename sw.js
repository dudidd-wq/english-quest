// Service worker: precache the app shell, cache word audio on demand (with Range support for Safari).
const VERSION = 'eq-3.6.0';
const SHELL = 'eq-shell-' + VERSION;
const AUDIO = 'eq-audio-v1';            // audio file names never change, kept across versions
// clips re-recorded in place (same file name): evicted from the audio cache on activate so users get the new take
const REFRESH = [
  'audio/en/33094.mp3', 'audio/en/0573.mp3', 'audio/en/1629.mp3', 'audio/en/8057.mp3', 'audio/en/30062.mp3', 'audio/en/30927.mp3',
  'audio/he/1431.mp3', 'audio/he/1211.mp3', 'audio/he/11035.mp3', 'audio/he/10010.mp3',
  'audio/he/33027.mp3', 'audio/he/33072.mp3', 'audio/he/33092.mp3', 'audio/he/33159.mp3', 'audio/he/33172.mp3',
  'audio/he/11044.mp3', 'audio/he/11058.mp3', 'audio/he/8656.mp3', 'audio/he/33045.mp3', 'audio/he/11099.mp3',
  // eq-3.6.0 (review #3)
  'audio/en/0578.mp3', 'audio/en/0582.mp3', 'audio/en/1001.mp3', 'audio/en/1133.mp3', 'audio/en/1407.mp3', 'audio/en/1562.mp3', 'audio/en/1641.mp3', 'audio/en/5160.mp3', 'audio/en/7242.mp3', 'audio/en/7303.mp3', 'audio/en/7307.mp3', 'audio/en/8384.mp3', 'audio/en/11021.mp3', 'audio/en/31153.mp3', 'audio/en/33171.mp3',
  'audio/en/0096.mp3', 'audio/en/0097.mp3', 'audio/en/0402.mp3', 'audio/en/0567.mp3', 'audio/en/0590.mp3', 'audio/en/0667.mp3', 'audio/en/1100.mp3', 'audio/en/1119.mp3', 'audio/en/1128.mp3', 'audio/en/1626.mp3', 'audio/en/1633.mp3', 'audio/en/1686.mp3', 'audio/en/1696.mp3', 'audio/en/5068.mp3', 'audio/en/7015.mp3', 'audio/en/7043.mp3', 'audio/en/7388.mp3', 'audio/en/8095.mp3', 'audio/en/8448.mp3', 'audio/en/8455.mp3', 'audio/en/9051.mp3', 'audio/en/20013.mp3',
  'audio/he/0893.mp3', 'audio/he/6402.mp3', 'audio/he/5043.mp3', 'audio/he/32072.mp3', 'audio/he/32192.mp3', 'audio/he/11101.mp3', 'audio/he/31210.mp3',
];
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'fonts/rubik.woff2',
  'js/app.js', 'js/util.js', 'js/data.js', 'js/store.js', 'js/audio.js', 'js/games.js', 'js/backup.js',
  'data/pre1.json', 'data/b1c1.json', 'data/b1c2.json', 'data/g7.json', 'data/g9.json', 'data/b3c1.json', 'data/b3c2.json',
  'data/early.json', 'data/abc.json', 'data/acad.json', 'data/tech.json', 'data/c1.json', 'data/c2.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // only touch this app's caches (the same github.io origin hosts other apps)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('eq-shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => caches.open(AUDIO)).then(c => Promise.all(REFRESH.map(u => c.delete(new URL(u, self.registration.scope).href, { ignoreSearch: true }))))
    .catch(() => {}).then(() => self.clients.claim()));
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
  if (/\/data\/\w+\.json$/.test(url.pathname)) {
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
