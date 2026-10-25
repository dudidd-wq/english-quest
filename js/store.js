import { dayNum } from './util.js';
// Multiple sibling profiles: an index + one state object per profile. englishQuest.v1 (v1/v2 single profile) is migrated, never deleted.
const IDX = 'englishQuest.profiles', OLD = 'englishQuest.v1', PK = id => 'englishQuest.p.' + id;
const fresh = () => ({
  v: 1, profile: null, xp: 0, coins: 0, owned: [], powers: { hint: 2, heart: 1, freeze: 0 },
  settings: { sfx: true, voice: true, goal: 150, big: false, juice: true },
  tracks: {}, days: {}, streak: { cur: 0, best: 0, last: null }, ach: {},
  stats: { answers: 0, correct: 0, bestCombo: 0, games: 0, bossWins: 0, perfectBoss: 0, goals: 0, reviews: 0, buys: 0, blitzBest: 0, missions: 0 },
  daily: { day: null, kind: null, target: 12, progress: 0, done: false },
  cosmetics: { aura: 'none', title: '', ownedAuras: ['none'], ownedTitles: [''] },
  rival: { name: 'צל_המילים', bestCombo: 7, bestBlitz: 35 },
});
const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
function loadIdx() {
  const x = read(IDX); if (x && Array.isArray(x.list) && (x.list.length || x.migrated)) return x;
  const idx = { list: [], cur: null, migrated: 0 };
  const old = read(OLD);
  if (old && old.v === 1 && old.profile) {            // migrate the single v1/v2 profile → p1
    const p = old.profile; p.grade ||= p.track === 'g9' ? 9 : 7; p.level ||= 4;
    write(PK('p1'), old); idx.list.push({ id: 'p1', name: p.name, avatar: p.avatar, grade: p.grade }); idx.cur = 'p1';
  }
  idx.migrated = Date.now();             // checked once: a deleted migrated profile is never resurrected
  write(IDX, idx); return idx;
}
const idx = loadIdx();
export let S = load();
function load() {
  const s = idx.cur && read(PK(idx.cur));
  if (s && s.v === 1) { const st = merge(fresh(), s); if (st.profile && !st.profile.grade) st.profile.grade = st.profile.track === 'g9' ? 9 : 7; return st; }
  idx.cur = null; return fresh();
}
function merge(a, b) {
  for (const k in b) a[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k];
  return a;
}
let saveT;
export function save(now = false) {
  clearTimeout(saveT);
  const w = () => {
    if (!idx.cur || !S.profile) return;
    write(PK(idx.cur), S);
    const e = idx.list.find(x => x.id === idx.cur); if (e) { e.name = S.profile.name; e.avatar = S.profile.avatar; e.grade = S.profile.grade; e.level = S.profile.level; e.xp = S.xp; }
    write(IDX, idx);
  };
  now ? w() : (saveT = setTimeout(w, 150));
}
addEventListener('pagehide', () => save(true));
addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save(true));
export function replaceState(obj) { const p = S.profile; S = merge(fresh(), obj); S.profile ||= p; S.profile.grade ||= S.profile.track === 'g9' ? 9 : 7; save(true); }
export const exportState = () => JSON.stringify(S, null, 1);
// ---- profiles ----
export const profiles = () => idx.list;
export const curProfileId = () => idx.cur;
export const migratedAt = () => idx.migrated;
export function createProfile(profile) {
  save(true);
  const id = 'p' + Date.now().toString(36);
  S = fresh(); S.profile = profile; idx.cur = id;
  idx.list.push({ id, name: profile.name, avatar: profile.avatar, grade: profile.grade, level: profile.level });
  save(true); return id;
}
export function switchProfile(id) { save(true); if (!idx.list.some(x => x.id === id)) return; idx.cur = id; write(IDX, idx); S = load(); }
export function leaveProfile() { save(true); idx.cur = null; write(IDX, idx); S = fresh(); }
export function deleteProfile(id = idx.cur) {
  idx.list = idx.list.filter(x => x.id !== id); try { localStorage.removeItem(PK(id)); } catch {}
  if (idx.cur === id) { idx.cur = null; S = fresh(); }
  write(IDX, idx);
}
export function resetAll() { deleteProfile(idx.cur); }

