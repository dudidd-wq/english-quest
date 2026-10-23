// English Quest – screens & navigation
import { $, h, put, en, shuffle, dayNum, fmtDay, toast, download, nWords, reduced, posHe } from './util.js';
import { S, save, on, T, stageRec, today, dueWords, level, levelXp, gainCoins, touchStreak, streakNow, checkAch, ACH, isMastered, replaceState, resetAll, exportState, unlock, ensureDaily, bumpDaily, beatRival, AURAS, TITLES } from './store.js';
import { TRACKS, WORLDS, PER_WORLD, D, W, loadTrack, stageWords, world, worldOf } from './data.js';
import { GAMES, PRACTICE, MISSION_POOL, Session, intro, match, listen, scramble, fill, memory, blitz, boss } from './games.js';
import { playWord, sfx, prefetch, stop as stopAudio } from './audio.js';

const app = $('#app');
const FREE_AV = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐧', '🦉', '🐨', '🤖', '👾', '⭐', '🔷'];
const SHOP_AV = [['🦖', 60], ['🐳', 60], ['🦩', 60], ['🐝', 60], ['🦈', 80], ['🐢', 80], ['🦋', 80], ['🐲', 120], ['🚀', 120], ['🛸', 150], ['🌈', 150], ['💎', 250]];
const POWERS = [['hint', '💡', 'רמז', 'חושף אות במשחק האיות', 20], ['heart', '❤️', 'לב נוסף', 'לב רביעי בקרב בוס', 30], ['freeze', '🧊', 'הקפאת רצף', 'שומר על הרצף אם פספסתם יום אחד', 50]];
let session = null;

// ---------- celebrations ----------
function applyBig() { document.documentElement.classList.toggle('big', !!S.settings.big); }
applyBig();
function confetti(n = 70) {
  if (reduced()) return;
  const box = h('div.confetti'); const cols = ['#ff4d6d', '#ffd60a', '#4cc9f0', '#80ed99', '#b388ff', '#ff9f1c'];
  for (let i = 0; i < n; i++) box.append(h('i', { style: { left: Math.random() * 100 + '%', background: cols[i % cols.length], animationDelay: Math.random() * .5 + 's', animationDuration: 1.4 + Math.random() * 1.2 + 's', transform: `rotate(${Math.random() * 360}deg)` } }));
  document.body.append(box); setTimeout(() => box.remove(), 3000);
}
const banners = [];
function banner(icon, title, sub) {
  banners.push([icon, title, sub]); if (banners.length === 1) showBanner();
}
function showBanner() {
  const [icon, title, sub] = banners[0];
  const b = h('div.banner', { role: 'status' }, h('div.bicon', icon), h('div', h('b', title), sub && h('div', sub)));
  document.body.append(b); setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); banners.shift(); if (banners.length) showBanner(); }, 300); }, 2300);
}
on((type, d) => {
  if (type === 'level') { sfx('level'); confetti(40); banner('⬆️', `עליתם לרמה ${d}!`, 'כל הכבוד, ממשיכים ככה'); }
  if (type === 'goal') { sfx('win'); banner('🎯', 'הגעתם ליעד היומי!', '+25 מטבעות 🪙'); }
  if (type === 'ach') { sfx('coin'); banner(d[1], `הישג חדש: ${d[2]}`, d[3] + ' · +15 🪙'); }
  if (type === 'freeze') banner('🧊', 'הקפאת הרצף הצילה את הרצף שלכם!');
  if (type === 'daily') { sfx('streak'); confetti(50); banner('☀️', 'אתגר היום הושלם!', '+40 מטבעות 🪙'); }
  if (type === 'rival') { sfx('win'); banner('👻', 'ניצחתם את הצל!', d.field === 'bestBlitz' ? `בליץ: ${d.value}` : `קומבו: ${d.value}`); }
  if (type === 'streak' && d >= 3) { sfx('streak'); banner('🔥', `רצף של ${d} ימים!`, 'תמשיכו כך'); }
});

