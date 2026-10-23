// Mini-games. Each game gets a Session (scoring, combo, feedback) and resolves when finished.
import { h, put, en, shuffle, sample, sleep, clamp, toast, posHe } from './util.js';
import { S, answer, gainXp, gainCoins, comboMult, save } from './store.js';
import { playWord, sfx, stop as stopAudio } from './audio.js';
import { D, W, distractors, stageSentences, scrambleWord, phraseTiles } from './data.js';

export const GAMES = {
  intro:   { icon: '📖', name: 'הכירו את המילים', short: 'כרטיסיות', desc: 'שמעו, ראו וזכרו – 12 מילים חדשות' },
  match:   { icon: '⚡', name: 'התאמה מהירה', short: 'התאמה', desc: 'התאימו מילה לפירוש לפני שהזמן נגמר!' },
  listen:  { icon: '🎧', name: 'האזינו ובחרו', short: 'האזנה', desc: 'שמעו את המילה ובחרו את הפירוש' },
  scramble:{ icon: '🔤', name: 'בלגן אותיות', short: 'איות', desc: 'סדרו את האותיות ובנו את המילה' },
  fill:    { icon: '✍️', name: 'השלימו את המשפט', short: 'משפטים', desc: 'בחרו את המילה שחסרה במשפט' },
  memory:  { icon: '🃏', name: 'משחק זיכרון', short: 'זיכרון', desc: 'מצאו זוגות: מילה באנגלית + פירוש' },
  boss:    { icon: '⚔️', name: 'קרב בוס', short: 'בוס', desc: 'נצחו את הבוס כדי לעבור שלב!' },
  review:  { icon: '🔁', name: 'חזרה יומית', short: 'חזרה', desc: 'המילים שהגיע זמנן לחזור' },
};
export const PRACTICE = ['match', 'listen', 'scramble', 'fill', 'memory'];
const label = w => w.en + (w.m ? ` (${w.m})` : '');

/** One play of one game: owns the top bar, combo, XP, and the result summary. */
export class Session {
  constructor(root, game, { onQuit, sub = '' } = {}) {
    Object.assign(this, { game, ok: 0, bad: 0, xp: 0, coins: 0, combo: 0, maxCombo: 0, missed: new Set(), t0: Date.now(), dead: false, timers: new Set() });
    const g = GAMES[game];
    this.bar = h('div.gbar-fill');
    this.comboEl = h('div.combo', { 'aria-live': 'polite' });
    this.xpEl = h('div.gxp', '0 XP');
    this.body = h('div.gbody');
    put(root, h('div.game.g-' + game,
      h('div.gtop',
        h('button.icon-btn.quit', { 'aria-label': 'יציאה מהמשחק', onclick: () => onQuit?.() }, '✕'),
        h('div.gtitle', h('span', g.icon), ' ', g.name, sub && h('small', ' · ' + sub)),
        this.xpEl),
      h('div.gbar', this.bar), this.comboEl, this.body));
  }
  progress(f) { this.bar.style.width = clamp(f, 0, 1) * 100 + '%'; }
  later(fn, ms) { const t = setTimeout(() => { this.timers.delete(t); if (!this.dead) fn(); }, ms); this.timers.add(t); return t; }
  wait(ms) { return new Promise(r => this.later(r, ms)); }
  kill() { this.dead = true; this.timers.forEach(clearTimeout); this.timers.clear(); clearInterval(this.iv); stopAudio(); }
  /** record a correct answer (srs = false for games that test memory, not knowledge) */
  right(w, el, srs = true) {
    if (srs && w) answer(w.n, true);
    this.ok++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    S.stats.bestCombo = Math.max(S.stats.bestCombo, this.combo);
    const x = 10 * comboMult(this.combo); this.xp += x; this.coins += 1; gainXp(x); gainCoins(1);
    sfx('ok', this.combo); this.float('+' + x, el);
    if ([3, 6, 10].includes(this.combo)) { sfx('combo', this.combo); this.burst(`קומבו ×${comboMult(this.combo)}!`); }
    else if (this.combo >= 15 && this.combo % 5 === 0) { sfx('combo', this.combo); this.burst(`🔥 ${this.combo} ברצף!`); }
    this.showCombo();
  }
  wrong(w, el, srs = true) {
    if (srs && w) { answer(w.n, false); this.missed.add(w.n); }
    this.bad++; this.combo = 0; sfx('bad'); this.showCombo();
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    navigator.vibrate?.(60);
  }
  showCombo() {
    this.xpEl.textContent = this.xp + ' XP';
    const m = comboMult(this.combo);
    put(this.comboEl, this.combo >= 2 && h('span.chip' + (m > 1 ? '.hot.m' + m : ''), `🔥 ${this.combo}`, m > 1 && h('b', ` ×${m}`)));
  }
  float(text, el) {
    const r = (el || this.body).getBoundingClientRect();
    const f = h('div.floaty', text); f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 'px';
    document.body.append(f); setTimeout(() => f.remove(), 900);
  }
  burst(text) { const b = h('div.burst', text); this.body.append(b); setTimeout(() => b.remove(), 1000); }
  summary(extra = {}) {
    const total = this.ok + this.bad, acc = total ? this.ok / total : 1;
    return { game: this.game, ok: this.ok, bad: this.bad, acc, xp: this.xp, coins: this.coins, maxCombo: this.maxCombo, missed: [...this.missed], ms: Date.now() - this.t0, ...extra };
  }
}
const starsFor = acc => acc >= .9 ? 3 : acc >= .7 ? 2 : 1;
const wordHead = (w, big) => h('div.whead' + (big ? '.big' : ''), h('div.emoji', { 'aria-hidden': 'true' }, w.e || '✨'));