const listeners = [];
export const on = fn => listeners.push(fn);
const emit = (type, data) => listeners.forEach(f => f(type, data));

export function T(track = S.profile?.track) { return S.tracks[track] ||= { stages: {}, words: {}, ms: 0 }; }
export function stageRec(i, track) { return T(track).stages[i] ||= { games: {}, stars: 0, cleared: false, plays: 0 }; }
export function today() { const k = dayNum(); return S.days[k] ||= { xp: 0, ans: 0, ok: 0, ms: 0, games: 0 }; }

const IV = [0, 1, 2, 4, 7, 14, 30];
export function wordRec(n) { return T().words[n] ||= { b: 0, due: dayNum(), ok: 0, bad: 0, seen: dayNum() }; }
export function answer(n, ok) {
  const r = wordRec(n), d = today();
  S.stats.answers++; d.ans++;
  if (ok) { r.ok++; S.stats.correct++; d.ok++; if (r.due <= dayNum() || r.b === 0) { r.b = Math.min(6, r.b + 1); r.due = dayNum() + IV[r.b]; } }
  else { r.bad++; r.b = Math.min(r.b, 1); r.due = dayNum(); }
  r.last = Date.now(); save();
}
export const isMastered = r => r && r.b >= 4;
export function dueWords() {
  const t = dayNum();
  return Object.entries(T().words).filter(([, r]) => r.due <= t && (r.bad > 0 || r.b > 0))
    .sort((a, b) => a[1].b - b[1].b || a[1].due - b[1].due).map(([n]) => +n);
}

export const levelXp = L => 50 * L * (L + 1) - 100;
export function level(xp = S.xp) { let L = 1; while (xp >= levelXp(L + 1)) L++; return L; }
export const comboMult = c => c >= 12 ? 4 : c >= 8 ? 3 : c >= 4 ? 2 : c >= 2 ? 1.5 : 1;
export function gainXp(x) {
  const before = level(), d = today(), goalBefore = d.xp >= S.settings.goal;
  S.xp += x; d.xp += x; save();
  if (level() > before) emit('level', level());
  if (!goalBefore && d.xp >= S.settings.goal) { S.stats.goals++; S.coins += 25; emit('goal'); }
}
export function gainCoins(c) { S.coins += c; save(); }
export function touchStreak() {
  const d = dayNum(), last = S.streak.last;
  if (last === d) return;
  if (last === d - 1) S.streak.cur++;
  else if (last === d - 2 && S.powers.freeze > 0) { S.powers.freeze--; S.streak.cur++; emit('freeze'); }
  else S.streak.cur = 1;
  S.streak.best = Math.max(S.streak.best, S.streak.cur);
  S.streak.last = d; save();
  if (S.streak.cur >= 3) emit('streak', S.streak.cur);
}
export function streakNow() { const s = S.streak, t = dayNum(); return s.last != null && t - s.last <= 1 ? s.cur : 0; }

const DAILY_KINDS = [
  ['blitz_ok', 'בליץ: 12 תשובות נכונות', 12],
  ['combo', 'הגיעו לקומבו ×8', 8],
  ['boss', 'נצחו בוס אחד', 1],
  ['mission', 'סיימו 2 משימות', 2],
  ['perfect', '10 תשובות ברצף בלי טעות', 10],
];
export function ensureDaily() {
  const d = dayNum();
  if (S.daily.day === d) return S.daily;
  const pick = DAILY_KINDS[d % DAILY_KINDS.length];
  S.daily = { day: d, kind: pick[0], label: pick[1], target: pick[2], progress: 0, done: false };
  save(); return S.daily;
}
export function bumpDaily(kind, n = 1) {
  const d = ensureDaily();
  if (d.done || d.kind !== kind) return;
  d.progress = Math.min(d.target, d.progress + n);
  if (d.progress >= d.target) { d.done = true; S.coins += 40; emit('daily'); }
  save();
}
export function beatRival(field, value) {
  if (value > (S.rival[field] || 0)) {
    const old = S.rival[field]; S.rival[field] = value; save();
    if (value > old) emit('rival', { field, value });
  }
}

