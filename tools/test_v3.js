#!/usr/bin/env node
// v3 end-to-end: every grade (4–12) × mobile & desktop, all stage games + boss + study modes, migration, profiles, offline.
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const fs = require('fs');
const BASE = process.env.EQ_URL || 'http://127.0.0.1:8765';
const ONLY = process.env.VP; const GR = process.env.GRADES ? process.env.GRADES.split(',').filter(Boolean).map(Number) : [4, 5, 6, 7, 8, 9, 10, 11, 12];
const SHOTS = '/workspace/english-quest/shots/v3'; fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VPS = { mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1280, height: 860 } } };
const LEVEL = { 10: 4, 11: 5, 12: 3 };
const errors = [], results = [];
const HE = { 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳', 11: 'י״א', 12: 'י״ב' };

async function solveStep(page) {
  return page.evaluate(() => {
    const q = s => [...document.querySelectorAll(s)];
    if (document.querySelector('.rbox')) return 'done';
    const opts = q('.opts .opt:not([disabled])'); if (opts.length) { (opts.find(b => b._ok) || opts[0]).click(); return 'opt'; }
    const tiles = q('button.tile:not([disabled])');
    if (tiles.length) { const e = tiles.find(t => t.side === 'en'); const hh = tiles.find(t => t.side === 'he' && t.w.n === e.w.n); e.click(); hh.click(); return 'match'; }
    const mc = q('button.mcard:not(.open):not(.matched)');
    if (mc.length) { const a = mc[0], b = mc.find(x => x !== a && x.c.w.n === a.c.w.n); a.click(); b && b.click(); return 'mem'; }
    const intro = document.querySelector('.intro .navbtns .btn.primary'); if (intro) { intro.click(); return 'intro'; }
    const card = document.querySelector('.card.flash:not(.flipped)'); if (card) { card.click(); return 'flip'; }
    const knew = document.querySelector('.q .navbtns .btn.big.primary'); if (knew) { knew.click(); return 'knew'; }
    const typ = document.querySelector('input.typein'); if (typ) { const dk = document.querySelector('.q .navbtns .btn.ghost'); dk.click(); return 'type'; }
    const bank = q('.bank button:not([disabled])'); if (bank.length) { bank.forEach(b => b.click()); return 'bank'; }
    const heart = document.querySelector('.modal .btn.ghost'); if (heart) { heart.click(); return 'heart'; }
    return 'wait';
  });
}
async function playUntilResult(page, tag, ms = 120000) {
  const t0 = Date.now(); let steps = 0;
  while (Date.now() - t0 < ms) {
    const s = await solveStep(page).catch(() => 'wait');
    if (s === 'done') return true;
    steps++; await sleep(s === 'wait' ? 250 : 120);
  }
  throw new Error('timeout ' + tag);
}
async function onboard(page, grade) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.click(`button.gradebtn[aria-label="כיתה ${HE[grade]}"]`);
  if (grade >= 10) { await page.waitForSelector('button.track-card'); await page.locator('button.track-card', { hasText: `${LEVEL[grade]} יח״ל` }).click(); }
  await page.fill('input.name', 'בדיקה' + grade);
  await page.click('button.avpick');
  await page.waitForSelector('.mapv .hud', { timeout: 15000 });
}
async function runGrade(browser, vp, grade) {
  const ctx = await browser.newContext({ ...VPS[vp], locale: 'he-IL' });
  const page = await ctx.newPage(); const tag = `${vp}/g${grade}`;
  page.on('pageerror', e => errors.push(tag + ' PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(tag + ' console ' + m.text()); });
  await onboard(page, grade);
  const info = await page.evaluate(async () => { const d = await import('./js/data.js'); const s = await import('./js/store.js'); const g = await import('./js/games.js');
    return { theme: document.documentElement.className, track: s.S.profile.track, words: d.D.words.length, practice: g.practiceFor(0), read: d.D.read.length, talk: d.D.talk.length, toggle: !!document.querySelector('.ttoggle') }; });
  const games = [];
  await page.goto(BASE + '/#/stage/0'); await page.waitForSelector('.stagev');
  if (grade === 4 || grade === 7 || grade === 11) await page.screenshot({ path: `${SHOTS}/${vp}-g${grade}-stage.png` });
  for (const g of ['intro', ...info.practice, 'boss']) {
    await page.goto(BASE + `/#/play/0/${g}`); await page.waitForSelector('.game', { timeout: 10000 });
    if (g === info.practice[0] && [4, 7, 11].includes(grade)) { await sleep(400); await page.screenshot({ path: `${SHOTS}/${vp}-g${grade}-${g}.png` }); }
    await playUntilResult(page, tag + ' ' + g);
    games.push(g + ':' + (await page.locator('.rstars span.on').count()));
  }
  // study tab
  await page.goto(BASE + '/#/study'); await page.waitForSelector('.studyv .wrow');
  await page.fill('input.search', 'a'); await sleep(150);
  if ([4, 10].includes(grade)) await page.screenshot({ path: `${SHOTS}/${vp}-g${grade}-study.png` });
  const modes = await page.$$eval('.modes .mode b', bs => bs.map(b => b.textContent));
  const study = [];
  for (const m of ['cards', 'type', 'talk', 'reading', 'forms']) {
    if (m === 'talk' && !info.talk || m === 'reading' && !info.read) continue;
    if (m === 'forms' && !modes.includes('צורות')) continue;
    await page.goto(BASE + `/#/study/${m}`); await page.waitForSelector('.game', { timeout: 10000 });
    if (m === 'reading' && grade === 11) { await sleep(300); await page.screenshot({ path: `${SHOTS}/${vp}-g${grade}-reading.png` }); }
    await playUntilResult(page, tag + ' study ' + m); study.push(m);
  }
  // track toggle (grades with two lists)
  if (info.toggle || grade === 8) {
    await page.goto(BASE + '/#/map'); await page.waitForSelector('.ttoggle');
    await page.click('.ttoggle button:not(.on)'); await page.waitForSelector('.mapv .hud');
    info.track2 = await page.evaluate(async () => (await import('./js/store.js')).S.profile.track);
  }
  await page.goto(BASE + '/#/map'); await page.waitForSelector('.mapv'); await sleep(200);
  if ([4, 7, 11].includes(grade)) await page.screenshot({ path: `${SHOTS}/${vp}-g${grade}-map.png` });
  results.push({ tag, ...info, games, study });
  console.log(JSON.stringify(results.at(-1)));
  await ctx.close();
}
async function extras(browser, vp) {
  const ctx = await browser.newContext({ ...VPS[vp] }); const page = await ctx.newPage(); const tag = vp + '/extras';
  page.on('pageerror', e => errors.push(tag + ' PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(tag + ' console ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(tag + ' HTTP ' + r.status() + ' ' + r.url()); });
  // migration from englishQuest.v1 (seeded on a non-app URL of the same origin, as a v2 user would have it)
  await page.goto(BASE + '/manifest.webmanifest');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('englishQuest.v1', JSON.stringify({ v: 1, profile: { name: 'ותיק', avatar: '🦉', track: 'g9', created: 1 }, xp: 777, coins: 55, tracks: { g9: { stages: { 0: { cleared: true, stars: 3, plays: 2, games: { intro: 3, boss: 3 } } }, words: { 1015: { b: 2, due: 0, ok: 3, bad: 1, seen: 1 } }, ms: 1000 } } })); });
  await page.goto(BASE + '/#/map', { waitUntil: 'networkidle' }); await sleep(1500); await page.screenshot({ path: `${SHOTS}/${vp}-migrate.png` }); await page.waitForSelector('.mapv .hud');
  const mig = await page.evaluate(async () => { const s = await import('./js/store.js'); return { name: s.S.profile.name, grade: s.S.profile.grade, xp: s.S.xp, cleared: !!s.S.tracks.g9.stages[0].cleared, old: !!localStorage.getItem('englishQuest.v1'), idx: JSON.parse(localStorage.getItem('englishQuest.profiles')), theme: document.documentElement.className }; });
  // add sibling profile via profile screen
  await page.goto(BASE + '/#/me'); await page.waitForSelector('.mev');
  await page.locator('button', { hasText: '➕ חדש/ה' }).click();
  await page.click('button.gradebtn[aria-label="כיתה ה׳"]'); await page.fill('input.name', 'אחות'); await page.click('button.avpick'); await page.waitForSelector('.mapv .hud');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.mapv .hud');
  const cur = await page.evaluate(async () => (await import('./js/store.js')).S.profile.name);
  await page.goto(BASE + '/#/parent'); const a = await page.locator('.gatebox .big').textContent(); const [x, y] = a.match(/\d+/g).map(Number);
  await page.fill('.gatebox input', String(x * y)); await page.click('.gatebox .btn.primary'); await page.waitForSelector('.kpis');
  const parentProfiles = await page.locator('.parentv .row').first().locator('button').count();
  await page.screenshot({ path: `${SHOTS}/${vp}-parent.png` });
  // switch back to migrated profile and check progress survived
  await page.goto(BASE + '/#/me'); await page.locator('button', { hasText: 'ותיק' }).click(); await page.waitForSelector('.mapv .hud');
  const back = await page.evaluate(async () => { const s = await import('./js/store.js'); return { name: s.S.profile.name, xp: s.S.xp }; });
  // about + robo note
  await page.goto(BASE + '/#/me'); await page.click('details.about summary'); await sleep(200); await page.screenshot({ path: `${SHOTS}/${vp}-about.png`, fullPage: true });
  // offline
  await page.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle' }); await sleep(800);
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('.mapv .hud', { timeout: 15000 });
  let offline = { map: true };
  // switch to another grade's list while offline (all 7 data files precached)
  await page.goto(BASE + '/#/study'); await page.waitForSelector('.wrow'); offline.study = true;
  offline.data = await page.evaluate(async () => { const r = await Promise.all(['pre1', 'b1c1', 'b1c2', 'g7', 'g9', 'b3c1', 'b3c2'].map(t => fetch(`data/${t}.json`).then(r => r.ok).catch(() => false))); return r.every(Boolean); });
  await page.goto(BASE + '/#/play/0/match'); await page.waitForSelector('.game'); offline.game = true;
  await ctx.setOffline(false);
  const out = { tag, mig, cur, parentProfiles, back, offline };
  console.log(JSON.stringify(out)); results.push(out);
  await ctx.close();
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  for (const vp of ONLY ? [ONLY] : ['mobile', 'desktop']) {
    for (const g of GR) { try { await runGrade(browser, vp, g); } catch (e) { errors.push(`${vp}/g${g} FAIL ${e.message}`); console.log('FAIL', vp, g, e.message); } }
    if (!process.env.NOEXTRA) try { await extras(browser, vp); } catch (e) { errors.push(`${vp} extras FAIL ${e.message}`); console.log('FAIL extras', e.message); }
  }
  await browser.close();
  console.log('ERRORS', errors.length); errors.forEach(e => console.log(' -', e));
  fs.writeFileSync(`/workspace/english-quest/tools/test_v3_${ONLY || 'all'}.json`, JSON.stringify({ results, errors }, null, 1));
  process.exit(errors.length ? 1 : 0);
})();