// ---------- shared bits ----------
const isUnlocked = i => i === 0 || stageRec(i - 1).cleared;
const currentStage = () => { let i = 0; while (i < D.stages.length - 1 && stageRec(i).cleared) i++; return i; };
const practiceDone = i => PRACTICE.filter(g => stageRec(i).games[g]).length;
const starsTxt = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function hud() {
  const L = level(), a = levelXp(L), b = levelXp(L + 1), d = today(), goal = S.settings.goal, gp = Math.min(1, d.xp / goal);
  const aura = S.cosmetics?.aura || 'none';
  const title = S.cosmetics?.title || '';
  return h('header.hud',
    h('button.avatar-btn' + (aura !== 'none' ? '.aura-' + aura : ''), { 'aria-label': 'הפרופיל שלי', onclick: () => go('#/me') }, h('span.av', S.profile.avatar), h('span.lvl', L)),
    h('div.xpbox', h('div.xpline', h('b', S.profile.name + (title ? ' · ' + title : '')), h('span', `רמה ${L}`)), h('div.xpbar', h('div', { style: { width: ((S.xp - a) / (b - a)) * 100 + '%' } })), h('small', `${S.xp - a} / ${b - a} XP`)),
    h('div.stat', { title: 'רצף ימים' }, h('span', streakNow() ? '🔥' : '🩶'), h('b', streakNow())),
    h('div.stat', { title: 'מטבעות' }, h('span', '🪙'), h('b', S.coins)),
    h('div.goal', { title: 'יעד יומי', style: { '--p': gp * 360 + 'deg' } }, h('span', gp >= 1 ? '✅' : '🎯')));
}
function nav(active) {
  const it = (hash, icon, txt) => h('a.navi' + (active === hash ? '.on' : ''), { href: hash }, h('span', icon), txt);
  return h('nav.bottom', it('#/map', '🗺️', 'מפה'), it('#/ach', '🏆', 'הישגים'), it('#/shop', '🛒', 'חנות'), it('#/me', '👤', 'פרופיל'));
}
function screen(cls, ...kids) { stopAudio(); put(app, h('div.screen.' + cls, ...kids)); app.scrollTop = 0; window.scrollTo(0, 0); }
export function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

// ---------- onboarding ----------
function onboarding(step = 0, draft = {}) {
  const next = s => onboarding(s, draft);
  // Splash + track in one energetic screen (<30s total)
  if (step === 0) return screen('onb', h('div.splash',
    h('div.logo-emoji.bob', '🚀'), h('h1', 'English Quest'), h('p.lead', 'משחק מילים באנגלית · כיתות ז׳–ט׳'),
    h('p.muted.small', '2–4 דקות · בוסים · בליץ · רצפים'),
    h('h3', 'בחרו מסלול'),
    Object.entries(TRACKS).map(([k, t]) => h('button.track-card', { onclick: () => { draft.track = k; sfx('tap'); next(1); } },
      h('div.temoji', t.emoji), h('div', h('b', t.name), h('div.en.small', { dir: 'ltr' }, t.band))))));
  if (step === 1) {
    const inp = h('input.name', { maxlength: 14, placeholder: 'נינג׳ה_המילים', value: draft.name || '', 'aria-label': 'כינוי' });
    const finish = async (av) => {
      const v = (inp.value || draft.name || '').replace(/[<>]/g, '').trim() || 'שחקן';
      sfx('win'); confetti(40);
      S.profile = { name: v.slice(0, 14), avatar: av, track: draft.track, created: Date.now() }; save(true);
      await loadTrack(draft.track); go('#/map');
    };
    screen('onb', h('h2', 'כינוי + דמות'), h('p.muted', 'פחות מ־10 שניות ויוצאים למשחק'),
      inp, h('div.avgrid', FREE_AV.map(a => h('button.avpick', { 'aria-label': 'דמות ' + a, onclick: () => finish(a) }, a))));
    return setTimeout(() => inp.focus(), 40);
  }
}

