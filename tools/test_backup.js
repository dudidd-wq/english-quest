#!/usr/bin/env node
// v3.1 local persistence: export file → wipe → restore; backup code → wipe → restore; IndexedDB auto-recovery;
// partial wipe prompt; malicious/invalid imports; legacy (schema 1) import; auto-save file (stubbed picker);
// and a network audit: no request may carry data (only same-origin GETs of static files).
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const fs = require('fs'), os = require('os'), path = require('path');
const BASE = process.env.EQ_URL || 'http://127.0.0.1:8765';
const VPS = { mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1280, height: 860 } } };
const SHOTS = '/workspace/english-quest/shots/v3'; fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wipe = (page, idb = true) => page.evaluate(idb => new Promise(r => { localStorage.clear(); sessionStorage.clear(); if (!idb) return r(); const q = indexedDB.deleteDatabase('englishQuest'); q.onsuccess = q.onerror = q.onblocked = () => r(); }), idb);
const assert = (c, m) => { if (!c) throw new Error('ASSERT ' + m); };
async function run(vp, R0) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ ...VPS[vp], locale: 'he-IL', acceptDownloads: true });
  const errors = [], net = [], R = { vp };
  ctx.on('request', q => net.push({ m: q.method(), u: q.url(), body: q.postData() ? q.postData().length : 0 }));
  // stub the File System Access picker (headless has no dialog); the handle records writes
  await ctx.addInitScript(() => {
    window.__autoWrites = [];
    if (!matchMedia('(pointer: coarse)').matches) window.showSaveFilePicker = async () => ({ name: 'eq-auto.json', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      createWritable: async () => { let buf = ''; return { write: async t => { buf += t; }, close: async () => { window.__autoWrites.push(buf.length); localStorage.setItem('__autoLast', buf); } }; } });
  });
  const page = await ctx.newPage(); R0.page = page; R0.browser = browser;
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.location().url)) errors.push('console ' + m.text()); });
  page.on('dialog', d => d.accept());
  const toMap = () => page.waitForSelector('.mapv .hud', { timeout: 15000 });
  const parent = async () => { await page.goto(BASE + '/#/parent'); await page.waitForSelector('.gatebox, .kpis'); if (await page.$('.gatebox')) { const a = await page.locator('.gatebox .big').textContent(); const [x, y] = a.match(/\d+/g).map(Number); await page.fill('.gatebox input', String(x * y)); await page.click('.gatebox .btn.primary'); } await page.waitForSelector('.backup'); };
  const state = () => page.evaluate(async () => { const s = await import('./js/store.js'); return { names: s.profiles().map(p => p.name), cur: s.S.profile?.name, xp: s.S.xp, w: (() => { const p = s.profiles().find(x => x.name === 'נועה'); const st = p && JSON.parse(localStorage.getItem('englishQuest.p.' + p.id) || 'null'); return st?.tracks?.b1c1?.words?.[6005] || null; })() }; });

  // 1. two players with progress
  await page.goto(BASE + '/manifest.webmanifest'); await wipe(page);
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  assert(await page.waitForSelector('.restore-entry', { timeout: 15000 }).catch(() => null), 'restore entry on first screen');
  await page.click('button.gradebtn[aria-label="כיתה ה׳"]'); await page.fill('input.name', 'נועה'); await page.click('button.avpick'); await toMap();
  await page.evaluate(async () => { const s = await import('./js/store.js'); s.S.xp = 1234; s.S.coins = 77; s.T('b1c1').words[6005] = { b: 3, due: 99999, ok: 4, bad: 1, seen: 1 }; s.save(true); });
  await page.goto(BASE + '/#/me'); await page.locator('button', { hasText: '➕ חדש/ה' }).click();
  await page.click('button.gradebtn[aria-label="כיתה י״א"]'); await page.locator('button.track-card', { hasText: '5 יח״ל' }).click();
  await page.fill('input.name', 'איתי'); await page.click('button.avpick'); await toMap();
  await page.evaluate(async () => { const s = await import('./js/store.js'); s.S.xp = 50; s.save(true); });
  await sleep(1500);
  const before = await state(); R.before = before;
  // reminder appears once progress is 5 days old with no backup
  await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('englishQuest.meta') || '{}'); m.firstSeen = Date.now() - 5 * 864e5; localStorage.setItem('englishQuest.meta', JSON.stringify(m)); });
  await page.reload(); await page.goto(BASE + '/#/me'); await page.waitForSelector('.mev'); R.reminder = !!(await page.$('.mev .backupnote'));
  // 2. export file
  await parent(); await page.screenshot({ path: `${SHOTS}/${vp}-backup.png`, fullPage: true });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.export-file')]);
  const file = path.join(os.tmpdir(), `eq-backup-${vp}.json`); await dl.saveAs(file);
  const snap = JSON.parse(fs.readFileSync(file, 'utf8')); R.file = { schema: snap.schema, profiles: snap.profiles.length, name: dl.suggestedFilename() };
  assert(snap.schema === 2 && snap.profiles.length === 2, 'file has 2 profiles');
  await page.goto(BASE + '/#/me'); await page.waitForSelector('.mev'); R.reminderAfter = !!(await page.$('.mev .backupnote'));
  // 3. code
  await parent(); await page.click('.make-code'); await page.waitForSelector('.codeout-ta'); const code = await page.inputValue('.codeout-ta'); R.codeLen = code.length;
  // 4. auto-save file (desktop: stubbed picker)
  if (vp === 'desktop') { await page.click('.autofile-on'); await sleep(600); await page.evaluate(async () => { const s = await import('./js/store.js'); s.S.coins += 1; s.save(true); }); await sleep(7000);  R.autoWrites = await page.evaluate(() => window.__autoWrites.length); R.autoState = await page.locator('.autofile').textContent(); }
  // 5. wipe EVERYTHING → restore from file
  await page.goto(BASE + '/manifest.webmanifest'); await wipe(page); await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.click('.restore-entry'); await page.setInputFiles('input.restore-file', file); await page.waitForSelector('.sheetbox');
  await page.screenshot({ path: `${SHOTS}/${vp}-restore-preview.png` });
  await page.locator('.sheetbox .btn.primary').click(); await toMap(); R.fromFile = await state();
  // 6. wipe EVERYTHING → restore from code
  await page.goto(BASE + '/manifest.webmanifest'); await wipe(page); await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.click('.restore-entry'); await page.click('.codebox summary'); await page.fill('textarea.codein', code.slice(0, 20) + '\n  ' + code.slice(20)); await page.click('.restore-code-btn');
  await page.waitForSelector('.sheetbox'); await page.locator('.sheetbox .btn.primary').click(); await toMap(); R.fromCode = await state();
  // 7. localStorage only wiped (browser "clear site data" partial) → automatic recovery from IndexedDB
  await sleep(1500); await page.goto(BASE + '/manifest.webmanifest'); await wipe(page, false); await page.goto(BASE + '/#/map', { waitUntil: 'networkidle' }); await toMap(); R.autoRecovered = await state();
  // 8. partial wipe: index survives, a player's state vanished, no mirror → restore prompt
  await page.goto(BASE + '/manifest.webmanifest'); await page.evaluate(() => new Promise(r => { const q = indexedDB.deleteDatabase('englishQuest'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.evaluate(() => { const i = JSON.parse(localStorage.getItem('englishQuest.profiles')); localStorage.removeItem('englishQuest.p.' + i.cur); });
  await page.goto(BASE + '/#/map', { waitUntil: 'networkidle' }); await page.waitForSelector('.restore-file-btn'); R.partialPrompt = await page.locator('.splash .lead').textContent();
  // 9. hostile / invalid inputs
  const evil = { app: 'english-quest', schema: 2, cur: 'pX', profiles: [{ id: 'pX', state: { v: 1, __proto__: { polluted: 1 }, constructor: { prototype: { polluted: 1 } }, profile: { name: '<img src=x onerror=window.__pwned=1>אבי', avatar: '<script>window.__pwned=1</script>', grade: 99, track: 'evil' }, xp: 1e99, coins: -5, tracks: { b1c1: { words: { 6001: { b: 2 } } }, '__proto__': { x: 1 }, hack: { a: 1 } } } }] };
  const evilFile = path.join(os.tmpdir(), 'eq-evil.json'); fs.writeFileSync(evilFile, JSON.stringify(evil).replace('"v":1,', '"v":1,"__proto__":{"polluted":1},'));
  await page.click('.restore-file-btn'); await page.setInputFiles('input.restore-file', evilFile); await page.waitForSelector('.sheetbox');
  R.evilPreview = await page.locator('.preview').textContent(); await page.locator('.sheetbox .btn.ghost', { hasText: 'ביטול' }).click();
  const bad = path.join(os.tmpdir(), 'eq-bad.json'); fs.writeFileSync(bad, '{"hello": "world"}');
  await page.setInputFiles('input.restore-file', bad); await sleep(400); R.badToast = await page.locator('#toast').textContent();
  const fut = path.join(os.tmpdir(), 'eq-future.json'); fs.writeFileSync(fut, JSON.stringify({ ...snap, schema: 9 }));
  await page.setInputFiles('input.restore-file', fut); await sleep(400); R.futureToast = await page.locator('#toast').textContent();
  await page.click('.codebox summary'); await page.fill('textarea.codein', code.slice(0, -3) + 'zzz'); await page.click('.restore-code-btn'); await sleep(400); R.badCodeToast = await page.locator('#toast').textContent();
  // legacy schema 1 (single-player export from v2/v3.0)
  const legacy = path.join(os.tmpdir(), 'eq-legacy.json'); fs.writeFileSync(legacy, JSON.stringify({ v: 1, profile: { name: 'ותיק', avatar: '🦉', track: 'g9', created: 1 }, xp: 777, tracks: { g9: { stages: {}, words: { 1015: { b: 2, due: 0, ok: 3, bad: 1, seen: 1 } }, ms: 0 } } }));
  await page.setInputFiles('input.restore-file', legacy); await page.waitForSelector('.sheetbox'); await page.locator('.sheetbox .btn.primary').first().click(); await toMap(); R.legacy = await state();
  // apply the evil one (merge) and confirm it was neutralised
  await parent(); await page.setInputFiles('.backup input.restore-file', evilFile); await page.waitForSelector('.sheetbox'); await page.locator('.sheetbox .btn.ghost', { hasText: 'מיזוג' }).click(); await sleep(800);
  R.evil = await page.evaluate(async () => { const s = await import('./js/store.js'); const p = s.profiles().find(x => x.id === 'pX'); const st = JSON.parse(localStorage.getItem('englishQuest.p.pX')); return { pwned: !!window.__pwned, polluted: ({}).polluted, name: p?.name, avatar: p?.avatar, grade: st?.profile.grade, xp: st?.xp, coins: st?.coins, tracks: Object.keys(st?.tracks || {}), imgs: document.querySelectorAll('img').length }; });
  // undo restore
  await parent(); R.undo = !!(await page.$('text=↩️ ביטול השחזור האחרון'));
  // network audit
  const host = new URL(BASE).host;
  R.netBad = net.filter(n => n.m !== 'GET' || n.body || new URL(n.u).host !== host && !n.u.startsWith('data:') && !n.u.startsWith('blob:') || /[?&].{40,}/.test(n.u));
  R.requests = net.length; R.errors = errors;
  await browser.close();
  // checks
  const ok = x => x && x.names.join() === 'נועה,איתי' && x.w && x.w.b === 3;
  assert(ok(R.fromFile) && R.fromFile.cur === 'איתי', 'restore from file ' + JSON.stringify(R.fromFile));
  assert(ok(R.fromCode), 'restore from code ' + JSON.stringify(R.fromCode));
  assert(ok(R.autoRecovered), 'auto recovery ' + JSON.stringify(R.autoRecovered));
  assert(R.reminder && !R.reminderAfter, 'reminder');
  assert(/נמחקו/.test(R.partialPrompt), 'partial prompt');
  assert(/לא קובץ גיבוי/.test(R.badToast) && /גרסה חדשה/.test(R.futureToast) && /לא שלם/.test(R.badCodeToast), 'invalid input messages');
  assert(R.legacy.names.includes('ותיק'), 'legacy import');
  assert(!R.evil.pwned && R.evil.polluted === undefined && !/[<>]/.test(R.evil.name + R.evil.avatar) && R.evil.grade === 7 && R.evil.xp === 0 && R.evil.coins === 0 && R.evil.tracks.join() === 'b1c1' && R.evil.imgs === 0, 'sanitised ' + JSON.stringify(R.evil));
  if (vp === 'desktop') assert(R.autoWrites >= 2 && /פעילה/.test(R.autoState), 'auto file ' + R.autoWrites + R.autoState);
  assert(!R.netBad.length, 'network ' + JSON.stringify(R.netBad.slice(0, 3)));
  assert(!errors.length, 'errors ' + errors.join(' | '));
  return R;
}
const runSafe = async vp => { const R0 = {}; try { return await run(vp, R0); } catch (e) { try { await R0.page?.screenshot({ path: `${SHOTS}/${vp}-backup-fail.png` }); } catch {} throw e; } finally { await R0.browser?.close().catch(() => {}); } };
(async () => {
  const out = {};
  for (const vp of (process.env.VP ? [process.env.VP] : ['mobile', 'desktop'])) {
    try { out[vp] = await runSafe(vp); console.log(vp, 'PASS', JSON.stringify({ ...out[vp], requests: out[vp].requests })); }
    catch (e) { out[vp] = { fail: e.message }; console.log(vp, 'FAIL', e.message); process.exitCode = 1; }
  }
  fs.writeFileSync('/workspace/english-quest/tools/test_backup.json', JSON.stringify(out, null, 1));
})();
