#!/usr/bin/env node
// Live 3.7.0 -> 3.8.0 upgrade check against GitHub Pages, in two phases sharing one browser profile:
//   node tools/live_upgrade.js pre   (BEFORE the deploy: live is eq-3.7.0; create progress, seed eq-audio-v2 with a retired + a kept clip)
//   node tools/live_upgrade.js post  (AFTER the deploy: same profile picks up the new SW; progress kept, retired clip evicted, new clips served, offline OK)
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const B = process.env.EQ_LIVE || 'https://dudidd-wq.github.io/english-quest/', DIR = '/tmp/eq_liveup', PH = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  if (PH === 'pre') require('child_process').execSync(`rm -rf ${DIR}`);
  const R = { phase: PH, errors: [] }, fail = m => R.errors.push(m);
  const ctx = await chromium.launchPersistentContext(DIR, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, args: ['--mute-audio'] });
  const page = ctx.pages()[0] || await ctx.newPage(); page.on('pageerror', e => fail('PAGEERROR ' + e.message)); page.on('dialog', d => d.accept());
  const swv = () => page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); const a = r && r.active; if (!a) return null; return (await (await fetch(a.scriptURL, { cache: 'no-store' })).text()).match(/VERSION = '([^']+)'/)[1]; });
  try {
    await page.goto(B + '#/', { waitUntil: 'networkidle' });
    if (PH === 'pre') {
      await page.click('button.gradebtn[aria-label="כיתה ה׳"]'); await page.fill('input.name', 'נועה'); await page.click('button.avpick');
      await page.waitForSelector('.mapv .hud', { timeout: 20000 });
      await page.evaluate(async () => { const s = await import('./js/store.js'); s.S.xp = 4321; s.T('b1c1').words[6005] = { b: 3, due: 99999, ok: 4, bad: 1, seen: 1 }; s.save(true); });
      await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
      R.swVersion = await swv(); R.caches = await page.evaluate(async () => (await caches.keys()).join(','));
      R.audioSeed = await page.evaluate(async () => { const c = await caches.open('eq-audio-v2'); for (const u of ['audio/en/7306.mp3', 'audio/en/9192.mp3', 'audio/en/0001.mp3', 'audio/en/58057.mp3']) { const r = await fetch(u); if (r.ok) await c.put(new URL(u, location.href).href, r); } return (await c.keys()).map(r => r.url.split('/').pop()).sort().join(','); });
      if (R.swVersion !== 'eq-3.7.0') fail('live is not 3.7.0 before deploy: ' + R.swVersion);
    } else {
      for (let t = 0; t < 40; t++) {
        R.upd = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); try { await r.update(); } catch (e) { return 'ERR ' + e.message; } const w = r.installing || r.waiting; if (!w) return 'none'; return await new Promise(res => { const f = () => { if (w.state === 'activated' || w.state === 'redundant') res(w.state); }; w.addEventListener('statechange', f); f(); setTimeout(() => res('timeout ' + w.state), 60000); }); });
        R.caches = await page.evaluate(async () => (await caches.keys()).join(',')); if (R.caches.includes('eq-shell-eq-3.8.0')) break; await sleep(3000);
      }
      await page.reload({ waitUntil: 'networkidle' }); await sleep(1500); await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('.mapv .hud', { timeout: 20000 });
      R.swVersion = await swv(); R.caches = await page.evaluate(async () => (await caches.keys()).join(','));
      if (R.swVersion !== 'eq-3.8.0') fail('active SW ' + R.swVersion);
      if (!R.caches.includes('eq-shell-eq-3.8.0') || R.caches.includes('eq-shell-eq-3.7.0')) fail('caches ' + R.caches);
      R.kept = await page.evaluate(async () => { const s = await import('./js/store.js'); return { name: s.S.profile?.name, xp: s.S.xp, w6005: s.T('b1c1').words[6005]?.ok }; });
      if (R.kept.xp !== 4321 || R.kept.w6005 !== 4 || R.kept.name !== 'נועה') fail('progress lost ' + JSON.stringify(R.kept));
      R.audioAfter = await page.evaluate(async () => (await (await caches.open('eq-audio-v2')).keys()).map(r => r.url.split('/').pop()).sort().join(','));
      if (/(^|,)(7306|9192)\.mp3/.test(R.audioAfter)) fail('retired clip not evicted: ' + R.audioAfter);
      if (!/0001\.mp3/.test(R.audioAfter) || !/58057\.mp3/.test(R.audioAfter)) fail('kept clip evicted: ' + R.audioAfter);
      R.clips = await page.evaluate(async () => { const o = {}; for (const n of ['77306', '89192', '70402', '70578', '78853', '80333', '81162', '58057', '79192', '78057']) o[n] = (await fetch(`audio/en/${n}.mp3`, { cache: 'no-store' })).status; return o; });
      for (const n of ['77306', '89192', '70402', '70578', '78853', '80333', '81162', '58057']) if (R.clips[n] !== 200) fail('clip ' + n + ' ' + R.clips[n]);
      R.data = await page.evaluate(async () => { const j = async t => (await fetch(`data/${t}.json`, { cache: 'no-store' })).json(); const a = await j('b3c1'), b = await j('b3c2'); return { bay: a.words.find(w => w.n === 8057).ae, considerate: b.words.find(w => w.n === 9192).ae, c8386: (a.sent || {})['8386'] ? a.sent['8386'][0].o : JSON.stringify(a).match(/journalist","o":\[[^\]]*\]/)?.[0] }; });
      if (R.data.bay !== 58057 || R.data.considerate !== 89192) fail('data ' + JSON.stringify(R.data));
      await ctx.setOffline(true); await page.reload({ waitUntil: 'load' }).catch(() => {});
      await page.waitForSelector('.mapv .hud', { timeout: 20000 }).catch(() => fail('offline map'));
      R.offline = await page.evaluate(async () => { const f = async u => (await fetch(u)).ok; return { b1c1: await f('data/b1c1.json'), c1: await f('data/c1.json'), clip0001: await f('audio/en/0001.mp3') }; });
      if (!R.offline.b1c1 || !R.offline.c1 || !R.offline.clip0001) fail('offline ' + JSON.stringify(R.offline));
    }
  } catch (e) { fail('EXC ' + e.message.split('\n')[0]); }
  await ctx.close(); console.log(JSON.stringify(R)); console.log(R.errors.length ? 'FAIL' : 'PASS'); process.exit(R.errors.length ? 1 : 0);
})();
