// Mini-games. Each game gets a Session (scoring, combo, feedback) and resolves when finished.
import { h, put, en, shuffle, sample, sleep, clamp, toast, posHe } from './util.js';
import { S, answer, gainXp, gainCoins, comboMult, save } from './store.js';
import { playWord, sfx, stop as stopAudio } from './audio.js';
import { D, W, distractors, stageSentences, scrambleWord, phraseTiles, themeOf } from './data.js';

export const GAMES = {
  intro:   { icon: '📖', name: 'הכירו את המילים', short: 'כרטיסיות', desc: 'שמעו, ראו וזכרו – מילים חדשות ב־30 שניות' },
  match:   { icon: '⚡', name: 'התאמה מהירה', short: 'התאמה', desc: 'התאימו מילה לפירוש לפני שהזמן נגמר!' },
  listen:  { icon: '🎧', name: 'האזינו ובחרו', short: 'האזנה', desc: 'שמעו את המילה ובחרו את הפירוש' },
  scramble:{ icon: '🔤', name: 'בלגן אותיות', short: 'איות', desc: 'סדרו את האותיות ובנו את המילה' },
  fill:    { icon: '✍️', name: 'השלימו את המשפט', short: 'משפטים', desc: 'בחרו את המילה שחסרה במשפט' },
  memory:  { icon: '🃏', name: 'משחק זיכרון', short: 'זיכרון', desc: 'מצאו זוגות: מילה באנגלית + פירוש' },
  blitz:   { icon: '💥', name: 'בליץ', short: 'בליץ', desc: 'רפלקסים! 4 אפשרויות, שעון דופק, אל תפספסו' },
  boss:    { icon: '⚔️', name: 'קרב בוס', short: 'בוס', desc: 'נצחו את הבוס כדי לעבור שלב!' },
  review:  { icon: '🔁', name: 'חזרה יומית', short: 'חזרה', desc: 'המילים שהגיע זמנן לחזור' },
  forms:   { icon: '🧩', name: 'משפחות מילים', short: 'צורות', desc: 'בחרו את הצורה הנכונה מאותה משפחה – שם עצם, פועל, תואר' },
  reading: { icon: '📰', name: 'קטע קריאה', short: 'קריאה', desc: 'קטע קצר + שאלות הבנה בסגנון בגרות' },
  talk:    { icon: '💬', name: 'משפטים ושיחות', short: 'שיחה', desc: 'השלימו דיאלוג ובנו משפטים' },
  cards:   { icon: '📇', name: 'כרטיסיות', short: 'כרטיסיות', desc: 'הפכו כרטיס, דרגו את עצמכם – החזרה המרווחת מתעדכנת' },
  type:    { icon: '⌨️', name: 'בוחן הקלדה', short: 'הקלדה', desc: 'רואים בעברית, מקלידים באנגלית (סלחני לטעות קטנה)' },
};
export const theme = () => themeOf(S.profile?.grade || 7);
/** timers stretch for younger kids (still brisk) */
export const pace = () => theme() === 'kids' ? 1.5 : 1;
const hasSent = () => D && Object.keys(D.sent || {}).length > 0;
/** practice games offered in a stage, per age band */
export function practiceFor(i) {
  const t = theme(), fill = hasSent() && stageSentences(i, 1).length ? ['fill'] : [];
  if (t === 'kids') return ['match', 'listen', 'memory', 'scramble', ...fill];
  if (t === 'bagrut') return [...fill, ...(formsPool(i).length >= 4 ? ['forms'] : []), 'match', 'listen', 'blitz', 'scramble'];
  return ['match', 'listen', 'scramble', ...fill, 'memory', 'blitz'];
}
export const missionPool = i => theme() === 'kids' ? ['match', 'listen', 'memory'] : theme() === 'bagrut' ? practiceFor(i).filter(g => ['fill', 'forms', 'blitz', 'match'].includes(g)) : ['match', 'blitz', 'listen', 'scramble'];
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
    sfx(this.combo >= 3 ? 'combo' : 'ok', this.combo); this.float('+' + x, el);
    if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    if ([3, 6, 10, 15, 20].includes(this.combo) || (this.combo >= 25 && this.combo % 5 === 0)) {
      this.burst(this.combo >= 15 ? `🔥 ${this.combo} ברצף!` : `קומבו ×${comboMult(this.combo)}!`);
      this.juice(true);
    }
    this.showCombo();
  }
  wrong(w, el, srs = true) {
    if (srs && w) { answer(w.n, false); this.missed.add(w.n); }
    this.bad++; this.combo = 0; sfx('bad'); this.showCombo();
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    this.juice(false);
    navigator.vibrate?.(60);
  }
  juice(good) {
    if (S.settings && S.settings.juice === false) return;
    const root = document.getElementById('app');
    if (!root) return;
    root.classList.remove('screen-shake'); void root.offsetWidth;
    if (!good) root.classList.add('screen-shake');
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
        h('button.btn.ghost.small', { onclick: () => { sfx('whoosh'); resolve(); } }, 'דלגו ▶'),
        h('button.btn.primary', { onclick: () => { if (++i >= words.length) resolve(); else { sfx('whoosh'); show(); } } }, i === words.length - 1 ? 'יאללה! 🎮' : 'הבא ←'));
      put(sess.body, h('div.intro', card, nav));
      swipe(card, dir => { if (dir === 'next') nav.lastChild.click(); else if (i > 0) nav.firstChild.click(); });
      sess.later(async () => { await playWord(w, 'en'); if (!sess.dead && words[i] === w) { await sleep(120); if (words[i] === w && !sess.dead) playWord(w, 'he'); } }, 80);
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
  let timeLeft = Math.round(60 * pace()), matched = 0; const total = ws.length;
  const clock = h('div.clock', String(timeLeft));
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
  if (!review) { sfx('boss'); sess.burst('⚔️ הבוס תוקף!'); }
  // questions render into `area` instead of the whole body
  const realBody = sess.body; sess.body = area;
  const types = theme() === 'kids' ? ['enhe', 'listen', 'enhe', 'fill'] : ['enhe', 'listen', 'fill', 'heen'];
  let k = 0, lostAny = false;
  while (hp > 0 && (review || lives > 0) && queue.length) {
    if (sess.dead) return sess.summary({ won: false, stars: 0 });
    const w = queue.shift(); const t = types[k++ % types.length];
    const timer = review ? 0 : Math.max(7000, 10000 - k * 200) * pace();
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

// ---------- 💥 Blitz – high-energy timed reflexes ----------
export async function blitz(sess, words, { target = 14 } = {}) {
  const pool = shuffle(words);
  let lives = 3, score = 0, i = 0, streakOk = 0;
  const ghost = S.rival?.bestBlitz || 35;
  const livesEl = h('span.lives', '❤️❤️❤️');
  const scoreEl = h('span.score', '0');
  const ghostEl = h('span.ghost', `👻 ${ghost}`);
  const timerFill = h('div');
  const wordEl = h('div.blitz-word');
  const wrap = h('div.blitz',
    h('div.blitz-hud', livesEl, scoreEl, ghostEl),
    h('div.blitz-timer', timerFill),
    wordEl);
  put(sess.body, wrap);
  sfx('blitz');

  const drawLives = () => { livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); };
  drawLives();

  while (lives > 0 && i < target && !sess.dead) {
    const w = pool[i % pool.length]; i++;
    sess.progress(i / target);
    const limit = Math.max(1400, 2800 - i * 80) * pace();
    const asHe = Math.random() < 0.55;
    put(wordEl, asHe
      ? h('div', h('div.qhint', 'איך אומרים באנגלית?'), h('div.he.big', w.he))
      : h('div', h('div.qhint', 'מה הפירוש?'), h('div.word', en(label(w)), audioBtn(w))));
    if (!asHe) sess.later(() => playWord(w, 'en'), 40);
    else sfx('blitz');

    const ok = await new Promise(resolve => {
      let done = false;
      const opts = asHe ? enOpts(w, words) : heOpts(w, words);
      const grid = h('div.opts');
      const finish = (good, btn) => {
        if (done) return; done = true; clearInterval(sess.iv);
        grid.querySelectorAll('button').forEach(b => { b.disabled = true; if (b._ok) b.classList.add('right'); });
        if (good) { btn?.classList.add('pop'); sess.right(w, btn); score += 5 + Math.min(10, sess.combo); scoreEl.textContent = score; streakOk++; resolve(true); }
        else { btn?.classList.add('wrongc'); sess.wrong(w, btn || grid); resolve(false); }
      };
      for (const o of opts) {
        const b = h('button.opt', { onclick: () => finish(!!o.ok, b) }, o.lang === 'en' ? en(o.text) : o.text);
        b._ok = o.ok; grid.append(b);
      }
      const old = wrap.querySelector('.opts'); if (old) old.remove();
      wrap.append(grid);
      const t0 = Date.now();
      sess.iv = setInterval(() => {
        const left = 1 - (Date.now() - t0) / limit;
        timerFill.style.transform = `scaleX(${Math.max(0, left)})`;
        if (left < 0.3) sfx('tick');
        if (left <= 0) { toast('⏰', 600); finish(false, null); }
      }, 50);
    });

    if (!ok) { lives--; drawLives(); sfx('hurt'); if (lives <= 0) break; }
    await sess.wait(ok ? 280 : 550);
  }

  sess.progress(1);
  const acc = sess.ok / Math.max(1, sess.ok + sess.bad);
  return sess.summary({
    acc, stars: score >= 60 ? 3 : score >= 35 ? 2 : score >= 15 ? 1 : 0,
    score, note: `💥 ניקוד בליץ: ${score}` + (score > ghost ? ' · ניצחתם את הצל! 👻' : ` · צל: ${ghost}`),
    blitzScore: score, beatGhost: score > ghost,
  });
}