// ---------- world map ----------
function mapView() {
  const cur = currentStage(); const due = dueWords(); const daily = ensureDaily();
  const path = h('div.map');
  for (let wi = 0; wi < D.worlds; wi++) {
    const W0 = WORLDS[wi % WORLDS.length], from = wi * PER_WORLD, to = Math.min(D.stages.length, from + PER_WORLD);
    const cleared = Array.from({ length: to - from }, (_, k) => stageRec(from + k).cleared).filter(Boolean).length;
    const locked = !isUnlocked(from);
    const sec = h('section.world' + (locked ? '.locked' : ''), { style: { '--c1': W0.bg[0], '--c2': W0.bg[1] } },
      h('div.wbanner', h('span.wicon', W0.icon), h('div', h('small', `אי ${wi + 1}`), h('b', W0.name)), h('span.wprog', `${cleared}/${to - from}`)),
      W0.story && h('p.wstory', W0.story));
    for (let i = from; i < to; i++) {
      const r = stageRec(i), un = isUnlocked(i), k = i - from;
      const off = Math.sin(k * 1.1) * 32;
      const node = h('button.node' + (r.cleared ? '.done' : un ? '.open' : '.lock') + (i === cur ? '.cur' : ''), {
        style: { '--tx': off + '%', transform: `translateX(${off}%)` }, 'aria-label': `שלב ${i + 1}` + (un ? '' : ' (נעול)'),
        onclick: () => un ? (sfx('tap'), go('#/stage/' + i)) : (sfx('bad'), toast('🔒 נצחו את הבוס של השלב הקודם')) },
        h('span.num', un ? i + 1 : '🔒'), r.cleared && h('span.nstars', starsTxt(r.stars)),
        i === cur && h('span.me', S.profile.avatar), i === cur && h('span.bubble', r.plays ? 'ממשיכים!' : 'התחילו כאן!'));
      sec.append(node);
    }
    sec.append(h('div.gate', h('span.gboss', W0.boss), h('small', `בוס האי: ${W0.bossName}`)));
    path.append(sec);
  }
  const dailyGo = () => {
    if (daily.done) return toast('✅ אתגר היום כבר הושלם – חזרו מחר!');
    sfx('tap');
    if (daily.kind === 'blitz_ok' || daily.kind === 'perfect') go('#/play/' + cur + '/blitz');
    else if (daily.kind === 'boss') go('#/play/' + cur + '/boss');
    else go('#/stage/' + cur);
  };
  screen('mapv', hud(),
    h('div.rival-chip', '👻 יריב מקומי: ', S.rival.name, ' · בליץ ', S.rival.bestBlitz, ' · קומבו ', S.rival.bestCombo),
    h('div.daily-card' + (daily.done ? '.done' : ''), { onclick: dailyGo },
      h('div.dico', daily.done ? '✅' : '☀️'),
      h('div', { style: { flex: 1 } }, h('b', 'אתגר היום'), h('div.muted.small', daily.label || ''),
        h('div.dbar', h('div', { style: { width: (daily.progress / daily.target * 100) + '%' } })))),
    h('div.mapbar',
      h('button.btn.primary.cta', { onclick: () => { sfx('whoosh'); go('#/stage/' + cur); } }, `▶ משימה · שלב ${cur + 1}`),
      h('button.btn.review' + (due.length ? '.has' : ''), { onclick: () => due.length ? go('#/review') : toast('אין מילים לחזרה – שחקו! 🎮') }, '🔁', due.length ? h('b.badge', due.length) : null)),
    path, nav('#/map'));
  const c = $('.node.cur'); if (c) setTimeout(() => c.scrollIntoView({ block: 'center', behavior: 'instant' }), 0);
}

// ---------- stage screen ----------
function nextGame(i) {
  const r = stageRec(i);
  if (!r.games.intro) return 'intro';
  const g = PRACTICE.find(g => !r.games[g]);
  if (practiceDone(i) >= 2 && !r.cleared) return 'boss';
  return g || 'boss';
}
function pickMission(i) {
  const r = stageRec(i);
  if (!r.games.intro) return 'intro';
  if (practiceDone(i) >= 2 && !r.cleared) return 'boss';
  const undone = MISSION_POOL.filter(g => !r.games[g]);
  const pool = undone.length ? undone : MISSION_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}
function stageView(i) {
  if (!isUnlocked(i)) return go('#/map');
  const r = stageRec(i), wd = world(i), ws = stageWords(i), done = practiceDone(i), rec = nextGame(i);
  prefetch(ws);
  const mission = pickMission(i);
  const card = g => {
    const best = r.games[g] || 0, isBoss = g === 'boss', locked = isBoss && done < 2;
    return h('button.gcard' + (g === rec ? '.rec' : '') + (locked ? '.lock' : '') + (isBoss ? '.bosscard' : ''), {
      onclick: () => locked ? (sfx('bad'), toast(`שחקו עוד ${2 - done === 1 ? 'משחק אחד' : '2 משחקים'} כדי לפתוח את הבוס`)) : (sfx('tap'), go(`#/play/${i}/${g}`)) },
      h('span.gicon', isBoss ? wd.boss : GAMES[g].icon),
      h('div.gtxt', h('b', isBoss ? `קרב בוס: ${wd.bossName}` : GAMES[g].name), h('small', locked ? `🔒 שחקו ${2 - done} משחקים נוספים` : GAMES[g].desc)),
      h('span.gstars', best ? starsTxt(best) : g === rec ? '▶' : ''));
  };
  screen('stagev', h('div.shead', { style: { '--c1': wd.bg[0], '--c2': wd.bg[1] } },
    h('button.icon-btn', { 'aria-label': 'חזרה למפה', onclick: () => go('#/map') }, '→'),
    h('div', h('small', `${wd.icon} ${wd.name}`), h('h2', `שלב ${i + 1}`)), h('div.sstars', r.cleared ? starsTxt(r.stars) : '')),
    h('div.mission-hero',
      h('div.mico', GAMES[mission].icon),
      h('b', mission === 'boss' ? `הבוס מחכה: ${wd.bossName}` : 'המשימה שלי'),
      h('p', mission === 'intro' ? 'הכירו את המילים ואז יוצאים לקרב' : mission === 'boss' ? '2–3 דקות של אקשן. מוכנים?' : `${GAMES[mission].name} · כ־2 דקות`),
      h('button.btn.primary.xl', { onclick: () => { sfx('whoosh'); go(`#/play/${i}/${mission}`); } },
        mission === 'boss' ? `⚔️ לקרב!` : mission === 'intro' ? '🚀 בואו נכיר' : `▶ ${GAMES[mission].short}`)),
    h('div.glist', h('div.sep', 'או בחרו מצב'), card('intro'), PRACTICE.map(card), h('div.sep', '⚔️ הבוס'), card('boss')),
    h('details.wordlist', h('summary', `📝 המילים של השלב (${ws.length})`),
      h('div.chips', ws.map(w => { const b = h('button.chip.wchip', { onclick: () => playWord(w, 'en', b) }, h('span', w.e), en(w.en), h('small', w.he)); return b; }))));
}

