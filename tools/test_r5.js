#!/usr/bin/env node
// review #5 checks: g1/g2 games have no XP/turns text, no rival or daily card after 3 cleared stages; tech's last ⚡ chapter has >=3
// stages; locked map stages are not tab stops; cloze 8287/8318 options.  EQ_URL=http://localhost:8765 node tools/test_r5.js
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const BASE = (process.env.EQ_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const HE = { 1: 'א׳', 2: 'ב׳', 3: 'ג׳', 132: 'אחרי י״ב' };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
async function onboard(page, grade) {
  await page.goto(BASE + '/manifest.webmanifest');
  await page.evaluate(() => new Promise(r => { localStorage.clear(); const q = indexedDB.deleteDatabase('englishQuest'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.click(grade > 100 ? 'button.gradebtn.wide' : `button.gradebtn[aria-label="כיתה ${HE[grade]}"]`);
  if (grade > 100) { await page.waitForSelector('button.track-card'); await page.locator('button.track-card', { hasText: 'טכנולוגית' }).click(); }
  await page.fill('input.name', 'בדיקה'); await page.click('button.avpick'); await page.waitForSelector('.mapv .hud', { timeout: 15000 });
}
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  for (const g of [1, 2, 3]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'he-IL' }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(g + ' ' + e.message));
    await onboard(p, g);
    await p.evaluate(async () => { const s = await import('./js/store.js'); const t = s.S.tracks[s.S.profile.track] ||= { stages: {} }; t.stages ||= {}; for (const i of [0, 1, 2]) t.stages[i] = { games: {}, cleared: true, stars: 3, plays: 1 }; s.save(); });
    await p.goto(BASE + '/#/stage/0'); await p.goto(BASE + '/#/'); await p.waitForSelector('.mapv .hud'); await sleep(300);
    const cards = await p.evaluate(() => ({ rival: !!document.querySelector('.rival-chip'), daily: !!document.querySelector('.daily-card') }));
    if (g <= 2) ok(!cards.rival && !cards.daily, `g${g} map after 3 cleared stages: no rival/daily card ${JSON.stringify(cards)}`);
    else ok(cards.rival && cards.daily, `g${g} map still has rival+daily cards ${JSON.stringify(cards)}`);
    for (const game of (g <= 2 ? ['pics', 'memory'] : ['match', 'memory'])) {
      await p.goto(BASE + `/#/play/0/${game}`); await p.waitForSelector('.game'); await sleep(400);
      // answer one item right so the counter updates
      const t = await p.evaluate(() => ({ gxp: document.querySelector('.gxp')?.textContent || '', moves: !!document.querySelector('.moves') }));
      if (g <= 2) ok(!/XP|\d/.test(t.gxp) && !t.moves, `g${g} ${game}: top bar has no XP number / turns counter (${JSON.stringify(t)})`);
      else ok(/XP/.test(t.gxp), `g${g} ${game}: XP counter kept (${t.gxp})`);
    }
    await ctx.close();
  }
  { // tech chapters + locked tab stops
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, locale: 'he-IL' }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push('tech ' + e.message));
    await onboard(p, 132);
    const ch = await p.evaluate(async () => { const d = await import('./js/data.js'); const sizes = []; for (let wi = 0; wi < d.D.worlds; wi++) sizes.push(d.chapterEnd(wi) - wi * d.PER_WORLD); return { sizes, n: d.D.stages.length, last: d.worldOf(d.D.stages.length - 1) }; });
    ok(Math.min(...ch.sizes) >= 3 && ch.sizes.reduce((a, c) => a + c, 0) === ch.n && ch.last === ch.sizes.length - 1, `tech chapters ${JSON.stringify(ch)}`);
    const banners = await p.locator('.wbanner, .whead, .world h2').allTextContents().catch(() => []);
    const lockTab = await p.evaluate(() => [...document.querySelectorAll('button.node.lock')].filter(e => e.tabIndex >= 0).length);
    const locks = await p.locator('button.node.lock').count();
    ok(locks > 0 && lockTab === 0, `locked stages ${locks}, tab stops among them ${lockTab}`);
    let hitLock = false; for (let k = 0; k < 60; k++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement?.classList.contains('lock'))) hitLock = true; }
    ok(!hitLock, 'Tab x60 never focuses a locked stage');
    await ctx.close();
  }
  { const ctx = await b.newContext(); const p = await ctx.newPage(); await p.goto(BASE + '/data/b3c1.json'); const d = JSON.parse(await p.evaluate(() => document.body.innerText));
    ok(d.sent['8287'][0].o.join() === 'formerly,ceremony,disturb' && !d.sent['8318'][0].o.includes('bent'), 'cloze 8287/8318 ' + JSON.stringify([d.sent['8287'], d.sent['8318']])); await ctx.close(); }
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  await b.close(); console.log(fails.length ? `R5 FAIL ${fails.length}` : 'R5 ALL PASS'); process.exit(fails.length ? 1 : 0);
})();
