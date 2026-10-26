// English Quest – screens & navigation
import { $, h, put, en, shuffle, dayNum, fmtDay, toast, download, nWords, reduced, posHe } from './util.js';
import { S, save, on, T, stageRec, today, dueWords, level, levelXp, gainCoins, touchStreak, streakNow, checkAch, ACH, isMastered, replaceState, resetAll, exportState, unlock, ensureDaily, bumpDaily, beatRival, AURAS, TITLES, profiles, curProfileId, createProfile, switchProfile, leaveProfile, deleteProfile } from './store.js';
import { setOnTrackLoad, TRACKS, GRADES, GRADE_GROUPS, LEVELS, levelsFor, validLevel, isEarly, gradeTracks, themeOf, gradeLabel, WORLDS, worldsFor, worldAt, isAdultTrack, PER_WORLD, D, W, loadTrack, stageWords, world, worldOf } from './data.js';
import { sayUi, spellingOpen, untimed, GAMES, practiceFor, missionPool, theme, Session, intro, match, listen, pics, scramble, fill, memory, blitz, boss, forms, formsPool, familyItems, reading, talk, cards, typing } from './games.js';
import * as B from './backup.js';
import { playWord, sfx, prefetch, stop as stopAudio, hasClip, audioUrl, onRobo } from './audio.js';

const app = $('#app');
const FREE_AV = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐧', '🦉', '🐨', '🤖', '👾', '⭐', '🔷'];
const SHOP_AV = [['🦖', 60], ['🐳', 60], ['🦩', 60], ['🐝', 60], ['🦈', 80], ['🐢', 80], ['🦋', 80], ['🐲', 120], ['🚀', 120], ['🛸', 150], ['🌈', 150], ['💎', 250]];
const POWERS = [['hint', '💡', 'רמז', 'חושף אות במשחק האיות', 20], ['heart', '❤️', 'לב נוסף', 'לב רביעי בקרב בוס', 30], ['freeze', '🧊', 'הקפאת רצף', 'שומר על הרצף אם פספסתם יום אחד', 50]];
let session = null;

// ---------- celebrations ----------
function applyBig() { document.documentElement.classList.toggle('big', !!S.settings.big); }
function applyTheme() {
  const t = S.profile ? themeOf(S.profile.grade) : 'arcade', c = document.documentElement.classList;
  c.remove('theme-kids', 'theme-arcade', 'theme-bagrut'); c.add('theme-' + t);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'kids' ? '#1f6fe0' : t === 'bagrut' ? '#0d1b2a' : '#07071a');
}
applyBig(); applyTheme();
// 🤖 flag: a word without a recording is read by the browser voice – always visible to the learner/parent
let roboT = 0;
onRobo((w, lang) => {
  const el = document.getElementById('robo'); if (el) { el.hidden = false; clearTimeout(roboT); roboT = setTimeout(() => { el.hidden = true; }, 2600); }
});
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
// a derived track whose stage layout changed (eq-3.4: confusable words split, known words moved to fast review):
// word progress is keyed by n and is kept; stage stars are carried over by words (review #2 #12): a new stage is
// cleared when every old stage holding its words was cleared, with the lowest of their star counts.
export function remapStages(old, prev, stages) {
  const where = new Map(); prev.forEach((s, i) => s.forEach(n => where.set(n, i))); const out = {};
  stages.forEach((s, j) => {
    const olds = [...new Set(s.map(n => where.get(n)).filter(i => i != null))]; if (!olds.length) return;
    const recs = olds.map(i => old[i]);
    if (recs.every(r => r && r.cleared)) out[j] = { games: {}, stars: Math.min(...recs.map(r => r.stars || 0)), cleared: true, plays: Math.max(...recs.map(r => r.plays || 0)) };
  });
  return out;
}
setOnTrackLoad(d => {
  if (!d.layout || !S.profile) return; const t = T(d.track);
  if (t.layout !== d.layout) {
    const had = Object.keys(t.stages).length;
    if (had) t.stages = d.prev && (t.layout || '') === d.prev.layout ? remapStages(t.stages, d.prev.stages, d.stages) : {};
    t.layout = d.layout; save();
  }
});
const isUnlocked = i => i === 0 || stageRec(i - 1).cleared || (D.fast != null && i >= D.fast);   // fast-review stages (words known from the MoE Bands) are optional
const currentStage = () => { let i = 0; while (i < D.stages.length - 1 && stageRec(i).cleared) i++; return i; };
const practiceDone = i => practiceFor(i).filter(g => stageRec(i).games[g]).length;
const starsTxt = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function hud() {
  const L = level(), a = levelXp(L), b = levelXp(L + 1), d = today(), goal = S.settings.goal, gp = Math.min(1, d.xp / goal);
  const aura = S.cosmetics?.aura || 'none';
  const title = S.cosmetics?.title || '';
  return h('header.hud',
    h('button.avatar-btn' + (aura !== 'none' ? '.aura-' + aura : ''), { 'aria-label': `${L} – הפרופיל שלי (רמה ${L})`, onclick: () => go('#/me') }, h('span.av', S.profile.avatar), h('span.lvl', L)),
    h('div.xpbox', h('div.xpline', h('b', S.profile.name + (title ? ' · ' + title : '')), h('span', `רמה ${L}`)), h('div.xpbar', h('div', { style: { width: ((S.xp - a) / (b - a)) * 100 + '%' } })), h('small', { dir: 'ltr', style: { display: 'block', textAlign: 'right' } }, `${S.xp - a} / ${b - a} XP`)),
    h('div.stat', { title: 'רצף ימים' }, h('span', streakNow() ? '🔥' : '🩶'), h('b', streakNow())),
    h('div.stat', { title: 'מטבעות' }, h('span', '🪙'), h('b', S.coins)),
    h('div.goal', { title: 'יעד יומי', style: { '--p': gp * 360 + 'deg' } }, h('span', gp >= 1 ? '✅' : '🎯')));
}
function nav(active) {
  const it = (hash, icon, txt) => h('a.navi' + (active === hash ? '.on' : ''), { href: hash }, h('span', icon), txt);
  return h('nav.bottom', it('#/map', '🗺️', 'מפה'), it('#/study', '📚', 'לימוד'), it('#/ach', '🏆', 'הישגים'), it('#/shop', '🛒', 'חנות'), it('#/me', '👤', 'פרופיל'));
}
function screen(cls, ...kids) { stopAudio(); put(app, h('div.screen.' + cls, ...kids)); app.scrollTop = 0; window.scrollTo(0, 0); }
export function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