export const AURAS = [
  ['none', 'בלי הילה', 0],
  ['cyan', 'הילה ציאן', 80],
  ['magenta', 'הילה מג׳נטה', 80],
  ['lime', 'הילה ליים', 100],
  ['gold', 'הילה זהב', 180],
  ['fire', 'הילה אש', 220],
];
export const TITLES = [
  ['', 'בלי תואר', 0],
  ['צייד מילים', 'צייד מילים', 60],
  ['נינג׳ה אוצר', 'נינג׳ה אוצר', 100],
  ['מלך הבוסים', 'מלך הבוסים', 150],
  ['אגדה', 'אגדה', 300],
];

export const ACH = [
  ['first', '🐣', 'צעד ראשון', 'סיימו משחק ראשון'],
  ['boss1', '⚔️', 'מנצחי בוסים', 'נצחו בוס אחד'],
  ['boss10', '🏆', 'צייד בוסים', 'נצחו 10 בוסים'],
  ['perfect', '💎', 'מושלם!', 'נצחו בוס בלי לאבד לב'],
  ['combo10', '🔥', 'רצף לוהט', 'קומבו של 10 תשובות'],
  ['combo25', '☄️', 'בלתי ניתנים לעצירה', 'קומבו של 25 תשובות'],
  ['streak3', '📅', '3 ימים ברצף', 'שחקו 3 ימים ברציפות'],
  ['streak7', '🗓️', 'שבוע שלם', 'שחקו 7 ימים ברציפות'],
  ['words50', '📚', '50 מילים', 'פגשו 50 מילים'],
  ['words200', '🧠', '200 מילים', 'פגשו 200 מילים'],
  ['master50', '🎓', 'אלופי מילים', '50 מילים בשליטה מלאה'],
  ['world1', '🗺️', 'עולם ראשון', 'סיימו את כל השלבים בעולם הראשון'],
  ['goal1', '🎯', 'יעד יומי', 'הגיעו ליעד היומי'],
  ['goal5', '🏹', 'יעד ×5', 'הגיעו ליעד היומי 5 פעמים'],
  ['speedy', '⚡', 'ברק', 'סיימו התאמה עם 20+ שניות בשעון'],
  ['memory', '🃏', 'זיכרון של פיל', 'סיימו זיכרון ב־10 תורות או פחות'],
  ['ears', '🎧', 'אוזניים חדות', '10 מתוך 10 בהאזנה'],
  ['review', '🔁', 'גיבורי חזרה', 'השלימו חזרה יומית'],
  ['shop', '🛍️', 'קנייה ראשונה', 'קנו משהו בחנות'],
  ['blitz50', '💥', 'בליץ מטורף', 'הגיעו ל־50 נקודות בבליץ'],
  ['daily', '☀️', 'אתגר היום', 'סיימו אתגר יומי'],
];
export function unlock(id) { if (S.ach[id]) return; S.ach[id] = dayNum(); S.coins += 15; save(); emit('ach', ACH.find(a => a[0] === id)); }
export function checkAch(extra = {}) {
  const st = S.stats, words = Object.keys(T().words).length, mast = Object.values(T().words).filter(isMastered).length;
  if (st.games >= 1) unlock('first');
  if (st.bossWins >= 1) unlock('boss1');
  if (st.bossWins >= 10) unlock('boss10');
  if (st.perfectBoss >= 1) unlock('perfect');
  if (st.bestCombo >= 10) unlock('combo10');
  if (st.bestCombo >= 25) unlock('combo25');
  if (S.streak.cur >= 3) unlock('streak3');
  if (S.streak.cur >= 7) unlock('streak7');
  if (words >= 50) unlock('words50');
  if (words >= 200) unlock('words200');
  if (mast >= 50) unlock('master50');
  if (st.goals >= 1) unlock('goal1');
  if (st.goals >= 5) unlock('goal5');
  if (st.reviews >= 1) unlock('review');
  if (st.buys >= 1) unlock('shop');
  if (st.blitzBest >= 50) unlock('blitz50');
  if (S.daily?.done) unlock('daily');
  for (const k in extra) if (extra[k]) unlock(k);
}