// ---------- generic multiple-choice question ----------
/** resolves true/false; opts = [{text, ok, lang}] */
function choice(sess, { prompt, opts, w, timer = 0, onTimeout, onRight, onWrong, wrongPause = 1300, cols }) {
  return new Promise(resolve => {
    let done = false, tbar;
    const grid = h('div.opts' + (cols ? '.c' + cols : ''));
    const finish = (ok, btn) => {
      if (done) return; done = true; clearInterval(sess.iv);
      grid.querySelectorAll('button').forEach(b => { b.disabled = true; if (b._ok) b.classList.add('right'); });
      if (ok) { btn?.classList.add('pop'); sess.right(w, btn); onRight?.(); sess.later(() => resolve(true), 650); }
      else { btn?.classList.add('wrongc'); sess.wrong(w, btn || grid); onWrong?.(); sess.later(() => resolve(false), wrongPause); }
    };
    for (const o of opts) {
      const b = h('button.opt', { onclick: () => finish(o.ok, b) }, o.lang === 'en' ? en(o.text) : o.text);
      b._ok = o.ok; grid.append(b);
    }
    const kids = [prompt, grid];
    if (timer) {
      tbar = h('div.tfill'); kids.unshift(h('div.tbar', tbar));
      const t0 = Date.now(); let lastTick = 0;
      sess.iv = setInterval(() => {
        const left = 1 - (Date.now() - t0) / timer; tbar.style.width = Math.max(0, left) * 100 + '%';
        tbar.classList.toggle('low', left < .35);
        const s = Math.ceil(left * timer / 1000); if (left < .35 && s !== lastTick) { lastTick = s; sfx('tick'); }
        if (left <= 0) { onTimeout?.(); toast('⏰ נגמר הזמן!', 1000); finish(false, null); }
      }, 100);
    }
    put(sess.body, h('div.q', kids));
  });
}
const heOpts = (w, prefer) => shuffle([{ text: w.he, ok: true }, ...distractors(w, 3, 'he', prefer).map(x => ({ text: x.he }))]);
const enOpts = (w, prefer) => shuffle([{ text: label(w), ok: true, lang: 'en' }, ...distractors(w, 3, 'en', prefer).map(x => ({ text: label(x), lang: 'en' }))]);
const audioBtn = (w, lang = 'en', big) => { const b = h('button.say' + (big ? '.big' : ''), { 'aria-label': lang === 'en' ? 'השמיעו באנגלית' : 'השמיעו בעברית', onclick: e => { e.stopPropagation(); playWord(w, lang, b); } }, big ? '🔊' : '🔊'); return b; };