const LEVEL_CARDS = [[3, '📗', 'Band II (חזרה ושליטה במילים של חטיבת הביניים)'], [4, '📘', 'Band III Core I'], [5, '📕', 'Band III Core I + Core II']];
const LEVEL_CARDS13 = [['acad', '🎓', 'מילים אקדמיות (NAWL) – לקריאת מאמרים, אוניברסיטה ופרק האנגלית בפסיכומטרי'], ['tech', '💻', 'אנגלית של מדעי המחשב והייטק (NCSAWL)'], ['c1', '🔷', 'מילים ברמת C1 – שלב ביניים אחרי 5 יח״ל, לפני C2'], ['c2', '💎', 'מילים מתקדמות ברמת C2 – לקראת אנגלית ברמת שפת אם']];
const gname = g => +g === 13 ? GRADES[13] : 'כיתה ' + GRADES[g];
/** grade buttons grouped by school stage; all look the same – only the learner's own chosen grade (`cur`) is highlighted */
function gradePicker(cur, pick, small = false) {
  return h('div.gradegroups' + (small ? '.small' : ''), GRADE_GROUPS.map(([label, gs]) => h('div.gradegroup',
    h('div.gglabel', label),
    h('div.gradegrid' + (small ? '.small' : ''), gs.map(g => h('button.gradebtn' + (+g === 13 ? '.wide' : '') + (+g === +cur ? '.on' : ''), { 'aria-label': gname(g), 'aria-pressed': String(+g === +cur), onclick: () => pick(+g) }, GRADES[g]))))));
}
// ---------- onboarding: who's playing → grade → (bagrut level) → name + avatar ----------
function onboarding(step = profiles().length ? 'who' : 0, draft = {}) {
  const next = s => onboarding(s, draft);
  if (step === 'who') return screen('onb', h('div.splash',
    h('div.logo-emoji.bob', '🚀'), h('h1', 'English Quest'), h('h3', 'מי משחק עכשיו?'),
    h('div.wholist', profiles().map(p => h('button.track-card', { onclick: async () => { sfx('tap'); switchProfile(p.id); applyTheme(); applyBig(); go('#/map'); route(); } },
      h('div.temoji', p.avatar), h('div', h('b', p.name), h('div.small.muted', gradeLabel(p)))))),
    h('button.btn.ghost.wide', { onclick: () => { sfx('tap'); next(0); } }, '➕ שחקן/ית חדש/ה'),
    h('button.btn.ghost.wide.small', { onclick: () => restoreView() }, '🛟 שחזור מגיבוי')));
  if (step === 0) return screen('onb', h('div.splash',
    h('div.logo-emoji.bob', '🚀'), h('h1', 'English Quest'), h('p.lead', 'משחק מילים באנגלית · כיתות א׳–י״ב ואחרי התיכון'),
    h('p.muted.small', 'על בסיס רשימות המילים של משרד החינוך (ג׳–י״ב) ותוכן נגזר מרשימות פתוחות (א׳–ב׳, אותיות, ואחרי י״ב) · 2–4 דקות לסיבוב'),
    h('h3', 'באיזו כיתה את/ה?'),
    gradePicker(null, g => { draft.grade = g; sfx('tap'); next(g >= 10 ? 'level' : 1); }),
    profiles().length > 0 ? h('button.btn.ghost.wide', { onclick: () => next('who') }, '→ חזרה לבחירת שחקן')
      : h('button.btn.ghost.wide.restore-entry', { onclick: () => restoreView() }, '🛟 כבר שיחקתם? שחזור מגיבוי (קובץ או קוד)')));
  if (step === 'level') return screen('onb', h('h2', draft.grade === 13 ? 'אחרי י״ב · איזו אנגלית?' : `כיתה ${GRADES[draft.grade]} · כמה יחידות?`), h('p.muted', 'אפשר לשנות בכל רגע בפרופיל'),
    (draft.grade === 13 ? LEVEL_CARDS13 : LEVEL_CARDS).map(([lv, icon, d]) =>
      h('button.track-card', { onclick: () => { draft.level = lv; sfx('tap'); next(1); } }, h('div.temoji', icon), h('div', h('b', LEVELS[lv]), h('div.small.muted', d)))),
    h('button.btn.ghost.wide', { onclick: () => next(0) }, '→ חזרה'));
  if (step === 1) {
    const inp = h('input.name', { maxlength: 14, placeholder: 'נינג׳ה_המילים', value: draft.name || '', 'aria-label': 'כינוי' });
    const finish = async (av) => {
      const v = (inp.value || draft.name || '').replace(/[<>]/g, '').trim() || 'שחקן';
      sfx('win'); confetti(40);
      const level = validLevel(draft.grade, draft.level);
      createProfile({ name: v.slice(0, 14), avatar: av, grade: draft.grade, level, track: gradeTracks(draft.grade, level)[0], created: Date.now() });
      applyTheme(); await loadTrack(S.profile.track); go('#/map');
    };
    screen('onb', h('h2', 'כינוי + דמות'), h('p.muted', `${gname(draft.grade)} · פחות מ־10 שניות ויוצאים למשחק`),
      inp, h('div.avgrid', FREE_AV.map(a => h('button.avpick', { 'aria-label': 'דמות ' + a, onclick: () => finish(a) }, a))));
    return setTimeout(() => inp.focus(), 40);
  }
}
/** a grade can cover two official lists (e.g. ה׳, ח׳) – let the learner switch */
function trackToggle() {
  const ts = gradeTracks(S.profile.grade, S.profile.level);
  if (ts.length < 2) return null;
  return h('div.ttoggle', { role: 'group', 'aria-label': 'רשימת מילים' }, ts.map(k => h('button' + (k === S.profile.track ? '.on' : ''), { onclick: async () => {
    if (k === S.profile.track) return; S.profile.track = k; save(true); sfx('whoosh'); await loadTrack(k); route(); } }, TRACKS[k].emoji + ' ', en(TRACKS[k].band))));
}

