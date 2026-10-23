// Progress lives in localStorage (key is unique to this app – band2-study shares the github.io origin).
import { dayNum } from './util.js';
const KEY = 'englishQuest.v1';
const fresh = () => ({
  v: 1, profile: null, xp: 0, coins: 0, owned: [], powers: { hint: 2, heart: 1, freeze: 0 },
  settings: { sfx: true, voice: true, goal: 150 },
  tracks: {}, days: {}, streak: { cur: 0, best: 0, last: null }, ach: {},
  stats: { answers: 0, correct: 0, bestCombo: 0, games: 0, bossWins: 0, perfectBoss: 0, goals: 0, reviews: 0, buys: 0 },
});
export let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return merge(fresh(), s); } catch {}
  return fresh();
}
function merge(a, b) { for (const k in b) a[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return a; }
let saveT;
export function save(now = false) { clearTimeout(saveT); const w = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }; now ? w() : (saveT = setTimeout(w, 150)); }
addEventListener('pagehide', () => save(true));
addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save(true));
export function replaceState(obj) { S = merge(fresh(), obj); save(true); }
export function resetAll() { S = fresh(); save(true); }
export const exportState = () => JSON.stringify(S, null, 1);

const listeners = [];
export const on = fn => listeners.push(fn);
const emit = (type, data) => listeners.forEach(f => f(type, data));

export function T(track = S.profile?.track) { return S.tracks[track] ||= { stages: {}, words: {}, ms: 0 }; }
export function stageRec(i, track) { return T(track).stages[i] ||= { games: {}, stars: 0, cleared: false, plays: 0 }; }
export function today() { const k = dayNum(); return S.days[k] ||= { xp: 0, ans: 0, ok: 0, ms: 0, games: 0 }; }

// ---- Leitner spaced repetition: box 0..6, interval (days) by box
const IV = [0, 1, 2, 4, 7, 14, 30];
export function wordRec(n) { return T().words[n] ||= { b: 0, due: dayNum(), ok: 0, bad: 0, seen: dayNum() }; }
export function answer(n, ok) {
  const r = wordRec(n), d = today();
  S.stats.answers++; d.ans++;
  if (ok) { r.ok++; S.stats.correct++; d.ok++; if (r.due <= dayNum() || r.b === 0) { r.b = Math.min(6, r.b + 1); r.due = dayNum() + IV[r.b]; } }
  else { r.bad++; r.b = Math.min(r.b, 1); r.due = dayNum(); }
  r.last = Date.now();
}
export const isMastered = r => r && r.b >= 4;
export function dueWords() { const t = dayNum(); return Object.entries(T().words).filter(([, r]) => r.due <= t && (r.bad > 0 || r.b > 0)).sort((a, b) => a[1].b - b[1].b || a[1].due - b[1].due).map(([n]) => +n); }

// ---- XP, levels, coins, streak, daily goal
export const levelXp = L => 50 * L * (L + 1) - 100;           // xp needed to reach level L (L1 = 0)
export function level(xp = S.xp) { let L = 1; while (xp >= levelXp(L + 1)) L++; return L; }
export const comboMult = c => c >= 10 ? 4 : c >= 6 ? 3 : c >= 3 ? 2 : 1;
export function gainXp(x) {
  const before = level(), d = today(), goalBefore = d.xp >= S.settings.goal;
  S.xp += x; d.xp += x;
  if (level() > before) emit('level', level());
  if (!goalBefore && d.xp >= S.settings.goal) { S.stats.goals++; S.coins += 20; emit('goal'); }
  save();
}
export function gainCoins(c) { S.coins += c; save(); }
export function touchStreak() {
  const t = dayNum(), s = S.streak; if (s.last === t) return;
  if (s.last === t - 1) s.cur++;
  else if (s.last != null && t - s.last === 2 && S.powers.freeze > 0) { S.powers.freeze--; s.cur++; emit('freeze'); }
  else s.cur = 1;
  s.last = t; s.best = Math.max(s.best, s.cur); save();
}
export function streakNow() { const s = S.streak, t = dayNum(); return s.last != null && t - s.last <= 1 ? s.cur : 0; }

// ---- achievements
export const ACH = [
  ['first', '🐣', 'צעד ראשון', 'סיימו משחק ראשון'],
  ['boss1', '⚔️', 'מנצחי בוסים', 'נצחו בוס ראשון'],
  ['boss10', '🏅', 'צייד בוסים', 'נצחו 10 בוסים'],
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
  ['speedy', '⚡', 'ברק', 'סיימו התאמה מהירה עם 20+ שניות בשעון'],
  ['memory', '🃏', 'זיכרון של פיל', 'סיימו משחק זיכרון ב־10 תורות או פחות'],
  ['ears', '🎧', 'אוזניים חדות', '10 מתוך 10 במשחק ההאזנה'],
  ['review', '🔁', 'גיבורי חזרה', 'השלימו חזרה יומית'],
  ['shop', '🛍️', 'קנייה ראשונה', 'קנו משהו בחנות'],
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
  for (const k in extra) if (extra[k]) unlock(k);
}