// question builders used by listen / boss / review
function qListen(sess, w, pool, timer) {
  const asEn = Math.random() < .3;  // sometimes pick the written word instead of the meaning
  const prompt = h('div.prompt', h('div.qhint', asEn ? 'מה שמעתם? בחרו את המילה' : 'מה פירוש המילה ששמעתם?'), audioBtn(w, 'en', true));
  sess.later(() => playWord(w, 'en'), 120);
  return choice(sess, { prompt, w, timer, opts: asEn ? enOpts(w, pool) : heOpts(w, pool), onWrong: () => playWord(w, 'en'), wrongPause: 1600 });
}
function qEnHe(sess, w, pool, timer) {
  const prompt = h('div.prompt', h('div.qhint', 'מה הפירוש?'), wordHead(w), h('div.word', en(w.en), w.m && h('small', en(` (${w.m})`)), audioBtn(w)));
  return choice(sess, { prompt, w, timer, opts: heOpts(w, pool), onRight: () => playWord(w, 'en') });
}
function qHeEn(sess, w, pool, timer) {
  const prompt = h('div.prompt', h('div.qhint', 'איך אומרים באנגלית?'), wordHead(w), h('div.word.he', w.he));
  return choice(sess, { prompt, w, timer, opts: enOpts(w, pool), onRight: () => playWord(w, 'en') });
}
function qSentence(sess, s, timer) {
  const w = W(s.n); const [a, b] = s.s.split('___');
  const blank = h('span.blank', '?');
  const prompt = h('div.prompt', h('div.qhint', 'איזו מילה חסרה?'), h('p.sentence', { lang: 'en', dir: 'ltr' }, a, blank, b));
  const opts = shuffle([{ text: s.a, ok: true, lang: 'en' }, ...s.o.map(t => ({ text: t, lang: 'en' }))]);
  const reveal = ok => { blank.textContent = s.a; blank.classList.add(ok ? 'ok' : 'no'); prompt.append(h('div.gloss', w.e + ' ', en(w.en), ' = ', w.he)); playWord(w, 'en'); };
  return choice(sess, { prompt, w, timer, opts, cols: 2, onRight: () => reveal(true), onWrong: () => reveal(false), wrongPause: 2200 });
}

// ---------- 📖 intro cards ----------
export async function intro(sess, words) {
  let i = 0;
  await new Promise(resolve => {
    const show = () => {
      if (sess.dead) return;
      const w = words[i]; sess.progress((i + 1) / words.length);
      const card = h('div.card.flipin',
        h('div.emoji.huge', { 'aria-hidden': 'true' }, w.e || '✨'),
        h('div.word.big', en(w.en), audioBtn(w)),
        w.m && h('div.mhint', en(`(${w.m})`)),
        h('div.pos', posHe(w.pos)),
        h('div.he.big', w.he, audioBtn(w, 'he')),
        h('div.count', `${i + 1} / ${words.length}`));
      const nav = h('div.row.navbtns',
        h('button.btn.ghost', { disabled: i === 0, onclick: () => { i--; sfx('whoosh'); show(); } }, '→ הקודם'),
        h('button.btn.primary', { onclick: () => { if (++i >= words.length) resolve(); else { sfx('whoosh'); show(); } } }, i === words.length - 1 ? 'יאללה לשחק! 🎮' : 'הבא ←'));
      put(sess.body, h('div.intro', card, nav));
      swipe(card, dir => { if (dir === 'next') nav.lastChild.click(); else if (i > 0) nav.firstChild.click(); });
      sess.later(async () => { await playWord(w, 'en'); if (!sess.dead && words[i] === w) { await sleep(250); if (words[i] === w && !sess.dead) playWord(w, 'he'); } }, 150);
    };
    show();
  });
  stopAudio();
  for (const w of words) { const r = (S.tracks[S.profile.track].words[w.n] ||= { b: 0, due: 0, ok: 0, bad: 0, seen: 0 }); r.seen ||= Date.now(); }
  sess.xp += 20; gainXp(20); save();
  return sess.summary({ stars: 3, acc: 1 });
}
function swipe(el, cb) {
  let x0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) cb(dx > 0 ? 'next' : 'prev'); });  // RTL: swipe right = next
}

