#!/usr/bin/env node
// SW upgrade test (review #1, low): serve the old release (default eq-3.3.2, commit 9a1f311) and the new tree from the SAME origin
// (symlink swap), create progress on the old one, switch, reload → new SW takes control, progress (keyed by n) kept,
// then offline reload of map + c1/c2 data + a clip from cache.  usage: node tools/test_upgrade.js [oldRef]
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const { execSync, spawn } = require('child_process'); const fs = require('fs');
const OLD = process.argv[2] || '9a1f311', ROOT = '/workspace/english-quest', TMP = '/tmp/eq_up', PORT = 8799, BASE = `http://127.0.0.1:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
execSync(`rm -rf ${TMP} && mkdir -p ${TMP} && git -C ${ROOT} worktree remove --force ${TMP}/old 2>/dev/null; git -C ${ROOT} worktree add -f ${TMP}/old ${OLD} -q && ln -s ${TMP}/old ${TMP}/cur`);
// plain http.server answers 304 by mtime; the old worktree files are newer than the current ones,
// so the browser would never see the new sw.js. Serve without conditional requests/caching.
const NOCACHE_PY = `import sys, http.server as h
class H(h.SimpleHTTPRequestHandler):
    def send_head(self):
        for k in ('If-Modified-Since', 'If-None-Match'):
            if k in self.headers: del self.headers[k]
        return super().send_head()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache'); super().end_headers()
    def log_message(self, *a): pass
h.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()`;
const srv = spawn('python3', ['-c', NOCACHE_PY, String(PORT)], { cwd: TMP, stdio: 'ignore' });
const swap = () => execSync(`ln -sfn ${ROOT} ${TMP}/cur`);
(async () => {
  const R = { old: OLD, errors: [] }; const fail = m => { R.errors.push(m); };
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => fail('PAGEERROR ' + e.message)); page.on('dialog', d => d.accept());
  try {
    await sleep(800);
    // http.server cwd is the symlink resolved at start, so serve through the symlink path instead
    await page.goto(BASE + '/cur/#/', { waitUntil: 'networkidle' }).catch(() => {});
    await page.click('button.gradebtn[aria-label="כיתה ה׳"]'); await page.fill('input.name', 'נועה'); await page.click('button.avpick');
    await page.waitForSelector('.mapv .hud', { timeout: 20000 });
    await page.evaluate(async () => { const s = await import('./js/store.js'); s.S.xp = 4321; s.T('b1c1').words[6005] = { b: 3, due: 99999, ok: 4, bad: 1, seen: 1 }; s.save(true); });
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
    R.swBefore = await page.evaluate(async () => (await caches.keys()).join(','));
    swap();
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    R.served = execSync(`curl -s ${BASE}/cur/sw.js | head -2 | tail -1`).toString().trim();
    R.upd = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); try { await r.update(); } catch (e) { return 'ERR ' + e.message; } const w = r.installing || r.waiting; if (!w) return 'no new worker'; return await new Promise(res => { const f = () => { if (w.state === 'activated' || w.state === 'redundant') res(w.state); }; w.addEventListener('statechange', f); f(); setTimeout(() => res('timeout ' + w.state), 60000); }); });
    for (let t = 0; t < 60; t++) { R.keys = await page.evaluate(async () => (await caches.keys()).join(',')); if (/eq-3\.4\.0/.test(R.keys)) break; if (t % 10 === 9) await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update().catch(e => e.message)); await sleep(1000); }
    R.reg = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return [r.installing, r.waiting, r.active].map(w => w && w.state + ':' + w.scriptURL.slice(-12)).join('|'); });
    await page.reload({ waitUntil: 'networkidle' }); await sleep(2000); await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.mapv .hud', { timeout: 20000 });
    R.swAfter = await page.evaluate(async () => (await caches.keys()).join(','));
    R.kept = await page.evaluate(async () => { const s = await import('./js/store.js'); return { name: s.S.profile?.name, xp: s.S.xp, w6005: s.T('b1c1').words[6005]?.ok }; });
    if (!/eq-3\.4\.0/.test(R.swAfter)) fail('new SW cache missing: ' + R.swAfter);
    if (R.kept.xp !== 4321 || R.kept.w6005 !== 4 || R.kept.name !== 'נועה') fail('progress lost ' + JSON.stringify(R.kept));
    await ctx.setOffline(true);
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector('.mapv .hud', { timeout: 20000 }).catch(() => fail('offline map'));
    R.offline = await page.evaluate(async () => { const f = async u => (await fetch(u)).ok; return { c1: await f('data/c1.json'), c2: await f('data/c2.json'), b1c1: await f('data/b1c1.json'), sw: (await caches.keys()).join(',') }; });
    if (!R.offline.c1 || !R.offline.b1c1) fail('offline data ' + JSON.stringify(R.offline));
  } catch (e) { fail('EXC ' + e.message.split('\n')[0]); }
  await b.close(); srv.kill(); execSync(`git -C ${ROOT} worktree remove --force ${TMP}/old`);
  console.log(JSON.stringify(R)); console.log(R.errors.length ? 'FAIL' : 'PASS'); process.exit(R.errors.length ? 1 : 0);
})();
