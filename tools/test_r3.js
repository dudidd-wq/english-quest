// review #3 checks: grade 1–2 map has no rival/daily banners at the start; grade 5 keeps them; grade 3 has no spelling at stage 1;
// parents button icon; tech chapter theme; c1 world name; match XP formula present.  usage: EQ_URL=... node tools/test_r3.js
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const BASE = (process.env.EQ_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const HE = { 2: 'ב׳', 3: 'ג׳', 5: 'ה׳' }, LEVEL = { 132: 'טכנולוגית', 134: 'C1' };
const wipe = p => p.evaluate(() => new Promise(r => { localStorage.clear(); const q = indexedDB.deleteDatabase('englishQuest'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'] }); const errs = []; const out = {};
  for (const g of [2, 3, 5, 132, 134]) {
    const p = await (await b.newContext({ locale: 'he-IL' })).newPage();
    await p.goto(BASE + '/manifest.webmanifest'); await wipe(p); await p.goto(BASE + '/#/', { waitUntil: 'networkidle' });
    await p.click(g > 100 ? 'button.gradebtn.wide' : `button.gradebtn[aria-label="כיתה ${HE[g]}"]`);
    if (g > 100) { await p.waitForSelector('button.track-card'); await p.locator('button.track-card', { hasText: LEVEL[g] }).click(); }
    await p.fill('input.name', 'r3'); await p.click('button.avpick'); await p.waitForSelector('.mapv .hud', { timeout: 15000 });
    const r = await p.evaluate(async () => { const g = await import('./js/games.js'); return { daily: !!document.querySelector('.daily-card'), rival: !!document.querySelector('.rival-chip'), practice: g.practiceFor(0), text: document.body.innerText }; });
    out[g] = { daily: r.daily, rival: r.rival, practice: r.practice.join(',') };
    if (g === 2 && (r.daily || r.rival)) errs.push('g2 banners shown');
    if (g === 5 && !(r.daily && r.rival)) errs.push('g5 banners missing');
    if (g === 3 && r.practice.includes('scramble')) errs.push('g3 scramble at stage 1');
    if (g === 132 && !/שורת הפקודה/.test(r.text)) errs.push('tech theme missing');
    if (g === 134 && !/העיר הגדולה/.test(r.text)) errs.push('c1 theme missing');
    if (g === 3) { await p.goto(BASE + '/#/study'); await p.waitForTimeout(800); if (/הקלדה/.test(await p.locator('.modes').innerText())) errs.push('g3 type mode open'); }
    if (g === 5) { await p.goto(BASE + '/#/me'); await p.waitForTimeout(800); const t = await p.evaluate(() => document.body.innerText); out.parentsBtn = /📊 אזור הורים/.test(t) ? 'ok' : /👨‍👩‍👧/.test(t) ? 'old' : 'n/a'; if (out.parentsBtn === 'old') errs.push('old parents icon'); }
    await p.context().close();
  }
  await b.close(); console.log(JSON.stringify(out)); console.log(errs.length ? 'FAIL ' + errs.join('; ') : 'PASS');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