// ---------- ⚡ speed match ----------
export async function match(sess, words) {
  const rounds = []; const ws = shuffle(words);
  for (let i = 0; i < ws.length; i += 4) rounds.push(ws.slice(i, i + 4));
  if (rounds.length > 1 && rounds.at(-1).length < 3) rounds.at(-2).push(...rounds.pop());
  let timeLeft = 60, matched = 0; const total = ws.length;
  const clock = h('div.clock', '60');
  let over = false;
  await new Promise(resolve => {
    const tick = () => {
      timeLeft = Math.max(0, timeLeft - .1); clock.textContent = Math.ceil(timeLeft); clock.classList.toggle('low', timeLeft < 10);
      if (timeLeft < 10 && Math.abs(timeLeft - Math.round(timeLeft)) < .05) sfx('tick');
      if (timeLeft <= 0) { over = true; clearInterval(sess.iv); resolve(); }
    };
    sess.iv = setInterval(tick, 100);
    const play = r => {
      if (sess.dead) return;
      if (r >= rounds.length) { clearInterval(sess.iv); return resolve(); }
      const set = rounds[r]; let sel = null, left = set.length;
      const L = h('div.col.encol'), R = h('div.col.hecol');
      const pick = b => {
        if (b.disabled || over) return; sfx('tap');
        if (!sel || sel.side === b.side) { sel?.classList.remove('sel'); sel = b; b.classList.add('sel'); return; }
        const a = sel; sel = null; a.classList.remove('sel');
        const eb = a.side === 'en' ? a : b, hb = a.side === 'he' ? a : b;
        if (eb.w.n === hb.w.n) {
          eb.disabled = hb.disabled = true; eb.classList.add('done'); hb.classList.add('done');
          sess.right(eb.w, hb); timeLeft += 2; matched++; sess.progress(matched / total); playWord(eb.w, 'en');
          if (--left === 0) sess.later(() => play(r + 1), 350);
        } else { sess.wrong(eb.w, eb); hb.classList.add('shake'); setTimeout(() => hb.classList.remove('shake'), 400); timeLeft = Math.max(0, timeLeft - 3); }
      };
      for (const w of shuffle(set)) { const b = h('button.tile', { onclick: () => pick(b) }, en(label(w))); b.w = w; b.side = 'en'; L.append(b); }
      for (const w of shuffle(set)) { const b = h('button.tile.he', { onclick: () => pick(b) }, w.he); b.w = w; b.side = 'he'; R.append(b); }
      put(sess.body, h('div.matchwrap', h('div.mhead', h('span.qhint', 'לחצו על מילה ועל הפירוש שלה'), clock), h('div.cols', R, L), h('div.count', `סיבוב ${r + 1} / ${rounds.length}`)));
    };
    play(0);
  });
  const bonus = matched === total ? Math.round(timeLeft) * 2 : 0;
  if (bonus) { sess.xp += bonus; gainXp(bonus); }
  const acc = (matched / total) * (sess.ok / Math.max(1, sess.ok + sess.bad));
  return sess.summary({ acc, stars: matched < total ? 1 : starsFor(acc), timeLeft: Math.round(timeLeft), bonus, note: matched < total ? `⏰ הזמן נגמר – התאמתם ${matched} מתוך ${total}` : `⏱️ נשארו ${Math.round(timeLeft)} שניות · בונוס +${bonus} XP`, speedy: matched === total && timeLeft >= 20 });
}

// ---------- 🎧 listen & pick ----------
export async function listen(sess, words, n = 10) {
  const q = shuffle(words).slice(0, n); let first = 0, asked = 0; const retried = new Set();
  for (let k = 0; k < q.length; k++) {
    if (sess.dead) return;
    sess.progress(k / q.length);
    const ok = await qListen(sess, q[k], words);
    if (k < n) { asked++; if (ok) first++; }
    if (!ok && !retried.has(q[k].n)) { retried.add(q[k].n); q.push(q[k]); }
  }
  sess.progress(1);
  const acc = first / asked;
  return sess.summary({ acc, stars: starsFor(acc), ears: first === n });
}