// ---------- playing ----------
async function play(i, g) {
  if (g !== 'review' && !isUnlocked(i)) return go('#/map');
  session?.kill();
  const ws = g === 'review' ? null : stageWords(i);
  const sub = g === 'review' ? '' : `שלב ${i + 1}`;
  const sess = session = new Session(app, g, { sub, onQuit: () => quit() });
  const quit = () => { if (sess.ok + sess.bad > 0 && !confirm('לצאת מהמשחק? ההתקדמות במשחק הזה לא תישמר')) return; sess.kill(); go(g === 'review' ? '#/map' : '#/stage/' + i); };
  sess.quit = quit;
  let res;
  if (g === 'intro') res = await intro(sess, ws);
  else if (g === 'match') res = await match(sess, ws);
  else if (g === 'listen') res = await listen(sess, ws);
  else if (g === 'scramble') res = await scramble(sess, ws);
  else if (g === 'fill') res = await fill(sess, i);
  else if (g === 'memory') res = await memory(sess, ws);
  else if (g === 'blitz') res = await blitz(sess, ws);
  else if (g === 'boss') {
    const extra = S.powers.heart > 0 ? await askHeart() : false;
    if (sess.dead) return;
    if (extra) { S.powers.heart--; save(); }
    res = await boss(sess, ws, { world: world(i), hearts: extra ? 4 : 3, stageIdx: i });
  } else if (g === 'review') {
    const due = dueWords().slice(0, 12).map(W).filter(Boolean);
    if (due.length < 1) return go('#/map');
    res = await boss(sess, due, { review: true });
  }
  if (!res || sess.dead) return;
  sess.kill(); session = null;
  finishGame(i, g, res);
}
function askHeart() {
  return new Promise(res => {
    const m = h('div.modal', h('div.mbox', h('div.huge', '❤️'), h('h3', 'להשתמש בלב נוסף?'), h('p', `יש לכם ${S.powers.heart}. עם לב נוסף יהיו לכם 4 חיים בקרב.`),
      h('div.row', h('button.btn.primary', { onclick: () => { m.remove(); res(true); } }, 'כן! ❤️'), h('button.btn.ghost', { onclick: () => { m.remove(); res(false); } }, 'לא צריך'))));
    document.body.append(m);
  });
}
function finishGame(i, g, res) {
  const d = today(); d.games++; d.ms += res.ms; T().ms += res.ms; S.stats.games++;
  touchStreak();
  let cleared = false, worldDone = false, coinsBonus = 0;
  if (g === 'review') { S.stats.reviews++; coinsBonus = 10; }
  else {
    const r = stageRec(i); r.plays++;
    if (g === 'boss') {
      if (res.won) {
        S.stats.bossWins++; if (res.perfect) S.stats.perfectBoss++;
        cleared = !r.cleared; r.cleared = true; r.stars = Math.max(r.stars, res.stars); r.games.boss = Math.max(r.games.boss || 0, res.stars);
        coinsBonus = 10 + 5 * res.stars;
        bumpDaily('boss');
        const wi = worldOf(i), last = Math.min(D.stages.length, (wi + 1) * PER_WORLD) - 1;
        if (cleared && i === last) { worldDone = true; coinsBonus += 50; if (wi === 0) unlock('world1'); }
      }
    } else {
      r.games[g] = Math.max(r.games[g] || 0, res.stars); coinsBonus = res.stars;
      if (g !== 'intro') { S.stats.missions++; bumpDaily('mission'); }
    }
  }
  if (res.maxCombo >= 8) bumpDaily('combo', res.maxCombo);
  if (res.maxCombo >= S.rival.bestCombo) beatRival('bestCombo', res.maxCombo);
  if (g === 'blitz' && res.blitzScore != null) {
    S.stats.blitzBest = Math.max(S.stats.blitzBest || 0, res.blitzScore);
    bumpDaily('blitz_ok', res.ok);
    if (res.blitzScore > S.rival.bestBlitz) beatRival('bestBlitz', res.blitzScore);
  }
  if (res.maxCombo >= 10) bumpDaily('perfect', res.maxCombo);
  gainCoins(coinsBonus); save(true);
  checkAch({ speedy: res.speedy, memory: res.memory, ears: res.ears });
  const won = g !== 'boss' || res.won;
  if (won) { sfx('win'); if (res.stars === 3 || cleared || res.beatGhost) confetti(cleared ? 110 : 60); } else sfx('lose');
  const wd = g === 'review' ? null : world(i);
  const title = g === 'boss' ? (res.won ? (worldDone ? `🏆 כבשתם את ${wd.name}!` : `ניצחתם את ${wd.bossName}!`) : 'אוי! הבוס ניצח הפעם') :
    g === 'review' ? 'חזרה הושלמה! 🦉' : g === 'blitz' ? (res.beatGhost ? 'ניצחתם את הצל! 👻' : `בליץ: ${res.blitzScore || 0}`) :
    res.stars === 3 ? 'מושלם! 🤩' : res.stars === 2 ? 'כל הכבוד! 😎' : 'יפה! עוד סיבוב? 💪';
  const nxt = g === 'review' ? null : cleared && i + 1 < D.stages.length ? ['#/stage/' + (i + 1), `לשלב ${i + 2} ▶`] : (() => {
    if (g === 'intro') return ['#/play/' + i + '/' + pickMission(i), '▶ המשימה הראשונה'];
    const n = nextGame(i);
    if (n === 'boss' && practiceDone(i) >= 2 && !stageRec(i).cleared) return ['#/play/' + i + '/boss', `⚔️ לבוס!`];
    if (n !== g && n !== 'boss') return ['#/play/' + i + '/' + n, `${GAMES[n].icon} עוד סיבוב · ${GAMES[n].short}`];
    return ['#/play/' + i + '/' + (g === 'blitz' ? 'blitz' : pickMission(i)), '🔥 עוד סיבוב'];
  })();
  const missed = (res.missed || []).map(W).filter(Boolean);
  screen('result', h('div.rbox',
    h('div.rbig' + (won ? '.bob' : ''), g === 'boss' ? (res.won ? '🏆' : wd.boss) : g === 'review' ? '🦉' : GAMES[g].icon),
    h('h2', title),
    res.stars > 0 && h('div.rstars', [0, 1, 2].map(k => h('span' + (k < res.stars ? '.on' : ''), { style: { animationDelay: k * .18 + 's' } }, '★'))),
    !won && h('p', 'לא נורא – כל טעות מלמדת. נסו שוב מיד!'),
    h('div.rstats',
      h('div', h('b', '+' + res.xp), h('small', 'XP')),
      h('div', h('b', '+' + (res.coins + coinsBonus)), h('small', '🪙 מטבעות')),
      res.ok + res.bad > 0 && g !== 'intro' && h('div', h('b', Math.round(res.acc * 100) + '%'), h('small', 'דיוק')),
      res.maxCombo >= 2 && h('div', h('b', '🔥' + res.maxCombo), h('small', 'קומבו'))),
    res.note && h('p.note', res.note),
    cleared && i + 1 < D.stages.length && h('p.unlock', `🔓 שלב ${i + 2} נפתח!`),
    missed.length > 0 && h('div.missed', h('h4', 'מילים לחזרה:'), missed.map(w => { const b = h('button.chip.wchip', { onclick: () => playWord(w, 'en', b) }, h('span', w.e), en(w.en), h('small', w.he)); return b; })),
    h('div.rbtns',
      nxt && h('button.btn.primary.xl', { onclick: () => go(nxt[0]) }, nxt[1]),
      g !== 'intro' && g !== 'review' && h('button.btn' + (nxt ? '.ghost' : '.primary'), { onclick: () => { location.hash = `#/play/${i}/${g}`; route(true); } }, '🔄 שוב עכשיו'),
      h('button.btn.ghost', { onclick: () => go(g === 'review' ? '#/map' : '#/stage/' + i) }, g === 'review' ? '🗺️ למפה' : 'לשלב')))
  );
}

