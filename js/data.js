// Word data per track (built by tools/build_data.py from the official MoE Lexical Band II list).
import { shuffle, overlaps, posCat } from './util.js';
export const TRACKS = {
  g7: { name: "כיתה ז'", band: 'Band II · Core I', desc: 'החלק הראשון של רשימת המילים הרשמית לחטיבת הביניים (כיתה ז׳ – אמצע ח׳)', emoji: '🚀' },
  g9: { name: "כיתה ט'", band: 'Band II · Core II', desc: 'החלק השני של רשימת המילים הרשמית לחטיבת הביניים (אמצע ח׳ – סוף ט׳)', emoji: '🛸' },
};
export const WORLDS = [
  { name: 'אי הקוקוסים', icon: '🌴', bg: ['#14b8a6', '#0ea5e9'], boss: '🦀', bossName: 'סרטן הענק' },
  { name: 'יער הלחשים', icon: '🌲', bg: ['#22c55e', '#15803d'], boss: '🐺', bossName: 'זאב הצללים' },
  { name: 'מדבר החולות', icon: '🏜️', bg: ['#f59e0b', '#ea580c'], boss: '🦂', bossName: 'עקרב הזהב' },
  { name: 'הרי השלג', icon: '🏔️', bg: ['#60a5fa', '#6366f1'], boss: '🦣', bossName: 'ממותת הקרח' },
  { name: 'הר הגעש', icon: '🌋', bg: ['#f97316', '#dc2626'], boss: '🦖', bossName: 'דינו הלבה' },
  { name: 'מעמקי הים', icon: '🌊', bg: ['#0284c7', '#1e3a8a'], boss: '🦈', bossName: 'כריש הסערה' },
  { name: 'ממלכת הטירות', icon: '🏰', bg: ['#a855f7', '#6d28d9'], boss: '🦇', bossName: 'עטלף הטירה' },
  { name: 'ארץ הממתקים', icon: '🍭', bg: ['#ec4899', '#f472b6'], boss: '🐊', bossName: 'תנין הסוכר' },
  { name: 'גלקסיית הכוכבים', icon: '🌌', bg: ['#4338ca', '#1e1b4b'], boss: '👾', bossName: 'חייזר הכוכבים' },
  { name: 'עיר הרובוטים', icon: '🏙️', bg: ['#64748b', '#0f766e'], boss: '🤖', bossName: 'מגה־רובוט' },
  { name: 'מערת הדרקון', icon: '🐉', bg: ['#b91c1c', '#7c2d12'], boss: '🐲', bossName: 'מלך הדרקונים' },
];
export const PER_WORLD = 8;
export let D = null;           // current track data
const cache = {};
export async function loadTrack(track) {
  if (!cache[track]) {
    const r = await fetch(`data/${track}.json`); const d = await r.json();
    d.byN = new Map(d.words.map(w => [w.n, w]));
    d.stageOf = new Map(); d.stages.forEach((b, i) => b.forEach(n => d.stageOf.set(n, i)));
    d.worlds = Math.ceil(d.stages.length / PER_WORLD);
    cache[track] = d;
  }
  return (D = cache[track]);
}
export const W = n => D.byN.get(+n);
export const stageWords = i => D.stages[i].map(W);
export const worldOf = i => Math.floor(i / PER_WORLD);
export const world = i => WORLDS[worldOf(i) % WORLDS.length];

/** k wrong options for word w (field = 'he' | 'en'), same part of speech first, never a synonym/duplicate */
export function distractors(w, k = 3, field = 'he', prefer = []) {
  const out = [], seen = new Set([w[field].trim()]);
  const okx = x => x && !seen.has(x[field].trim()) && !overlaps(w, x) && !out.some(y => overlaps(x, y));
  const cat = posCat(w.pos), si = D.stageOf.get(w.n) ?? 0;
  const near = D.stages.slice(Math.max(0, si - 6), si + 4).flat().map(W);
  const pools = [shuffle(prefer).filter(x => posCat(x.pos) === cat), shuffle(near).filter(x => posCat(x.pos) === cat), shuffle(prefer), shuffle(near), shuffle(D.words)];
  for (const p of pools) for (const x of p) { if (out.length >= k) return out; if (okx(x)) { out.push(x); seen.add(x[field].trim()); } }
  return out;
}
/** sentences for a stage; padded with earlier-stage sentences (spaced review) */
export function stageSentences(i, want = 6) {
  const own = shuffle(D.stages[i].flatMap(n => (D.sent[n] || []).map(s => ({ ...s, n }))));
  const prev = shuffle(D.stages.slice(Math.max(0, i - 8), i).flat().flatMap(n => (D.sent[n] || []).map(s => ({ ...s, n }))));
  const next = shuffle(D.stages.slice(i + 1, i + 3).flat().flatMap(n => (D.sent[n] || []).map(s => ({ ...s, n }))));
  return [...own, ...prev, ...next].slice(0, Math.max(want, Math.min(own.length, 8)));
}
/** a clean single word for the letter-scramble game, else null */
export function scrambleWord(w) {
  const first = w.en.split('/')[0].trim();
  return /^[a-z]{3,11}$/i.test(first) ? first.toLowerCase() : null;
}
/** short phrase for word-tile ordering (2–4 plain words), else null */
export function phraseTiles(w) {
  const t = w.en.trim();
  if (/[\/()…,;]|\b(sb|sth|etc)\b/.test(t)) return null;
  const parts = t.split(/\s+/); return parts.length >= 2 && parts.length <= 4 && parts.every(p => /^[a-z'?!.-]+$/i.test(p)) ? parts : null;
}