// ---------- world map ----------
// review #2 (fun & feel, post-12): adult-style progress on the word list instead of only islands and coins
const LIST_LABEL = { acad: 'רשימת NAWL', tech: 'אנגלית טכנית', c1: 'רמת C1 (CEFR)', c2: 'רמת C2 (CEFR)' };
function adultProgress() {
  const N = D.words.length, recs = D.words.map(w => T().words[w.n]), seen = recs.filter(Boolean).length, m = recs.filter(isMastered).length;
  const pct = Math.round(m / N * 100), next = [10, 25, 50, 75, 100].find(x => x > pct) || 100;
  const chapters = Array.from({ length: D.worlds }, (_, wi) => wi).filter(wi => { const a = wi * PER_WORLD, b = Math.min(D.stages.length, a + PER_WORLD); for (let i = a; i < b; i++) if (!stageRec(i).cleared) return false; return true; }).length;
  return h('div.aprog', h('div.aprow', h('b', '📈 ', LIST_LABEL[D.track] || 'הרשימה'), h('span', `${m}/${N} מילים בשליטה · ${pct}%`)),
    h('div.abar', h('div', { style: { width: pct + '%' } }), h('i', { style: { insetInlineStart: next + '%' } })),
    h('div.muted.small', `נלמדו ${seen} · פרקים שהושלמו ${chapters}/${D.worlds} · היעד הבא: ${next}% מהרשימה`));
}
/** review #3 #6: grades 1–2 (pre-readers) */
const kidsTiny = () => +(S.profile?.grade || 7) <= 2;
function mapView() {
  const cur = currentStage(); const due = dueWords(); const daily = ensureDaily();
  // review #3 #6: grades 1–2 can't read yet – no text banners (rival, daily challenge) until 3 stages are cleared
  const tinyEarly = kidsTiny() && D.stages.filter((_, k) => stageRec(k).cleared).length < 3;
  const path = h('div.map');
  for (let wi = 0; wi < D.worlds; wi++) {
    const W0 = worldAt(wi), fastCh = D.fast != null && wi * PER_WORLD >= D.fast, adult = isAdultTrack(D.track), from = wi * PER_WORLD, to = Math.min(D.stages.length, from + PER_WORLD);
    const cleared = Array.from({ length: to - from }, (_, k) => stageRec(from + k).cleared).filter(Boolean).length;
    const locked = !isUnlocked(from);
    const sec = h('section.world' + (locked ? '.locked' : ''), { style: { '--c1': W0.bg[0], '--c2': W0.bg[1] } },
      h('div.wbanner', h('span.wicon', W0.icon), h('div', h('small', `${adult ? 'פרק' : 'אי'} ${wi + 1}`), h('b', W0.name)), h('span.wprog', `${cleared}/${to - from}`)),
      W0.story && h('p.wstory', W0.story));
    const sepAt = fastCh ? -1 : D.fast;   // a ⚡ chapter already says so in its banner
    for (let i = from; i < to; i++) {
      const r = stageRec(i), un = isUnlocked(i), k = i - from;
      const off = Math.sin(k * 1.1) * 32;
      const node = h('button.node' + (r.cleared ? '.done' : un ? '.open' : '.lock') + (i === cur ? '.cur' : ''), {
        style: { '--tx': off + '%', transform: `translateX(${off}%)` }, 'aria-label': (i === cur ? `${i + 1} ${r.plays ? 'ממשיכים!' : 'התחילו כאן!'} – ` : '') + `שלב ${i + 1}` + (un ? '' : ' (נעול)'),
        onclick: () => un ? (sfx('tap'), go('#/stage/' + i)) : (sfx('bad'), toast('🔒 נצחו את הבוס של השלב הקודם')) },
        h('span.num', un ? (D.fast != null && i >= D.fast ? '⚡' + (i + 1) : i + 1) : '🔒'), r.cleared && h('span.nstars', starsTxt(r.stars)),
        i === cur && h('span.me', { 'aria-hidden': 'true' }, S.profile.avatar), i === cur && h('span.bubble', r.plays ? 'ממשיכים!' : 'התחילו כאן!'));
      if (i === sepAt) sec.append(h('div.fastsep', '⚡ חזרה מהירה – מילים שכבר פגשתם ברשימות של משרד החינוך. פתוח תמיד, אפשר לדלג.'));
      sec.append(node);
    }
    sec.append(h('div.gate', h('span.gboss', W0.boss), h('small', `${adult ? 'אתגר הפרק' : 'בוס האי'}: ${W0.bossName}`)));
    path.append(sec);
  }
  const dailyGo = () => {
    if (daily.done) return toast('✅ אתגר היום כבר הושלם – חזרו מחר!');
    sfx('tap');
    if (!untimed() && (daily.kind === 'blitz_ok' || daily.kind === 'perfect')) go('#/play/' + cur + '/blitz');
    else if (daily.kind === 'boss') go('#/play/' + cur + '/boss');
    else go('#/stage/' + cur);
  };
  const bag = theme() === 'bagrut';
  screen('mapv', hud(), trackToggle(),
    bag && h('div.bagrow',
      D.read.length > 0 && h('button.btn.small', { onclick: () => go('#/study/reading') }, '📰 קטע קריאה'),
      familyItems(D.words).length >= 4 && h('button.btn.small', { onclick: () => go('#/study/forms') }, '🧩 משפחות מילים'),
      h('button.btn.small', { onclick: () => go('#/study') }, '📚 כל המילים')),
    !tinyEarly && h('div.rival-chip', '👻 יריב מקומי: ', S.rival.name, ...(untimed() ? [] : [' · בליץ ', S.rival.bestBlitz]), ' · קומבו ', S.rival.bestCombo, sayUi(11101)),
    !tinyEarly && h('div.daily-card' + (daily.done ? '.done' : ''), { onclick: dailyGo },
      h('div.dico', daily.done ? '✅' : '☀️'),
      h('div', { style: { flex: 1 } }, h('b', 'אתגר היום', sayUi(11100)), h('div.muted.small', daily.label || ''),
        h('div.dbar', h('div', { style: { width: (daily.progress / daily.target * 100) + '%' } })))),
    isAdultTrack(D.track) && adultProgress(),
    h('div.mapbar',
      h('button.btn.primary.cta', { onclick: () => { sfx('whoosh'); go('#/stage/' + cur); } }, `▶ משימה · שלב ${cur + 1}`), sayUi(11099),
      h('button.btn.review' + (due.length ? '.has' : ''), { onclick: () => due.length ? go('#/review') : toast('אין מילים לחזרה – שחקו! 🎮') }, '🔁', due.length ? h('b.badge', due.length) : null)),
    path, nav('#/map'));
  const c = $('.node.cur'); if (c) setTimeout(() => c.scrollIntoView({ block: 'center', behavior: 'instant' }), 0);
}