// ---------- 🧩 word families (Band III "selected family members" column) ----------
const POS_FULL = { n: 'שם עצם (noun)', v: 'פועל (verb)', adj: 'שם תואר (adjective)', adv: 'תואר הפועל (adverb)', prep: 'מילת יחס (preposition)', conj: 'מילת חיבור (conjunction)' };
/** official family members split into single-word {w, form, pos} items */
export function familyItems(words) {
  const out = [];
  for (const w of words) {
    if (!w.f || !w.fp) continue;
    const fs = w.f.split(/\s+/), ps = w.fp.split(/\s+/);
    if (fs.length !== ps.length) continue;
    fs.forEach((form, k) => { if (/^[a-z-]+$/i.test(form) && form.toLowerCase() !== w.en.toLowerCase() && POS_FULL[ps[k]]) out.push({ w, form, pos: ps[k] }); });
  }
  return out;
}
let famAll = null, famTrack = null;
function allFamilies() { if (famTrack !== D.track) { famAll = familyItems(D.words); famTrack = D.track; } return famAll; }
export function formsPool(i) {
  const all = allFamilies(); if (!all.length) return [];
  const near = new Set(D.stages.slice(Math.max(0, i - 3), i + 2).flat());
  const here = new Set(D.stages[i] || []);
  const a = all.filter(x => here.has(x.w.n)), b = all.filter(x => near.has(x.w.n) && !here.has(x.w.n));
  let pool = [...shuffle(a), ...shuffle(b)];
  if (pool.length < 6) pool = [...pool, ...shuffle(all.filter(x => !near.has(x.w.n)))];
  return pool.slice(0, 6);
}
const suffix = s => s.slice(-3);
function qForm(sess, it, timer) {
  const all = allFamilies(); const same = all.filter(x => x.pos === it.pos && x.form !== it.form && x.w.n !== it.w.n);
  const close = shuffle(same.filter(x => suffix(x.form) === suffix(it.form)));
  const picks = [...new Set([...close, ...shuffle(same)].map(x => x.form))].slice(0, 3);
  const prompt = h('div.prompt', h('div.qhint', 'איזו מילה שייכת למשפחה של'), h('div.word', en(it.w.en), audioBtn(it.w)), h('div.he', it.w.he),
    h('div.qhint', 'בתור ', h('b', POS_FULL[it.pos]), '?'));
  const opts = shuffle([{ text: it.form, ok: true, lang: 'en' }, ...picks.map(t => ({ text: t, lang: 'en' }))]);
  return choice(sess, { prompt, w: it.w, timer, opts, cols: 2, wrongPause: 1800, onRight: () => playWord(it.w, 'en') });
}
export async function forms(sess, items) {
  if (!items.length) return sess.summary({ acc: 1, stars: 3, note: 'אין משפחות מילים ברשימה הזו' });
  let first = 0;
  for (let k = 0; k < items.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / items.length);
    if (await qForm(sess, items[k], 0)) first++;
  }
  sess.progress(1); const acc = first / items.length;
  return sess.summary({ acc, stars: starsFor(acc), note: 'המשפחות לקוחות מעמודת "selected family members" ברשימה הרשמית' });
}