// ---------- achievements / shop / profile / parent ----------
function achView() {
  const got = ACH.filter(a => S.ach[a[0]]).length;
  screen('achv', hud(), h('h2.ptitle', `🏆 הישגים (${got}/${ACH.length})`),
    h('div.achgrid', ACH.map(([id, ic, name, desc]) => h('div.ach' + (S.ach[id] ? '.got' : ''), h('div.aicon', S.ach[id] ? ic : '🔒'), h('b', name), h('small', desc)))), nav('#/ach'));
}
function shopView() {
  const buy = (price, fn) => { if (S.coins < price) { sfx('bad'); return toast(`חסרים ${price - S.coins} מטבעות 🪙`); } S.coins -= price; fn(); S.stats.buys++; sfx('coin'); save(true); checkAch(); shopView(); };
  const cos = S.cosmetics;
  screen('shopv', hud(), h('h2.ptitle', '🛒 חנות'), h('p.muted.center', 'מטבעות = כוח · קוסמטיקה · סטייל'),
    h('h3', 'כוחות'),
    h('div.shopgrid', POWERS.map(([id, ic, name, desc, price]) => h('div.item', h('div.iicon', ic), h('b', name), h('small', desc), h('small.have', `יש: ${S.powers[id]}`),
      h('button.btn.small.primary', { onclick: () => buy(price, () => S.powers[id]++) }, `${price} 🪙`)))),
    h('h3', 'הילות'),
    h('div.shopgrid', AURAS.map(([id, name, price]) => {
      const own = cos.ownedAuras.includes(id), cur = cos.aura === id;
      return h('div.item', h('div.iicon.big' + (id !== 'none' ? '.aura-' + id : ''), S.profile.avatar), h('b', name),
        own ? h('button.btn.small' + (cur ? '.ghost' : '.primary'), { disabled: cur, onclick: () => { cos.aura = id; save(); sfx('tap'); shopView(); } }, cur ? 'פעיל' : 'הפעילו')
          : h('button.btn.small.primary', { onclick: () => buy(price, () => { cos.ownedAuras.push(id); cos.aura = id; }) }, `${price} 🪙`));
    })),
    h('h3', 'תארים'),
    h('div.shopgrid', TITLES.map(([id, name, price]) => {
      const own = cos.ownedTitles.includes(id), cur = cos.title === id;
      return h('div.item', h('div.iicon', '🏷️'), h('b', name || '—'),
        own ? h('button.btn.small' + (cur ? '.ghost' : '.primary'), { disabled: cur, onclick: () => { cos.title = id; save(); sfx('tap'); shopView(); } }, cur ? 'פעיל' : 'הפעילו')
          : price ? h('button.btn.small.primary', { onclick: () => buy(price, () => { cos.ownedTitles.push(id); cos.title = id; }) }, `${price} 🪙`) : null);
    })),
    h('h3', 'דמויות'),
    h('div.shopgrid.av', SHOP_AV.map(([a, price]) => { const own = S.owned.includes(a), cur = S.profile.avatar === a;
      return h('div.item', h('div.iicon.big', a), own ? h('button.btn.small' + (cur ? '.ghost' : '.primary'), { disabled: cur, onclick: () => { S.profile.avatar = a; save(); sfx('tap'); shopView(); } }, cur ? 'בשימוש' : 'בחרו')
        : h('button.btn.small.primary', { onclick: () => buy(price, () => { S.owned.push(a); S.profile.avatar = a; }) }, `${price} 🪙`)); })),
    nav('#/shop'));
}
function meView() {
  const tr = TRACKS[S.profile.track];
  const tg = (key, txt) => h('label.toggle', h('input', { type: 'checkbox', checked: S.settings[key], onchange: e => { S.settings[key] = e.target.checked; save(); applyBig(); } }), h('span', txt));
  screen('mev', hud(),
    h('div.mecard', h('div.bigav' + ((S.cosmetics?.aura && S.cosmetics.aura !== 'none') ? '.aura-' + S.cosmetics.aura : ''), S.profile.avatar),
      h('h2', S.profile.name + (S.cosmetics?.title ? ' · ' + S.cosmetics.title : '')), h('p', `${tr.name} · `, en(tr.band)),
      h('button.btn.small.ghost', { onclick: () => { const v = prompt('כינוי חדש:', S.profile.name); if (v && v.trim()) { S.profile.name = v.replace(/[<>]/g, '').trim().slice(0, 14); save(); meView(); } } }, '✏️ שינוי כינוי')),
    h('h3', 'דמות'), h('div.avgrid.small', [...FREE_AV, ...S.owned].map(a => h('button.avpick' + (a === S.profile.avatar ? '.on' : ''), { 'aria-label': 'דמות ' + a, onclick: () => { S.profile.avatar = a; save(); sfx('tap'); meView(); } }, a))),
    h('h3', 'יעד יומי'), h('div.row.seg', [[100, 'רגוע'], [150, 'רגיל'], [300, 'אלופים']].map(([v, t]) => h('button.btn.small' + (S.settings.goal === v ? '.primary' : '.ghost'), { onclick: () => { S.settings.goal = v; save(); meView(); } }, `${t} · ${v} XP`))),
    h('h3', 'הגדרות'), tg('sfx', '🎵 צלילי משחק'), tg('voice', '🗣️ הקראת מילים'), tg('big', '🔠 טקסט גדול'),
    h('h3', 'כיתה / רמה'), h('div.row.seg', Object.entries(TRACKS).map(([k, t]) => h('button.btn.small' + (S.profile.track === k ? '.primary' : '.ghost'), { onclick: async () => {
      if (k === S.profile.track) return; if (!confirm(`לעבור ל${t.name}? ההתקדמות בכל כיתה נשמרת בנפרד.`)) return;
      S.profile.track = k; save(true); await loadTrack(k); go('#/map'); } }, t.name))),
    h('button.btn.ghost.wide', { onclick: offlineAll }, '📥 הורדת כל ההקלטות לשימוש בלי אינטרנט'),
    h('button.btn.ghost.wide', { onclick: () => go('#/parent') }, '👨‍👩‍👧 אזור הורים ומורים'),
    h('details.about', h('summary', 'ℹ️ על האפליקציה ומקורות'), h('div', { html: ABOUT })),
    nav('#/me'));
}
const ABOUT = `<p>רשימות המילים לקוחות מהרשימה הלקסיקלית הרשמית של משרד החינוך: <a href="https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand2.xlsx" target="_blank" rel="noopener" lang="en">Lexical Band II – Junior High School</a>.</p>
<p>לפי תוכנית הלימודים באנגלית (Revised English Curriculum 2020, טבלה 4): <b>Band II Core I</b> נלמד בכיתה ז׳ עד אמצע ח׳, ו־<b>Band II Core II</b> מאמצע ח׳ עד סוף ט׳.</p>
<p>הסדר בתוך כל רשימה (שלבים של 12 מילים) נקבע על ידינו: קודם מילים לשימוש פעיל (Productive) ואחר כך מילים להבנה (Receptive). המשפטים נכתבו במיוחד לאפליקציה. ההקלטות הוקלטו בקולות מלאכותיים (ElevenLabs).</p>
<p>ההתקדמות נשמרת רק במכשיר הזה (לא נשלח שום מידע לשרת).</p>`;
async function offlineAll() {
  const urls = D.words.flatMap(w => [`audio/en/${String(w.n).padStart(4, '0')}.mp3`, `audio/he/${String(w.n).padStart(4, '0')}.mp3`]);
  let done = 0; toast('מוריד… 0%', 60000);
  const worker = async () => { while (urls.length) { const u = urls.pop(); try { await fetch(u); } catch {} done++; if (done % 50 === 0) toast(`מוריד… ${Math.round(done / (done + urls.length) * 100)}%`, 60000); } };
  await Promise.all([worker(), worker(), worker(), worker()]);
  toast('✅ כל ההקלטות זמינות גם בלי אינטרנט', 3000);
}
function parentGate() {
  const a = 3 + Math.floor(Math.random() * 7), b = 4 + Math.floor(Math.random() * 6);
  const inp = h('input.name', { inputmode: 'numeric', 'aria-label': 'תשובה' });
  const ok = () => { if (+inp.value === a * b) { sessionStorage.eqParent = 1; parentView(); } else { toast('לא נכון 🙂'); inp.value = ''; } };
  inp.addEventListener('keydown', e => e.key === 'Enter' && ok());
  screen('parentv', h('div.shead.plain', h('button.icon-btn', { 'aria-label': 'חזרה', onclick: () => go('#/me') }, '→'), h('h2', 'אזור הורים ומורים')),
    h('div.gatebox', h('p', 'כדי להיכנס, פתרו את התרגיל:'), h('div.big', { dir: 'ltr' }, `${a} × ${b} = ?`), inp, h('button.btn.primary', { onclick: ok }, 'כניסה')));
}
function parentView() {
  if (!sessionStorage.eqParent) return parentGate();
  const t = T(), words = Object.entries(t.words), seen = words.length, mast = words.filter(([, r]) => isMastered(r)).length;
  const ans = words.reduce((s, [, r]) => s + r.ok + r.bad, 0), okc = words.reduce((s, [, r]) => s + r.ok, 0);
  const cleared = D.stages.filter((_, i) => stageRec(i).cleared).length;
  const days = Array.from({ length: 14 }, (_, k) => dayNum() - 13 + k), mx = Math.max(50, ...days.map(d => S.days[d]?.xp || 0));
  const hard = words.filter(([, r]) => r.bad > 0).sort((a, b) => (b[1].bad - b[1].ok * .5) - (a[1].bad - a[1].ok * .5)).slice(0, 12).map(([n, r]) => [W(n), r]).filter(x => x[0]);
  const mins = Math.round(t.ms / 60000);
  const tr = TRACKS[S.profile.track];
  const imp = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: async e => {
    try { const obj = JSON.parse(await e.target.files[0].text()); if (!obj.v) throw 0; if (confirm('לייבא ולהחליף את ההתקדמות הנוכחית?')) { replaceState(obj); location.reload(); } } catch { toast('הקובץ לא תקין'); } } });
  screen('parentv', h('div.shead.plain', h('button.icon-btn', { 'aria-label': 'חזרה', onclick: () => go('#/me') }, '→'), h('h2', 'אזור הורים ומורים')),
    h('p.muted', `${S.profile.avatar} ${S.profile.name} · ${tr.name} (`, en(tr.band), ')'),
    h('div.kpis',
      h('div', h('b', `${cleared}/${D.stages.length}`), h('small', 'שלבים הושלמו')),
      h('div', h('b', `${seen}/${D.words.length}`), h('small', 'מילים שנלמדו')),
      h('div', h('b', mast), h('small', 'מילים בשליטה (חזרו נכון כמה פעמים לאורך ימים)')),
      h('div', h('b', ans ? Math.round(okc / ans * 100) + '%' : '—'), h('small', 'דיוק בתשובות')),
      h('div', h('b', mins), h('small', 'דקות משחק')),
      h('div', h('b', `${streakNow()} / ${S.streak.best}`), h('small', 'רצף ימים (נוכחי / שיא)')),
      h('div', h('b', dueWords().length), h('small', 'מילים שממתינות לחזרה'))),
    h('h3', 'פעילות ב־14 הימים האחרונים (XP)'),
    h('div.chart', days.map(d => h('div.barc', h('div.bar', { style: { height: ((S.days[d]?.xp || 0) / mx) * 100 + '%' }, title: `${S.days[d]?.xp || 0} XP` }), h('small', fmtDay(d))))),
    h('h3', 'התקדמות לפי עולם'),
    h('div.wprogs', Array.from({ length: D.worlds }, (_, wi) => { const from = wi * PER_WORLD, to = Math.min(D.stages.length, from + PER_WORLD), c = Array.from({ length: to - from }, (_, k) => stageRec(from + k).cleared).filter(Boolean).length; const Wd = WORLDS[wi % WORLDS.length];
      return h('div.wp', h('span', `${Wd.icon} ${Wd.name}`), h('div.pbar', h('div', { style: { width: c / (to - from) * 100 + '%' } })), h('small', `${c}/${to - from}`)); })),
    h('h3', 'המילים הקשות ביותר'),
    hard.length ? h('table.hard', h('tr', h('th', 'מילה'), h('th', 'פירוש'), h('th', '✓'), h('th', '✗')), hard.map(([w, r]) => h('tr', h('td', en(w.en)), h('td', w.he), h('td', r.ok), h('td', r.bad)))) : h('p.muted', 'עוד אין טעויות 🙂'),
    h('h3', 'גיבוי'),
    h('div.row', h('button.btn.small.ghost', { onclick: () => download(`english-quest-${S.profile.name}.json`, exportState()) }, '⬇️ ייצוא'), h('button.btn.small.ghost', { onclick: () => imp.click() }, '⬆️ ייבוא'), imp,
      h('button.btn.small.danger', { onclick: () => { if (confirm('למחוק את כל ההתקדמות? אי אפשר לבטל.') && confirm('בטוחים?')) { resetAll(); location.hash = ''; location.reload(); } } }, '🗑️ איפוס')),
    h('p.muted.small', 'הנתונים נשמרים רק בדפדפן במכשיר הזה.'));
}

// ---------- router ----------
let lastPlay = null;
async function route(replay) {
  document.querySelectorAll('.confetti,.banner').forEach(el => el.remove());
  banners.length = 0;
  if (!S.profile) return onboarding();
  if (!D || D.track !== S.profile.track) await loadTrack(S.profile.track);
  const p = location.hash.replace(/^#\/?/, '').split('/');
  if (p[0] !== 'play' && p[0] !== 'review') { session?.kill(); session = null; }
  if (p[0] === 'stage' && D.stages[+p[1]]) return stageView(+p[1]);
  if (p[0] === 'play' && D.stages[+p[1]] && GAMES[p[2]]) return play(+p[1], p[2]);
  if (p[0] === 'review') return play(0, 'review');
  if (p[0] === 'ach') return achView();
  if (p[0] === 'shop') return shopView();
  if (p[0] === 'me') return meView();
  if (p[0] === 'parent') return parentView();
  return mapView();
}
addEventListener('hashchange', () => route());
document.addEventListener('keydown', e => {   // keyboard: 1-4 picks an answer on desktop
  if (/^[1-4]$/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { const b = document.querySelectorAll('.opts .opt:not([disabled])')[+e.key - 1]; b?.click(); }
});
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