// ---------- 🔤 letter scramble ----------
export async function scramble(sess, words) {
  const items = shuffle(words).map(w => ({ w, word: scrambleWord(w), tiles: phraseTiles(w) })).filter(x => x.word || x.tiles).slice(0, 6);
  let firstTry = 0;
  for (let k = 0; k < items.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / items.length);
    const ok = await spellOne(sess, items[k]);
    if (ok) firstTry++;
  }
  sess.progress(1);
  const acc = items.length ? firstTry / items.length : 1;
  return sess.summary({ acc, stars: starsFor(acc) });
}
function spellOne(sess, { w, word, tiles }) {
  const pieces = word ? [...word] : tiles.map(t => t);
  const target = pieces.join(word ? '' : ' ');
  let order = shuffle(pieces.map((p, i) => i));
  for (let t = 0; t < 5 && order.every((x, i) => x === i); t++) order = shuffle(order);
  return new Promise(resolve => {
    let tries = 0; const filled = []; // indexes into pieces
    const slots = h('div.slots' + (word ? '' : '.words'), { dir: 'ltr', style: { '--n': pieces.length } });
    const bank = h('div.bank', { dir: 'ltr' });
    const hintBtn = h('button.btn.small.hint', { onclick: () => hint() }, `💡 רמז (${S.powers.hint})`);
    const render = () => {
      put(slots, pieces.map((_, i) => h('button.slot' + (filled[i] != null ? '.full' : ''), { onclick: () => { if (filled[i] != null && !lock) { filled.splice(i, 1); sfx('tap'); render(); } } }, filled[i] != null ? pieces[filled[i]] : '')));
      put(bank, order.map(i => h('button.ltr' + (word ? '' : '.wtile'), { disabled: filled.includes(i), onclick: () => { if (lock) return; filled.push(i); sfx('tap'); render(); if (filled.length === pieces.length) check(); } }, pieces[i])));
      hintBtn.textContent = `💡 רמז (${S.powers.hint})`;
    };
    let lock = false;
    const check = () => {
      const got = filled.map(i => pieces[i]).join(word ? '' : ' ');
      if (got === target) {
        lock = true; slots.classList.add('solved');
        if (tries === 0) sess.right(w, slots); else { sess.combo = 0; sess.showCombo(); sfx('ok'); }
        playWord(w, 'en'); sess.later(() => resolve(tries === 0), 900);
      } else {
        tries++;
        if (tries === 1) { sess.wrong(w, slots); toast('כמעט! נסו שוב 💪', 1100); sess.later(() => { filled.length = 0; render(); }, 450); }
        else { lock = true; sess.wrong(null, slots); filled.length = 0; pieces.forEach((_, i) => filled.push(i)); render(); slots.classList.add('revealed'); playWord(w, 'en'); sess.later(() => resolve(false), 1800); }
      }
    };
    const hint = () => {
      if (lock) return;
      if (S.powers.hint <= 0) return toast('אין רמזים 😅 אפשר לקנות בחנות 🛒');
      // keep the correct prefix, then add the next correct piece
      let k = 0; while (k < filled.length && pieces[filled[k]] === pieces[k]) k++;
      filled.length = k;
      const idx = order.find(i => !filled.includes(i) && pieces[i] === pieces[k]);
      if (idx == null) return;
      S.powers.hint--; save(); filled.push(idx); sfx('coin'); render(); tries = Math.max(tries, 1);
      if (filled.length === pieces.length) check();
    };
    render();
    put(sess.body, h('div.spell', { 'data-n': w.n },
      h('div.qhint', word ? 'סדרו את האותיות למילה באנגלית' : 'סדרו את המילים לביטוי באנגלית'),
      wordHead(w, true), h('div.he.big', w.he, w.m && h('small', en(` (${w.m})`))),
      slots, bank,
      h('div.row', hintBtn, h('button.btn.small.ghost', { onclick: () => { if (!lock) { filled.pop(); sfx('tap'); render(); } } }, '⌫ מחיקה'), audioBtn(w))));
  });
}

// ---------- ✍️ fill in the blank ----------
export async function fill(sess, stageIdx, list) {
  const items = list || stageSentences(stageIdx, 6); let first = 0;
  if (!items.length) return sess.summary({ acc: 1, stars: 3, note: 'אין משפטים לשלב הזה עדיין' });
  for (let k = 0; k < items.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / items.length);
    if (await qSentence(sess, items[k])) first++;
  }
  sess.progress(1);
  const acc = first / items.length;
  return sess.summary({ acc, stars: starsFor(acc) });
}