// ---------- 📰 reading snippet (written for the app – not an official exam text) ----------
export async function reading(sess, r) {
  let first = 0; const text = h('div.passage', { lang: 'en', dir: 'ltr' }, h('h3', r.title), h('p', r.text));
  for (let k = 0; k < r.q.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / r.q.length);
    const q = r.q[k];
    const prompt = h('div.prompt', text, h('div.qhint', `שאלה ${k + 1} מתוך ${r.q.length}`), h('p.rq', { lang: 'en', dir: 'ltr' }, q.q));
    if (await choice(sess, { prompt, w: null, opts: shuffle([{ text: q.a, ok: true, lang: 'en' }, ...q.o.map(t => ({ text: t, lang: 'en' }))]), wrongPause: 2200 })) first++;
  }
  sess.progress(1); const acc = first / r.q.length;
  return sess.summary({ acc, stars: starsFor(acc), note: 'קטע הקריאה נכתב במיוחד לאפליקציה (אינו קטע בחינה רשמי)' });
}

// ---------- 💬 conversation sentences (from band2-study) ----------
export async function talk(sess, items) {
  let first = 0;
  for (let k = 0; k < items.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / items.length);
    const it = items[k], w = W(it.t?.[0]);
    let ok;
    if (it.type === 'build') ok = await buildOne(sess, it, w);
    else {
      const body = it.type === 'dialog'
        ? h('div.dialog', { lang: 'en', dir: 'ltr' }, it.lines.map((l, j) => h('div.bubble2' + (j % 2 ? '.b' : '.a'), h('span.who', j % 2 ? '🤖' : '🦊'), l.en)))
        : h('p.sentence', { lang: 'en', dir: 'ltr' }, it.s);
      const prompt = h('div.prompt', h('div.qhint', it.type === 'dialog' ? 'השלימו את השיחה' : 'איזו מילה חסרה?'), body);
      ok = await choice(sess, { prompt, w, cols: 2, wrongPause: 2200, opts: shuffle(it.opts.map(t => ({ text: t, ok: it.ans.includes(t), lang: 'en' }))),
        onRight: () => prompt.append(h('div.gloss', it.he)), onWrong: () => prompt.append(h('div.gloss', it.he)) });
    }
    if (ok) first++;
  }
  sess.progress(1); const acc = items.length ? first / items.length : 1;
  return sess.summary({ acc, stars: starsFor(acc), note: 'המשפטים מאפליקציית התרגול Band II (נכתבו לתרגול, לא רשימה רשמית)' });
}
function buildOne(sess, it, w) {
  const norm = x => x.toLowerCase().replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim();
  return new Promise(resolve => {
    const pieces = it.tiles; let order = shuffle(pieces.map((_, i) => i)); const got = []; let tries = 0, lock = false;
    const line = h('div.slots.words', { dir: 'ltr' }), bank = h('div.bank', { dir: 'ltr' });
    const render = () => {
      put(line, got.map((i, k) => h('button.slot.full', { onclick: () => { if (!lock) { got.splice(k, 1); render(); } } }, pieces[i])));
      put(bank, order.map(i => h('button.ltr.wtile', { disabled: got.includes(i), onclick: () => { if (lock) return; got.push(i); sfx('tap'); render(); if (got.length === pieces.length) check(); } }, pieces[i])));
    };
    const check = () => {
      const s = norm(got.map(i => pieces[i]).join(' '));
      if (it.ans.map(norm).includes(s)) { lock = true; line.classList.add('solved'); tries ? (sfx('ok'), sess.ok++) : sess.right(w, line); sess.later(() => resolve(tries === 0), 900); }
      else if (++tries < 2) { sess.wrong(w, line); toast('כמעט! נסו שוב 💪', 1100); sess.later(() => { got.length = 0; render(); }, 450); }
      else { lock = true; sess.wrong(null, line); put(line, h('div.reveal', { lang: 'en' }, it.s)); sess.later(() => resolve(false), 2000); }
    };
    render();
    put(sess.body, h('div.spell', h('div.qhint', 'סדרו את המילים למשפט'), h('div.he.big', it.he), line, bank));
  });
}

