#!/usr/bin/env node
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.EQ_URL || 'http://127.0.0.1:8765';
const SHOTS = '/workspace/english-quest/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const errors = [];
const log = (...a) => console.log(...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
  log('shot', name);
}

async function onboard(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForSelector('button.track-card', { timeout: 10000 });
  await page.click('button.track-card'); // g7 – splash+track combined
  await page.waitForSelector('input.name');
  await page.fill('input.name', 'דודו');
  await page.waitForSelector('button.avpick');
  await page.click('button.avpick'); // fox finishes onboard
  await page.waitForSelector('.hud, .mapv, .stagev', { timeout: 15000 });
  await page.goto(BASE + '/#/map');
  await page.waitForSelector('.hud', { timeout: 10000 });
}

async function clickCorrect(page, wrong = false) {
  return page.evaluate((doWrong) => {
    const btns = [...document.querySelectorAll('.opts .opt:not([disabled])')];
    if (!btns.length) return false;
    const right = btns.find(b => b._ok);
    const pick = doWrong ? (btns.find(b => !b._ok) || btns[0]) : (right || btns[0]);
    pick.click();
    return true;
  }, wrong);
}

async function waitResult(page, ms = 90000) {
  await page.waitForSelector('.rbox', { timeout: ms });
}

async function back(page) {
  const b = page.locator('.rbtns button:has-text("לשלב"), .rbtns button:has-text("למפה")').first();
  if (await b.count()) await b.click();
  else await page.goto(BASE + '/#/map');
  await sleep(200);
}

async function playIntro(page) {
  await page.goto(BASE + '/#/play/0/intro');
  await page.waitForSelector('.intro');
  for (let i = 0; i < 20; i++) {
    if (await page.$('.rbox')) break;
    const next = page.locator('.navbtns button.primary, .intro button.primary');
    if (await next.count()) await next.click();
    await sleep(80);
  }
  await waitResult(page, 15000);
}

async function autoMatch(page) {
  await page.waitForSelector('.matchwrap');
  for (let g = 0; g < 100; g++) {
    if (await page.$('.rbox')) return;
    const ok = await page.evaluate(() => {
      const en = [...document.querySelectorAll('.encol .tile:not([disabled]):not(.done)')];
      const he = [...document.querySelectorAll('.hecol .tile:not([disabled]):not(.done)')];
      if (!en.length) return false;
      const a = en[0];
      const b = he.find(x => x.w && a.w && x.w.n === a.w.n);
      if (!b) return false;
      a.click(); b.click();
      return true;
    });
    await sleep(ok ? 320 : 150);
  }
}

async function autoChoices(page, max = 40) {
  for (let i = 0; i < max; i++) {
    if (await page.$('.rbox')) return;
    if (await page.$('.opts .opt:not([disabled])')) {
      await clickCorrect(page, false);
      await sleep(850);
    } else await sleep(150);
  }
}

async function autoScramble(page, { fail = false } = {}) {
  for (let r = 0; r < 14; r++) {
    if (await page.$('.rbox')) return;
    const has = await page.waitForSelector('.spell', { timeout: 8000 }).catch(() => null);
    if (!has) { if (await page.$('.rbox')) return; continue; }
    const n = await page.getAttribute('.spell', 'data-n');
    const target = await page.evaluate(async (n) => {
      const track = JSON.parse(localStorage.getItem('englishQuest.v1')).profile.track;
      const d = await fetch('data/' + track + '.json').then(r => r.json());
      const w = d.words.find(x => x.n === +n);
      if (!w) return null;
      const first = w.en.split('/')[0].trim();
      if (/^[a-z]{3,11}$/i.test(first)) return { kind: 'word', parts: [...first.toLowerCase()] };
      const parts = w.en.trim().split(/\s+/);
      if (parts.length >= 2 && parts.length <= 4) return { kind: 'phrase', parts };
      return null;
    }, n);
    if (!target) { await sleep(400); continue; }
    if (fail) {
      // wrong twice to trigger reveal
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.evaluate(() => {
          [...document.querySelectorAll('.bank button:not([disabled])')].reverse().forEach(b => b.click());
        });
        await sleep(attempt === 0 ? 700 : 2000);
      }
      continue;
    }
    for (const L of target.parts) {
      await page.evaluate((L) => {
        const b = [...document.querySelectorAll('.bank button:not([disabled])')].find(x => x.textContent === L);
        b?.click();
      }, L);
      await sleep(30);
    }
    await sleep(1050);
  }
}

async function autoMemory(page) {
  await page.waitForSelector('.mgrid');
  for (let g = 0; g < 50; g++) {
    if (await page.$('.rbox')) return;
    await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.mcard:not(.matched):not(.open)')];
      if (cards.length < 2) return;
      for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].c.w.n === cards[j].c.w.n) { cards[i].click(); cards[j].click(); return; }
      }
      cards[0].click();
    });
    await sleep(700);
  }
}