// ---------- 🃏 memory ----------
export async function memory(sess, words) {
  const ws = sample(words.filter(w => w.he.length <= 22 && w.en.length <= 18), 6);
  const cards = shuffle(ws.flatMap(w => [{ w, side: 'en' }, { w, side: 'he' }]));
  let open = [], moves = 0, pairs = 0, busy = false;
  const movesEl = h('span', '0');
  await new Promise(resolve => {
    const grid = h('div.mgrid');
    for (const c of cards) {
      const face = c.side === 'en' ? h('div.face', h('span.memo-emoji', c.w.e || ''), en(c.w.en)) : h('div.face.he', c.w.he);
      const b = h('button.mcard', { 'aria-label': 'קלף', onclick: () => flip(b) }, h('div.inner', h('div.back', '❓'), face));
      b.c = c; grid.append(b);
    }
    const flip = b => {
      if (busy || b.classList.contains('open') || sess.dead) return;
      b.classList.add('open'); sfx('flip'); open.push(b);
      if (b.c.side === 'en') playWord(b.c.w, 'en');
      if (open.length < 2) return;
      moves++; movesEl.textContent = moves;
      const [a, c] = open; open = [];
      if (a.c.w.n === c.c.w.n) {
        a.classList.add('matched'); c.classList.add('matched'); sess.right(a.c.w, c, false); pairs++; sess.progress(pairs / ws.length);
        if (pairs === ws.length) sess.later(resolve, 700);
      } else { busy = true; sess.combo = 0; sess.showCombo(); sess.later(() => { a.classList.remove('open'); c.classList.remove('open'); busy = false; }, 850); }
    };
    put(sess.body, h('div.memory', h('div.mhead', h('span.qhint', 'מצאו את הזוגות'), h('span.moves', 'תורות: ', movesEl)), grid));
  });
  const acc = clamp(1 - (moves - ws.length) / (ws.length * 2), 0, 1);
  return sess.summary({ acc, ok: ws.length, bad: 0, stars: moves <= 9 ? 3 : moves <= 13 ? 2 : 1, note: `🃏 ${moves} תורות (הכי טוב אפשרי: 6)`, memory: moves <= 10 });
}

// ---------- ⚔️ boss battle / 🔁 review (mixed question types) ----------
export async function boss(sess, words, { world, hearts = 3, stageIdx, review = false }) {
  const hp0 = review ? words.length : Math.min(10, words.length); let hp = hp0, lives = hearts; const maxLives = hearts;
  const queue = shuffle(words).slice(0, hp0); const pool = words;
  const sents = new Map();
  for (const w of words) { const l = D.sent[w.n] || []; if (l.length) sents.set(w.n, { ...l[Math.floor(Math.random() * l.length)], n: w.n }); }
  const hpFill = h('div.hpfill'); const heartsEl = h('div.hearts'); const bossEl = h('div.boss-emoji', { 'aria-hidden': 'true' }, review ? '🦉' : world.boss);
  const drawHearts = () => put(heartsEl, Array.from({ length: maxLives }, (_, i) => h('span' + (i < lives ? '' : '.lost'), i < lives ? '❤️' : '🖤')));
  const arena = h('div.arena', h('div.bossbox', bossEl, h('div.bossname', review ? 'ינשוף החזרה' : world.bossName), h('div.hp', hpFill)), !review && heartsEl);
  const area = h('div.qarea');
  put(sess.body, h('div.battle', arena, area)); drawHearts();
  // questions render into `area` instead of the whole body
  const realBody = sess.body; sess.body = area;
  const types = ['enhe', 'listen', 'fill', 'heen'];
  let k = 0, lostAny = false;
  while (hp > 0 && (review || lives > 0) && queue.length) {
    if (sess.dead) return sess.summary({ won: false, stars: 0 });
    const w = queue.shift(); const t = types[k++ % types.length];
    const timer = review ? 0 : 12000;
    let ok;
    if (t === 'fill' && sents.has(w.n)) ok = await qSentence(sess, sents.get(w.n), timer);
    else if (t === 'listen' || (t === 'fill' && k % 2)) ok = await qListen(sess, w, pool, timer);
    else if (t === 'heen') ok = await qHeEn(sess, w, pool, timer);
    else ok = await qEnHe(sess, w, pool, timer);
    if (sess.dead) return sess.summary({ won: false, stars: 0 });
    if (ok) { hp--; sfx('hit'); bossEl.classList.remove('hit'); void bossEl.offsetWidth; bossEl.classList.add('hit'); }
    else { if (!review) { lives--; lostAny = true; drawHearts(); sfx('hurt'); realBody.classList.remove('hurt'); void realBody.offsetWidth; realBody.classList.add('hurt'); } queue.push(w); }
    hpFill.style.width = (hp / hp0) * 100 + '%'; sess.progress(1 - hp / hp0);
    if (!queue.length && hp > 0) queue.push(...shuffle(words).slice(0, hp));
  }
  sess.body = realBody;
  const won = hp <= 0;
  if (won) { bossEl.classList.add('defeated'); await sess.wait(700); }
  const stars = !won ? 0 : !lostAny ? 3 : lives >= 2 ? 2 : 1;
  return sess.summary({ won, stars, perfect: won && !lostAny, acc: sess.ok / Math.max(1, sess.ok + sess.bad) });
}