// ---------- 📇 flashcards (self-graded SRS) ----------
export async function cards(sess, words) {
  let knew = 0;
  for (let k = 0; k < words.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / words.length);
    const w = words[k], heFirst = k % 2 === 1;
    const ok = await new Promise(resolve => {
      const back = h('div.cback', h('div.he.big', w.he, audioBtn(w, 'he')), h('div.word', en(w.en), audioBtn(w)), w.m && h('div.mhint', en(`(${w.m})`)), h('div.pos', posHe(w.pos)));
      const front = heFirst ? h('div.he.big', w.he) : h('div.word.big', en(w.en), audioBtn(w));
      const btns = h('div.row.navbtns', h('button.btn.big.ghost', { onclick: () => { sess.wrong(w, card); resolve(false); } }, '😕 עוד לא'), h('button.btn.big.primary', { onclick: () => { sess.right(w, card); resolve(true); } }, '😎 ידעתי'));
      const card = h('button.card.flash', { 'aria-label': 'הפכו את הכרטיס', onclick: () => { if (card.classList.contains('flipped')) return; card.classList.add('flipped'); card.append(back); sess.body.querySelector('.q').append(btns); if (heFirst) playWord(w, 'en'); } },
        h('div.emoji.huge', { 'aria-hidden': 'true' }, w.e || '✨'), front, h('div.qhint', 'חשבו על התשובה ולחצו להפוך'));
      put(sess.body, h('div.q', card, h('div.count', `${k + 1} / ${words.length}`)));
      if (!heFirst) sess.later(() => playWord(w, 'en'), 100);
    });
    if (ok) knew++;
    await sess.wait(250);
  }
  sess.progress(1); const acc = words.length ? knew / words.length : 1;
  return sess.summary({ acc, stars: starsFor(acc) });
}