async function runViewport(tag, size) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.newContext({ viewport: size, locale: 'he-IL', isMobile: size.width < 800, hasTouch: size.width < 800 });
  const page = await context.newPage();
  page.on('pageerror', e => { errors.push(tag + ':' + e.message); log('PAGEERROR', e.message); });
  page.on('console', m => { if (m.type() === 'error') log('cerr', m.text()); });

  log('===', tag, 'onboard');
  await onboard(page);
  await shot(page, tag + '-01-map');

  log('intro');
  await playIntro(page);
  await shot(page, tag + '-02-result');
  await back(page);

  await page.goto(BASE + '/#/stage/0');
  await page.waitForSelector('.glist');
  await shot(page, tag + '-03-stage');

  log('match');
  await page.goto(BASE + '/#/play/0/match');
  await autoMatch(page);
  await waitResult(page);
  await back(page);

  log('listen');
  await page.goto(BASE + '/#/play/0/listen');
  await autoChoices(page, 30);
  await waitResult(page);
  await back(page);

  log('scramble');
  await page.goto(BASE + '/#/play/0/scramble');
  await autoScramble(page);
  await waitResult(page);
  await back(page);

  log('fill');
  await page.goto(BASE + '/#/play/0/fill');
  await autoChoices(page, 20);
  await waitResult(page);
  await back(page);

  log('memory');
  await page.goto(BASE + '/#/play/0/memory');
  await autoMemory(page);
  await waitResult(page);
  await back(page);

  log('blitz');
  await page.goto(BASE + '/#/play/0/blitz');
  await page.waitForSelector('.blitz', { timeout: 10000 });
  await autoChoices(page, 40);
  await waitResult(page, 90000);
  await shot(page, tag + '-08-blitz');
  await back(page);

  log('boss');
  await page.goto(BASE + '/#/play/0/boss');
  await sleep(400);
  if (await page.locator('button:has-text("לא צריך")').count()) await page.click('button:has-text("לא צריך")');
  await autoChoices(page, 50);
  await waitResult(page, 120000);
  await shot(page, tag + '-04-boss');
  await back(page);

  // big font via me
  await page.goto(BASE + '/#/me');
  await page.waitForSelector('.mev, .toggle');
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('englishQuest.v1'));
    s.settings.big = true; localStorage.setItem('englishQuest.v1', JSON.stringify(s));
  });
  await page.goto(BASE + '/#/map');
  await page.evaluate(() => document.documentElement.classList.add('big'));
  await page.waitForSelector('.hud');
  await shot(page, tag + '-05-big');

  await page.goto(BASE + '/#/shop');
  await page.waitForSelector('.screen');
  await shot(page, tag + '-06-shop');

  // parent
  await page.goto(BASE + '/#/parent');
  await page.waitForSelector('.gatebox, .kpis');
  if (await page.$('.gatebox')) {
    const txt = await page.textContent('.gatebox');
    const m = txt.match(/(\d+)\s*×\s*(\d+)/);
    if (m) {
      await page.fill('input.name', String(+m[1] * +m[2]));
      await page.click('button.primary');
    }
  }
  await page.waitForSelector('.kpis', { timeout: 8000 });
  await shot(page, tag + '-07-parent');

  // offline
  await page.goto(BASE + '/#/map');
  await page.waitForSelector('.hud');
  // wait for SW
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return;
    const r = await navigator.serviceWorker.getRegistration();
    if (r) await navigator.serviceWorker.ready;
    else { try { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; } catch {} }
  });
  await sleep(2000);
  await context.setOffline(true);
  await page.goto(BASE + '/#/map');
  await sleep(1000);
  const offlineOk = await page.evaluate(() => !!document.querySelector('.hud'));
  log('offline', offlineOk);
  if (!offlineOk) errors.push(tag + ':offline');
  await context.setOffline(false);

  // scramble fail path
  log('scramble-fail');
  await page.goto(BASE + '/#/play/0/scramble');
  await autoScramble(page, { fail: true });
  const okFail = await page.waitForSelector('.rbox', { timeout: 90000 }).catch(() => null);
  if (!okFail) errors.push(tag + ':scramble-fail-hung');
  else log('scramble-fail ok');

  // boss loss path: wrong answers
  log('boss-loss');
  // unlock stage 0 already cleared maybe; play boss with all wrong
  await page.goto(BASE + '/#/play/0/boss');
  await sleep(400);
  if (await page.locator('button:has-text("לא צריך")').count()) await page.click('button:has-text("לא צריך")');
  for (let i = 0; i < 20; i++) {
    if (await page.$('.rbox')) break;
    if (await page.$('.opts .opt:not([disabled])')) {
      await clickCorrect(page, true);
      await sleep(1400);
    } else await sleep(200);
  }
  await waitResult(page, 60000).catch(() => errors.push(tag + ':boss-loss-hung'));

  await browser.close();
}

(async () => {
  await runViewport('mobile', { width: 390, height: 844 });
  await runViewport('desktop', { width: 1280, height: 860 });
  log('ERRORS', errors.length ? errors : 'none');
  fs.writeFileSync('/tmp/eq-test-report.json', JSON.stringify({ errors }, null, 2));
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