// ---------- stage screen ----------
function nextGame(i) {
  const r = stageRec(i);
  if (!r.games.intro) return 'intro';
  const g = practiceFor(i).find(g => !r.games[g]);
  if (practiceDone(i) >= 2 && !r.cleared) return 'boss';
  return g || 'boss';
}
function pickMission(i) {
  const r = stageRec(i);
  if (!r.games.intro) return 'intro';
  if (practiceDone(i) >= 2 && !r.cleared) return 'boss';
  const MP = missionPool(i), undone = MP.filter(g => !r.games[g]);
  const pool = undone.length ? undone : MP;
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
      h('div.gtxt', h('b', isBoss ? `קרב בוס: ${wd.bossName}` : GAMES[g].name), h('small', locked ? `🔒 שחקו ${2 - done} משחקים נוספים` : g === 'memory' && isEarly(S.profile.grade) ? 'מצאו זוגות של תמונות – כל קלף אומר את המילה' : GAMES[g].desc)),
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
    h('div.glist', h('div.sep', 'או בחרו מצב'), card('intro'), practiceFor(i).map(card), h('div.sep', '⚔️ הבוס'), card('boss')),
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
  else if (g === 'pics') res = await pics(sess, ws);
  else if (g === 'scramble') res = await scramble(sess, ws);
  else if (g === 'fill') res = await fill(sess, i);
  else if (g === 'memory') res = await memory(sess, ws);
  else if (g === 'blitz') res = await blitz(sess, ws);
  else if (g === 'forms') res = await forms(sess, formsPool(i));
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
// study-tab sessions (not tied to a stage): cards / type / talk / reading / forms
const STUDY = new Set(['cards', 'type', 'talk', 'reading', 'forms']);
let studyPick = [];   // words chosen in the study list for cards/type
async function playStudy(g, arg) {
  session?.kill();
  const sess = session = new Session(app, g, { onQuit: () => quit() });
  const quit = () => { if (sess.ok + sess.bad > 0 && !confirm('לצאת? ההתקדמות בסבב הזה לא תישמר')) return; sess.kill(); go('#/study'); };
  let res;
  if (g === 'cards') res = await cards(sess, studyPick.length ? studyPick : pickStudyWords(12));
  else if (g === 'type') res = await typing(sess, studyPick.length ? studyPick : pickStudyWords(10));
  else if (g === 'talk') res = await talk(sess, D.talk.length ? shuffle(D.talk).slice(0, 8) : []);
  else if (g === 'reading') { const r = D.read[+arg] || D.read[Math.floor(Math.random() * D.read.length)]; if (!r) return go('#/study'); res = await reading(sess, r); }
  else if (g === 'forms') { const fam = familyItems(D.words), seen = fam.filter(x => T().words[x.w.n]); res = await forms(sess, [...new Set([...shuffle(seen), ...shuffle(fam)])].slice(0, 8)); }
  if (!res || sess.dead) return;
  sess.kill(); session = null;
  finishGame(-1, g, res);
}
/** due first, then the next unseen words in curriculum order, then weakest */
function pickStudyWords(k) {
  const t = T().words, due = new Set(dueWords());
  const a = D.words.filter(w => due.has(w.n)), b = D.stages.flat().map(W).filter(w => w && !t[w.n]), c = D.words.filter(w => t[w.n] && !due.has(w.n)).sort((x, y) => (t[y.n].bad - t[y.n].ok) - (t[x.n].bad - t[x.n].ok));
  return [...new Set([...a, ...b, ...c])].slice(0, k);
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
  const free = i < 0;
  if (g === 'review') { S.stats.reviews++; coinsBonus = 10; }
  else if (free) { coinsBonus = res.stars; S.stats.missions++; bumpDaily('mission'); }
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
  const wd = g === 'review' || free ? null : world(i);
  const title = g === 'boss' ? (res.won ? (worldDone ? `🏆 כבשתם את ${wd.name}!` : `ניצחתם את ${wd.bossName}!`) : 'אוי! הבוס ניצח הפעם') :
    g === 'review' ? 'חזרה הושלמה! 🦉' : g === 'blitz' ? (res.beatGhost ? 'ניצחתם את הצל! 👻' : `בליץ: ${res.blitzScore || 0}`) :
    res.stars === 3 ? 'מושלם! 🤩' : res.stars === 2 ? 'כל הכבוד! 😎' : 'יפה! עוד סיבוב? 💪';
  const nxt = g === 'review' ? null : free ? ['#/study/' + g + (g === 'reading' ? '/' + Math.floor(Math.random() * D.read.length) : ''), '🔥 עוד סבב'] : cleared && i + 1 < D.stages.length ? ['#/stage/' + (i + 1), `לשלב ${i + 2} ▶`] : (() => {
    if (g === 'intro') return ['#/play/' + i + '/' + pickMission(i), '▶ המשימה הראשונה'];
    const n = nextGame(i);
    if (n === 'boss' && practiceDone(i) >= 2 && !stageRec(i).cleared) return ['#/play/' + i + '/boss', `⚔️ לבוס!`];
    if (n !== g && n !== 'boss') return ['#/play/' + i + '/' + n, `${GAMES[n].icon} עוד סיבוב · ${GAMES[n].short}`];
    return ['#/play/' + i + '/' + (g === 'blitz' ? 'blitz' : pickMission(i)), '🔥 עוד סיבוב'];
  })();
  const missed = (res.missed || []).map(W).filter(Boolean);
  screen('result', h('div.rbox',
    h('div.rbig' + (won ? '.bob' : '') + (kidsTiny() ? '.kbig' : ''), kidsTiny() ? (!won ? '🤗' : res.stars === 3 ? '🤩' : res.stars === 2 ? '😄' : '🙂') : g === 'boss' ? (res.won ? '🏆' : wd.boss) : g === 'review' ? '🦉' : GAMES[g].icon),
    h('h2', title),
    res.stars > 0 && h('div.rstars', [0, 1, 2].map(k => h('span' + (k < res.stars ? '.on' : ''), { style: { animationDelay: k * .18 + 's' } }, '★'))),
    !won && h('p', 'לא נורא – כל טעות מלמדת. נסו שוב מיד!'),
    !kidsTiny() && h('div.rstats',
      h('div', h('b', '+' + res.xp), h('small', 'XP')),
      h('div', h('b', '+' + (res.coins + coinsBonus)), h('small', '🪙 מטבעות')),
      res.ok + res.bad > 0 && g !== 'intro' && h('div', h('b', Math.round(res.acc * 100) + '%'), h('small', 'דיוק')),
      res.maxCombo >= 2 && h('div', h('b', '🔥' + res.maxCombo), h('small', 'קומבו'))),
    res.note && h('p.note', res.note),
    cleared && i + 1 < D.stages.length && h('p.unlock', `🔓 שלב ${i + 2} נפתח!`),
    missed.length > 0 && h('div.missed', h('h4', 'מילים לחזרה:'), missed.map(w => { const b = h('button.chip.wchip', { onclick: () => playWord(w, 'en', b) }, h('span', w.e), en(w.en), h('small', w.he)); return b; })),
    h('div.rbtns',
      nxt && h('button.btn.primary.xl', { onclick: () => go(nxt[0]) }, nxt[1]),
      g !== 'intro' && g !== 'review' && !free && h('button.btn' + (nxt ? '.ghost' : '.primary'), { onclick: () => { location.hash = `#/play/${i}/${g}`; route(true); } }, '🔄 שוב עכשיו'),
      h('button.btn.ghost', { onclick: () => go(g === 'review' ? '#/map' : free ? '#/study' : '#/stage/' + i) }, g === 'review' ? '🗺️ למפה' : free ? '📚 ללימוד' : 'לשלב')))
  );
}

// ---------- 📚 study tab: browse & listen, flashcards, typing quiz, conversations, reading ----------
const SF = { q: '', f: 'all', show: 60 };
function studyList() {
  const t = T().words, due = new Set(dueWords()), q = SF.q.trim().toLowerCase();
  return D.words.filter(w => {
    if (q && !w.en.toLowerCase().includes(q) && !w.he.includes(q)) return false;
    const r = t[w.n];
    if (SF.f === 'new') return !r; if (SF.f === 'hard') return r && r.bad > 0; if (SF.f === 'due') return due.has(w.n);
    if (SF.f === 'mast') return r && isMastered(r);
    if (/^[A-D]$/.test(SF.f)) return w.l === SF.f;
    return true;
  });
}
function studyView() {
  const tr = TRACKS[S.profile.track], lists = [...new Set(D.words.map(w => w.l).filter(Boolean))].sort();
  const noEn = D.words.filter(w => !hasClip(w, 'en')).length;
  const listEl = h('div.wlist');
  const draw = () => {
    const ws = studyList();
    put(listEl, h('div.muted.small', `${ws.length} מילים`), ws.slice(0, SF.show).map(w => {
      const r = T().words[w.n];
      return h('div.wrow',
        h('span.we', { 'aria-hidden': 'true' }, w.e || '✨'),
        h('div.wtxt', h('div.wen', { dir: 'ltr', lang: 'en' }, h('b', w.en), w.m && h('small', ` (${w.m})`)), h('div.he', w.he), h('small.muted', posHe(w.pos) + (w.l ? ` · List ${w.l}` : '') + (r ? (isMastered(r) ? ' · ✅ בשליטה' : ' · 👀 נלמדה') : ''))),
        h('button.say', { 'aria-label': 'השמיעו באנגלית', onclick: e => playWord(w, 'en', e.currentTarget) }, hasClip(w, 'en') ? '🔊' : '🤖'),
        h('button.say.he', { 'aria-label': 'השמיעו בעברית', onclick: e => playWord(w, 'he', e.currentTarget) }, hasClip(w, 'he') ? 'עב' : '🤖'));
    }), ws.length > SF.show && h('button.btn.ghost.wide', { onclick: () => { SF.show += 120; draw(); } }, `הציגו עוד (${ws.length - SF.show})`));
  };
  const inp = h('input.name.search', { type: 'search', placeholder: '🔎 חיפוש באנגלית או בעברית', value: SF.q, 'aria-label': 'חיפוש', oninput: e => { SF.q = e.target.value; SF.show = 60; draw(); } });
  const chip = (k, txt) => h('button.chip' + (SF.f === k ? '.on' : ''), { onclick: () => { SF.f = k; SF.show = 60; studyView(); } }, txt);
  const fromFilter = n => { const ws = studyList(); studyPick = SF.f === 'all' && !SF.q ? [] : shuffle(ws).slice(0, n); };
  const mode = (g, n, extra) => h('button.mode', { onclick: () => { sfx('tap'); if (n) fromFilter(n); go('#/study/' + g); } }, h('span', GAMES[g].icon), h('b', GAMES[g].short), extra && h('small', extra));
  screen('studyv', hud(), trackToggle(),
    h('h2.ptitle', '📚 לימוד · ', en(tr.band)),
    h('div.modes', mode('cards', 12), !isEarly(S.profile.grade) && spellingOpen(currentStage()) && mode('type', 10),
      D.talk.length > 0 && mode('talk', 0, `${D.talk.length}`),
      D.read.length > 0 && mode('reading', 0, `${D.read.length} קטעים`),
      familyItems(D.words).length >= 4 && mode('forms', 0)),
    h('p.muted.small', (isEarly(S.profile.grade) ? 'כרטיסיות מתרגלות' : 'כרטיסיות והקלדה מתרגלות') + ' את המילים שבסינון. בלי סינון: מילים לחזרה, ואחריהן מילים חדשות לפי הסדר.'),
    inp,
    h('div.chips.filters', chip('all', 'הכול'), chip('new', 'חדשות'), chip('due', '🔁 לחזרה'), chip('hard', 'קשות'), chip('mast', 'בשליטה'), lists.map(l => chip(l, 'List ' + l))),
    noEn > 0 && h('p.robonote', `🤖 ל־${noEn} מתוך ${D.words.length} המילים ברשימה הזו עדיין אין הקלטה באנגלית – הן מוקראות בקול הדפדפן (מסומנות 🤖).`),
    listEl, nav('#/study'));
  draw();
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
  screen('mev', hud(), backupReminder(),
    h('div.mecard', h('div.bigav' + ((S.cosmetics?.aura && S.cosmetics.aura !== 'none') ? '.aura-' + S.cosmetics.aura : ''), S.profile.avatar),
      h('h2', S.profile.name + (S.cosmetics?.title ? ' · ' + S.cosmetics.title : '')), h('p', `${tr.name} · `, en(tr.band)),
      h('button.btn.small.ghost', { onclick: () => { const v = prompt('כינוי חדש:', S.profile.name); if (v && v.trim()) { S.profile.name = v.replace(/[<>]/g, '').trim().slice(0, 14); save(); meView(); } } }, '✏️ שינוי כינוי')),
    h('h3', 'דמות'), h('div.avgrid.small', [...FREE_AV, ...S.owned].map(a => h('button.avpick' + (a === S.profile.avatar ? '.on' : ''), { 'aria-label': 'דמות ' + a, onclick: () => { S.profile.avatar = a; save(); sfx('tap'); meView(); } }, a))),
    h('h3', 'יעד יומי'), h('div.row.seg', [[100, 'רגוע'], [150, 'רגיל'], [300, 'אלופים']].map(([v, t]) => h('button.btn.small' + (S.settings.goal === v ? '.primary' : '.ghost'), { onclick: () => { S.settings.goal = v; save(); meView(); } }, `${t} · ${v} XP`))),
    h('h3', 'הגדרות'), tg('sfx', '🎵 צלילי משחק'), tg('voice', '🗣️ הקראת מילים'), tg('big', '🔠 טקסט גדול'),
    h('h3', 'כיתה'), gradePicker(S.profile.grade, g => setGrade(g, validLevel(g, S.profile.level)), true),
    levelsFor(S.profile.grade).length > 0 && h('div.row.seg', levelsFor(S.profile.grade).map(lv => h('button.btn.small' + (validLevel(S.profile.grade, S.profile.level) === lv ? '.primary' : '.ghost'), { onclick: () => setGrade(S.profile.grade, lv) }, LEVELS[lv]))),
    h('p.muted.small', 'רשימות: ', gradeTracks(S.profile.grade, S.profile.level).map(k => TRACKS[k].band).join(' + '), ' · ההתקדמות בכל רשימה נשמרת בנפרד'),
    h('h3', 'שחקנים במכשיר'),
    h('div.row', profiles().map(p => h('button.btn.small' + (p.id === curProfileId() ? '.primary' : '.ghost'), { onclick: () => { if (p.id !== curProfileId()) { switchProfile(p.id); applyTheme(); applyBig(); go('#/map'); route(); } } }, `${p.avatar} ${p.name}`)),
      h('button.btn.small.ghost', { onclick: () => { leaveProfile(); applyTheme(); if (location.hash === '#/new') route(); else location.hash = '#/new'; } }, '➕ חדש/ה')),
    h('button.btn.ghost.wide', { onclick: offlineAll }, '📥 הורדת כל ההקלטות של הרשימה לשימוש בלי אינטרנט'),
    h('button.btn.ghost.wide', { onclick: () => go('#/parent') }, '📊 אזור הורים ומורים'),
    h('details.about', h('summary', 'ℹ️ על האפליקציה ומקורות'), h('div', { html: ABOUT }), coverage()),
    nav('#/me'));
}
async function setGrade(grade, lv) {
  const ts = gradeTracks(grade, lv);
  lv = validLevel(grade, lv);
  if (+grade === +S.profile.grade && lv === validLevel(S.profile.grade, S.profile.level)) return;
  if (!confirm(`לעבור ל${gname(grade)}${lv !== undefined ? ' · ' + LEVELS[lv] : ''}? ההתקדמות בכל רשימה נשמרת.`)) return;
  S.profile.grade = grade; S.profile.level = lv;
  if (!ts.includes(S.profile.track)) S.profile.track = ts[0];
  save(true); applyTheme(); await loadTrack(S.profile.track); go('#/map');
}
const SRC = 'https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/';
const ABOUT = `<p><b>רשימות המילים</b> – רשמיות, מהרשימות הלקסיקליות של משרד החינוך (English Curriculum 2020): <a href="${SRC}LexicalBand1.xlsx" target="_blank" rel="noopener" lang="en">Band I (+ Pre-Band I)</a>, <a href="${SRC}LexicalBand2.xlsx" target="_blank" rel="noopener" lang="en">Band II</a>, <a href="${SRC}LexicalBand3.xlsx" target="_blank" rel="noopener" lang="en">Band III</a>. סימון List A–D ב־Band III Core I לפי פרסום המזכירות הפדגוגית.</p>
<p><b>התאמה לכיתות</b> – לפי טבלאות 4–5 בתוכנית הלימודים (<a href="https://education.biu.ac.il/sites/education/files/shared/curriculum2020Elementary.pdf" target="_blank" rel="noopener" lang="en">English Curriculum 2020</a>):</p>
<ul><li>ד׳: Pre-Band I (ג׳ / תחילת ד׳) ← Band I Core I (ד׳ – אמצע ה׳)</li><li>ה׳: Band I Core I / Core II (המעבר באמצע השנה)</li><li>ו׳: Band I Core II (אמצע ה׳ – סוף ו׳)</li>
<li>ז׳: Band II Core I · ח׳: Core I / Core II (המעבר באמצע השנה) · ט׳: Band II Core II</li>
<li>י׳–י״ב: 3 יח״ל = Band II (טבלה 5: "7-9, Bagrut 3 points") · 4 יח״ל = Band III Core I · 5 יח״ל = Band III Core I + II</li>
<li>ג׳: Pre-Band I (רשמי, שלב Pre-Basic User / Pre-A1) + אותיות וצלילים (נגזר)</li></ul>
<p><b>רמות נוספות (נגזר, לא של משרד החינוך)</b> – פירוט ב־<a href="https://github.com/dudidd-wq/english-quest/blob/main/LEVELS.md" target="_blank" rel="noopener">LEVELS.md</a>:</p>
<ul><li>א׳–ב׳ (התחלה מוקדמת, רשות – תוכנית הלימודים מתחילה בכיתה ג׳): 36 מילים בתמונות מתוך Pre-Band I + 26 אותיות עם מילה לדוגמה; משחקי האזנה ותמונות בלי קריאה.</li>
<li>אחרי י״ב (נגזר): <span lang="en">New Academic Word List (NAWL 1.2)</span> – Browne, Culligan &amp; Phillips, <a href="https://www.newgeneralservicelist.com/new-academic-word-list" target="_blank" rel="noopener" lang="en">newgeneralservicelist.com</a>, רישיון <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener" lang="en">CC BY-SA 4.0</a>.</li>
<li><span lang="en">New Computer Science Academic Word List (NCSAWL)</span> – Uba, Irudayasamy &amp; Hankins (2023), <a href="https://doi.org/10.5430/wjel.v13n5p319" target="_blank" rel="noopener" lang="en">doi:10.5430/wjel.v13n5p319</a>, רישיון <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" lang="en">CC BY 4.0</a>.</li>
<li>רמות C1 ו־C2: <span lang="en">Octanove Vocabulary Profile (C1/C2) – © Octanove Labs</span>, <a href="https://github.com/openlanguageprofiles/olp-en-cefrj" target="_blank" rel="noopener" lang="en">github.com/openlanguageprofiles/olp-en-cefrj</a>, רישיון <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener" lang="en">CC BY-SA 4.0</a>.</li>
<li><b>שינויים שעשינו:</b> בחרנו תת־רשימה (NAWL בלי תחיליות; NCSAWL: 433 מתוך 444 – הורדנו שמות מותגים ושני פריטים לא ברורים ואיחדנו זוגות שם עצם/פועל; הרשימה המלאה ב־SOURCES.md; C1/C2 לפי כלל שמתועד ב־LEVELS.md), הוספנו תרגום לעברית, משפטים, הקלטות וחלוקה לשלבים. הנתונים הנגזרים של acad, c1 ו־c2 מופצים ברישיון CC BY-SA 4.0, ושל tech ברישיון CC BY 4.0 – ראו <a href="https://github.com/dudidd-wq/english-quest/blob/main/LICENSE-DATA.md" target="_blank" rel="noopener">LICENSE-DATA.md</a>. השימוש ברשימות אינו מרמז על תמיכה של המחברים.</li></ul>
<p><b>מה נקבע על ידינו (נגזר, לא רשמי):</b> החלוקה לשלבים של כ־12 מילים והסדר שלהם; בכיתות ה׳ ו־ח׳ – הלומד בוחר מתי לעבור לרשימה השנייה; המשפטים, קטעי הקריאה והשיחות נכתבו במיוחד לתרגול ואינם טקסטים רשמיים; האימוג׳י והתרגום לעברית הותאמו לגיל.</p>
<p><b>הקלטות:</b> קולות מלאכותיים (ElevenLabs – Matilda באנגלית, Tomer בעברית) לכל המילים בכל הכיתות. ההקלטות נשמרות במכשיר בהדרגה, לפי הרשימה שבה משחקים; אפשר להוריד רשימה שלמה מראש בלשונית "אני". אם הקלטה לא נטענת, המילה מוקראת בקול הדפדפן ומסומנת 🤖.</p>
<p><b>🔒 פרטיות:</b> שום מידע לא יוצא מהמכשיר – אין שרת, אין חשבון ואין מעקב. ההתקדמות נשמרת בדפדפן (localStorage + עותק ב־IndexedDB), והגיבוי (קובץ, קוד או שמירה אוטומטית לקובץ) נשאר אצלכם; הוא נשלח לאן שהוא רק אם אתם בוחרים לשתף אותו בעצמכם. מקורות מלאים: <a href="https://github.com/dudidd-wq/english-quest/blob/main/SOURCES.md" target="_blank" rel="noopener">SOURCES.md</a>.</p>`;
function coverage() {
  const ae = D.words.filter(w => hasClip(w, 'en')).length, ah = D.words.filter(w => hasClip(w, 'he')).length;
  return h('p.small.muted', `ברשימה הנוכחית (${TRACKS[S.profile.track].band}): ${D.words.length} מילים · הקלטה באנגלית ${ae} · בעברית ${ah}${ae < D.words.length || ah < D.words.length ? ' · השאר 🤖 קול דפדפן' : ' ✅'}`);
}
async function offlineAll() {
  const urls = D.words.flatMap(w => [audioUrl(w, 'en'), audioUrl(w, 'he')]).filter(Boolean);
  if (!urls.length) return toast('🤖 לרשימה הזו אין הקלטות – קול הדפדפן עובד גם בלי אינטרנט', 3000);
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
  const ps = profiles();
  screen('parentv', h('div.shead.plain', h('button.icon-btn', { 'aria-label': 'חזרה', onclick: () => go('#/me') }, '→'), h('h2', 'אזור הורים ומורים')),
    ps.length > 1 && h('div.row', ps.map(p => h('button.btn.small' + (p.id === curProfileId() ? '.primary' : '.ghost'), { onclick: () => { if (p.id !== curProfileId()) { switchProfile(p.id); applyTheme(); parentView(); } } }, `${p.avatar} ${p.name} · ${gradeLabel(p)} · ${p.xp || 0} XP`))),
    h('p.muted', `${S.profile.avatar} ${S.profile.name} · ${gradeLabel(S.profile)} · ${tr.name} (`, en(tr.band), ')'),
    trackToggle(),
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
    h('div.wprogs', Array.from({ length: D.worlds }, (_, wi) => { const from = wi * PER_WORLD, to = Math.min(D.stages.length, from + PER_WORLD), c = Array.from({ length: to - from }, (_, k) => stageRec(from + k).cleared).filter(Boolean).length; const Wd = worldAt(wi);
      return h('div.wp', h('span', `${Wd.icon} ${Wd.name}`), h('div.pbar', h('div', { style: { width: c / (to - from) * 100 + '%' } })), h('small', `${c}/${to - from}`)); })),
    h('h3', 'המילים הקשות ביותר'),
    hard.length ? h('table.hard', h('tr', h('th', 'מילה'), h('th', 'פירוש'), h('th', '✓'), h('th', '✗')), hard.map(([w, r]) => h('tr', h('td', en(w.en)), h('td', w.he), h('td', r.ok), h('td', r.bad)))) : h('p.muted', 'עוד אין טעויות 🙂'),
    backupSection(),
    h('div.row', h('button.btn.small.danger', { onclick: async () => { if (confirm(`למחוק את ${S.profile.name} ואת כל ההתקדמות שלו/ה? אי אפשר לבטל.`) && confirm('בטוחים?')) { resetAll(); await B.afterDelete(); location.hash = ''; location.reload(); } } }, '🗑️ מחיקת השחקן')));
}

// ---------- router ----------
let lastPlay = null;
async function route(replay) {
  document.querySelectorAll('.confetti,.banner').forEach(el => el.remove());
  banners.length = 0;
  if (!S.profile) return onboarding(location.hash === '#/new' ? 0 : undefined);
  applyTheme();
  if (!gradeTracks(S.profile.grade, S.profile.level).includes(S.profile.track)) S.profile.track = gradeTracks(S.profile.grade, S.profile.level)[0];
  if (!D || D.track !== S.profile.track) await loadTrack(S.profile.track);
  const p = location.hash.replace(/^#\/?/, '').split('/');
  if (p[0] !== 'play' && p[0] !== 'review' && !(p[0] === 'study' && p[1])) { session?.kill(); session = null; }
  if (p[0] === 'study') { if (STUDY.has(p[1])) return playStudy(p[1], p[2]); return studyView(); }
  if (p[0] === 'stage' && D.stages[+p[1]]) return stageView(+p[1]);
  if (p[0] === 'play' && D.stages[+p[1]] && GAMES[p[2]] && (!STUDY.has(p[2]) || p[2] === 'forms')) return play(+p[1], p[2]);
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
B.init().then(r => { route(); if (r === 'restored') setTimeout(() => toast('🛟 ההתקדמות שוחזרה מהעותק השמור במכשיר', 3500), 300); else if (r === 'partial') restoreView(true); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

// ---------- backup & restore (local only) ----------
const agoHe = t => { const d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? 'היום' : d === 1 ? 'אתמול' : `לפני ${d} ימים`; };
const KIND_HE = { file: 'קובץ', code: 'קוד', auto: 'שמירה אוטומטית' };
function backupReminder() {
  const due = B.backupDue(); if (!due) return null;
  const box = h('div.backupnote', { role: 'note' },
    h('span', due.never ? '💾 להורים: עוד לא שמרתם גיבוי של ההתקדמות.' : `💾 להורים: הגיבוי האחרון נשמר ${agoHe(B.getMeta().lastBackup)}.`),
    h('button.btn.small.primary', { onclick: () => go('#/parent') }, 'לגיבוי'),
    h('button.btn.small.ghost', { onclick: () => { B.snoozeReminder(); box.remove(); } }, 'אחר כך'));
  return box;
}
function sheet(...kids) {
  const close = () => wrap.remove();
  const wrap = h('div.sheet', { role: 'dialog', 'aria-modal': 'true', onclick: e => e.target === wrap && close() }, h('div.sheetbox', ...kids));
  document.body.append(wrap); wrap.querySelector('button')?.focus(); return close;
}
function previewRestore(b) {
  const has = profiles().length > 0;
  const done = async mode => { close(); await B.applyBackup(b, mode); applyTheme(); applyBig(); toast('✅ ההתקדמות שוחזרה', 2600); location.hash = S.profile ? '#/map' : ''; route(); };
  const close = sheet(h('h3', '🛟 שחזור מגיבוי'),
    b.savedAt && h('p.muted.small', `הגיבוי נשמר ב־${new Date(b.savedAt).toLocaleDateString('he-IL')}`),
    h('ul.preview', b.profiles.map(p => h('li', `${p.state.profile.avatar} ${p.state.profile.name} · ${gradeLabel(p.state.profile)} · ${p.state.xp || 0} XP`))),
    has ? [h('button.btn.primary.wide', { onclick: () => done('replace') }, 'החלפת כל השחקנים במכשיר בגיבוי'),
      h('button.btn.ghost.wide', { onclick: () => done('merge') }, 'הוספה לשחקנים הקיימים (מיזוג)'),
      h('p.muted.small', 'במיזוג: שחקן שקיים גם במכשיר וגם בגיבוי – נשמרת הגרסה המתקדמת יותר.')]
      : h('button.btn.primary.wide', { onclick: () => done('replace') }, 'שחזור'),
    h('button.btn.ghost.wide', { onclick: () => close() }, 'ביטול'));
}
function restoreControls() {
  const file = h('input.restore-file', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: async e => {
    try { previewRestore(await B.readFile(e.target.files[0])); } catch (er) { toast('⚠️ ' + (er.message || 'הקובץ לא תקין'), 3500); } e.target.value = ''; } });
  const ta = h('textarea.codein', { rows: 3, dir: 'ltr', placeholder: 'EQ2-…', 'aria-label': 'קוד גיבוי', spellcheck: 'false' });
  return [h('button.btn.wide.restore-file-btn', { onclick: () => file.click() }, '📂 שחזור מקובץ גיבוי'), file,
    h('details.codebox', h('summary', '⌨️ שחזור מקוד גיבוי'), ta,
      h('button.btn.small.primary.restore-code-btn', { onclick: async () => { try { previewRestore(await B.readCode(ta.value)); } catch (er) { toast('⚠️ ' + (er.message || 'הקוד לא תקין'), 3500); } } }, 'שחזור מהקוד'))];
}
function restoreView(partial = false) {
  screen('onb', h('div.splash',
    h('div.logo-emoji', '🛟'), h('h2', 'שחזור התקדמות'),
    partial ? h('p.lead', 'נראה שחלק מהנתונים במכשיר נמחקו (למשל אחרי ניקוי הדפדפן). אם שמרתם גיבוי – אפשר לשחזר אותו כאן.')
      : h('p.muted', 'בחרו את קובץ הגיבוי ', en('english-quest-backup-….json'), ' או הדביקו את קוד הגיבוי.'),
    ...restoreControls(),
    h('p.muted.small', '🔒 השחזור נעשה כולו במכשיר – שום דבר לא נשלח לשרת.'),
    h('button.btn.ghost.wide', { onclick: () => { location.hash = S.profile ? '#/map' : ''; S.profile ? route() : onboarding(); } }, partial ? 'המשך בלי לשחזר' : '→ חזרה')));
}
function backupSection() {
  const m = B.getMeta(), box = h('div.backup');
  const status = h('p.small', m.lastBackup ? `גיבוי אחרון: ${agoHe(m.lastBackup)} (${KIND_HE[m.lastKind] || ''})` : 'עוד לא נשמר גיבוי.');
  const codeOut = h('div.codeout');
  const auto = h('div.autofile');
  const drawAuto = () => {
    if (!B.autoFileSupported()) return put(auto, null);
    const st = B.autoFileState();
    put(auto, h('p.small', '💾 שמירה אוטומטית לקובץ במחשב: ', h('b', st.state === 'on' ? `פעילה (${st.name})` : st.state === 'off' ? 'כבויה' : 'צריך לאשר שוב גישה לקובץ')),
      st.state === 'off' ? h('button.btn.small.ghost.autofile-on', { onclick: async () => { try { await B.enableAutoFile(); toast('✅ ההתקדמות תישמר אוטומטית לקובץ'); } catch (e) { if (e?.name !== 'AbortError') toast('⚠️ לא הצלחנו לפתוח קובץ'); } drawAuto(); } }, 'הפעלה – בחירת קובץ')
        : [st.state !== 'on' && h('button.btn.small.primary', { onclick: async () => { await B.resumeAutoFile(); drawAuto(); } }, '🔓 אישור גישה מחדש'),
          h('button.btn.small.ghost', { onclick: async () => { await B.disableAutoFile(); drawAuto(); } }, 'כיבוי')]);
  };
  const stor = h('p.small.muted');
  B.storageStatus().then(x => put(stor, `🛡️ עותק נוסף ב־IndexedDB: ${x.mirror ? 'קיים ✓' : 'עדיין לא'} · אחסון קבוע בדפדפן: ${x.persisted ? 'אושר ✓' : 'לא אושר (הדפדפן עלול למחוק נתונים כשחסר מקום)'}`));
  const undo = h('span');
  B.canUndo().then(ok => ok && put(undo, h('button.btn.small.ghost', { onclick: async () => { if (confirm('לבטל את השחזור האחרון ולחזור למצב שלפניו?') && await B.undoRestore()) { toast('↩️ בוטל'); location.reload(); } } }, '↩️ ביטול השחזור האחרון')));
  put(box, h('h3', '💾 גיבוי ושחזור'),
    h('p.small', `הגיבוי כולל את כל השחקנים במכשיר (${profiles().length}), את ההתקדמות ואת לוח החזרות. כדאי לגבות פעם בכמה ימים – ניקוי הדפדפן או החלפת מכשיר מוחקים את הנתונים.`),
    status,
    h('div.row', h('button.btn.small.primary.export-file', { onclick: async () => { const r = await B.exportFile(); if (r !== 'cancelled') { toast(r === 'shared' ? '✅ הגיבוי נשלח לאן שבחרתם' : '✅ קובץ הגיבוי ירד למכשיר'); backupRefresh(); } } }, '📤 שמירת קובץ גיבוי'),
      h('button.btn.small.ghost.make-code', { onclick: async () => { const c = await B.makeCode(); const ta = h('textarea.codeout-ta', { rows: 3, dir: 'ltr', readonly: true, 'aria-label': 'קוד הגיבוי' }); ta.value = c;
        put(codeOut, h('p.small', `קוד הגיבוי (${c.length} תווים) – שמרו אותו בפתקים או שלחו לעצמכם:`), ta,
          h('button.btn.small.ghost', { onclick: async () => { try { await navigator.clipboard.writeText(c); toast('📋 הועתק'); } catch { ta.select(); toast('סמנו והעתיקו'); } } }, '📋 העתקה')); backupRefresh(false); } }, '🔑 קוד גיבוי')),
    codeOut, auto, h('h4', 'שחזור'), ...restoreControls(), undo, stor,
    h('p.small.muted', '🔒 שום מידע לא נשלח לשרת: הקובץ והקוד נוצרים במכשיר ונשארים אצלכם.'));
  drawAuto();
  function backupRefresh() { const mm = B.getMeta(); put(status, mm.lastBackup ? `גיבוי אחרון: ${agoHe(mm.lastBackup)} (${KIND_HE[mm.lastKind] || ''})` : 'עוד לא נשמר גיבוי.'); }
  return [backupReminderParent(), box];
}
function backupReminderParent() { const due = B.backupDue(); return due ? h('div.backupnote', h('span', due.never ? '💾 עוד לא שמרתם גיבוי – זה לוקח 5 שניות.' : `💾 עברו ${due.days} ימים מהגיבוי האחרון.`)) : null; }