// ---------- ⌨️ forgiving typing quiz ----------
export function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const clean = s => s.toLowerCase().replace(/[’`]/g, "'").replace(/\([^)]*\)/g, '').replace(/\bsth\b|\bsb\b|\bsomething\b|\bsomeone\b/g, '').replace(/[^a-z' -]/g, ' ').replace(/^to /, '').replace(/\s+/g, ' ').trim();
/** 'ok' exact (ignoring case/“to ”/sth), 'near' one small typo, false otherwise */
export function checkTyped(input, w) {
  const a = clean(input); if (!a) return false;
  const targets = w.en.split(/\s*(?:\/|\bor\b)\s*/).map(clean).filter(Boolean);
  if (targets.includes(a)) return 'ok';
  if (targets.some(t => t.length >= 4 && lev(a, t) <= 1)) return 'near';
  return false;
}
export async function typing(sess, words) {
  let first = 0;
  for (let k = 0; k < words.length; k++) {
    if (sess.dead) return sess.summary({ stars: 0 });
    sess.progress(k / words.length);
    const w = words[k];
    const ok = await new Promise(resolve => {
      const inp = h('input.name.typein', { dir: 'ltr', lang: 'en', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'הקלידו באנגלית' });
      const fb = h('div.fb', { 'aria-live': 'polite' });
      let tries = 0, done = false;
      const submit = () => {
        if (done) return; const r = checkTyped(inp.value, w);
        if (r) { done = true; sess.right(w, inp); put(fb, r === 'near' ? h('span', '✅ כמעט מושלם – הכתיב: ', en(w.en)) : h('span', '✅ ', en(w.en))); playWord(w, 'en'); sess.later(() => resolve(tries === 0), r === 'near' ? 1600 : 800); }
        else if (++tries < 2) { sess.wrong(null, inp); put(fb, `לא בדיוק. רמז: מתחיל ב־`, en(w.en.slice(0, 2) + '…')); inp.select(); }
        else { done = true; sess.wrong(w, inp); put(fb, h('span', 'התשובה: ', en(w.en))); playWord(w, 'en'); sess.later(() => resolve(false), 1900); }
      };
      inp.addEventListener('keydown', e => e.key === 'Enter' && submit());
      put(sess.body, h('div.q', h('div.prompt', h('div.qhint', 'איך כותבים באנגלית?'), wordHead(w), h('div.he.big', w.he), w.m && h('div.mhint', en(`(${w.m})`))),
        inp, h('div.row.navbtns', h('button.btn.ghost', { onclick: () => { inp.value = ''; tries = 1; submit(); } }, 'לא יודע/ת'), h('button.btn.primary', { onclick: submit }, 'בדיקה ✓')), fb));
      setTimeout(() => inp.focus(), 30);
    });
    if (ok) first++;
  }
  sess.progress(1); const acc = words.length ? first / words.length : 1;
  return sess.summary({ acc, stars: starsFor(acc) });
}
