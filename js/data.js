// Word data per track (built by tools/build_all.py from the official MoE Lexical Bands, Curriculum 2020).
import { shuffle, overlaps, posCat } from './util.js';
/** One track = one official core list. */
export const TRACKS = {
  pre1: { name: 'מילים ראשונות', band: 'Pre-Band I', when: "כיתה ג׳ / תחילת ד׳", emoji: '🌱', file: 'LexicalBand1.xlsx' },
  b1c1: { name: 'Band I – חלק 1', band: 'Band I · Core I', when: "ד׳ – אמצע ה׳", emoji: '🐣', file: 'LexicalBand1.xlsx' },
  b1c2: { name: 'Band I – חלק 2', band: 'Band I · Core II', when: "אמצע ה׳ – סוף ו׳", emoji: '🦋', file: 'LexicalBand1.xlsx' },
  g7:   { name: 'Band II – חלק 1', band: 'Band II · Core I', when: "ז׳ – אמצע ח׳", emoji: '🚀', file: 'LexicalBand2.xlsx' },
  g9:   { name: 'Band II – חלק 2', band: 'Band II · Core II', when: "אמצע ח׳ – סוף ט׳", emoji: '🛸', file: 'LexicalBand2.xlsx' },
  b3c1: { name: 'Band III – Core I', band: 'Band III · Core I', when: "י׳–י״ב · 4 ו־5 יח״ל", emoji: '🎓', file: 'LexicalBand3.xlsx' },
  b3c2: { name: 'Band III – Core II', band: 'Band III · Core II', when: "י׳–י״ב · 5 יח״ל", emoji: '🏛️', file: 'LexicalBand3.xlsx' },
  // derived (not official MoE lists) – see LEVELS.md / SOURCES.md
  early:{ name: 'מילים בתמונות', band: 'תמונות ומילים', when: "א׳–ב׳ · התחלה מוקדמת (רשות)", emoji: '🧸', derived: 'תת־רשימה של Pre-Band I (הבחירה שלנו)' },
  abc:  { name: 'אותיות וצלילים', band: 'ABC', when: "א׳–ג׳", emoji: '🔤', derived: 'נכתב לאפליקציה', letters: true },
  acad: { name: 'אקדמי / פסיכומטרי', band: 'Academic (NAWL)', when: "אחרי י״ב", emoji: '🎓', derived: 'NAWL 1.2 · CC BY-SA 4.0' },
  tech: { name: 'אנגלית טכנולוגית', band: 'Tech (NCSAWL)', when: "אחרי י״ב", emoji: '💻', derived: 'NCSAWL · CC BY 4.0' },
  c1:   { name: 'מתקדמים (C1)', band: 'Advanced (C1)', when: "אחרי י״ב", emoji: '🔷', derived: 'Octanove C1 · CC BY-SA 4.0' },
  c2:   { name: 'קרוב לשפת אם', band: 'Near-native (C2)', when: "אחרי י״ב", emoji: '💎', derived: 'Octanove C2 · CC BY-SA 4.0' },
};
/** Grade → lists, per English Curriculum 2020 Tables 4–5 (see SOURCES.md). */
export const GRADES = { 1: "א׳", 2: "ב׳", 3: "ג׳", 4: "ד׳", 5: "ה׳", 6: "ו׳", 7: "ז׳", 8: "ח׳", 9: "ט׳", 10: "י׳", 11: "י״א", 12: "י״ב", 13: "אחרי י״ב" };
export const GRADE_GROUPS = [['יסודי · א׳–ב׳ התחלה מוקדמת (רשות)', [1, 2, 3, 4, 5, 6]], ['חטיבת ביניים', [7, 8, 9]], ['תיכון', [10, 11, 12]], ['אחרי התיכון', [13]]];
export const LEVELS = { 3: '3 יח״ל', 4: '4 יח״ל', 5: '5 יח״ל', acad: 'אקדמי / פסיכומטרי', tech: 'אנגלית טכנולוגית', c1: 'מתקדמים (C1)', c2: 'קרוב לשפת אם' };
export const ADV = ['acad', 'tech', 'c1', 'c2'];
export const levelsFor = grade => +grade === 13 ? ADV : +grade >= 10 ? [3, 4, 5] : [];
export const defaultLevel = grade => +grade === 13 ? 'acad' : +grade >= 10 ? 4 : undefined;
export const validLevel = (grade, lv) => levelsFor(grade).includes(lv) ? lv : defaultLevel(grade);
export const isEarly = grade => +grade <= 2;
export function gradeTracks(grade, level = defaultLevel(grade)) {
  grade = +grade;
  if (grade === 13) { const lv = ADV.includes(level) ? level : 'acad'; return [lv, ...ADV.filter(x => x !== lv)]; }
  if (grade <= 2) return ['early', 'abc'];
  if (grade === 3) return ['pre1', 'abc'];
  if (grade === 4) return ['pre1', 'b1c1'];
  if (grade === 5) return ['b1c1', 'b1c2'];
  if (grade === 6) return ['b1c2'];
  if (grade === 7) return ['g7'];
  if (grade === 8) return ['g7', 'g9'];
  if (grade === 9) return ['g9'];
  return +level === 3 ? ['g7', 'g9'] : +level === 5 ? ['b3c1', 'b3c2'] : ['b3c1'];
}
export const themeOf = grade => +grade <= 6 ? 'kids' : +grade <= 9 ? 'arcade' : 'bagrut';
export const gradeLabel = p => p ? (+p.grade === 13 ? GRADES[13] : `כיתה ${GRADES[p.grade] || ''}`) + (+p.grade >= 10 ? ` · ${LEVELS[p.level] || ''}` : '') : '';
export const WORLDS = [
  { name: 'אי הקוקוסים', icon: '🌴', bg: ['#14b8a6', '#0ea5e9'], boss: '🦀', bossName: 'סרטן הענק', story: 'גלים מביאים מילים חדשות — כבשו את החוף!' },
  { name: 'יער הלחשים', icon: '🌲', bg: ['#22c55e', '#15803d'], boss: '🐺', bossName: 'זאב הצללים', story: 'העצים לוחשים באנגלית. תקשיבו היטב…' },
  { name: 'מדבר החולות', icon: '🏜️', bg: ['#f59e0b', '#ea580c'], boss: '🦂', bossName: 'עקרב הזהב', story: 'חול לוהט, מילים נדירות. מי ישרוד?' },
  { name: 'הרי השלג', icon: '🏔️', bg: ['#60a5fa', '#6366f1'], boss: '🦣', bossName: 'ממותת הקרח', story: 'הקפיאו את השגיאות לפני שהן קופאות אתכם.' },
  { name: 'הר הגעש', icon: '🌋', bg: ['#f97316', '#dc2626'], boss: '🦖', bossName: 'דינו הלבה', story: 'הלבה רותחת — רק תשובות מהירות מצילות!' },
  { name: 'מעמקי הים', icon: '🌊', bg: ['#0284c7', '#1e3a8a'], boss: '🦈', bossName: 'כריש הסערה', story: 'צללו לעומק אוצר המילים.' },
  { name: 'ממלכת הטירות', icon: '🏰', bg: ['#a855f7', '#6d28d9'], boss: '🦇', bossName: 'עטלף הטירה', story: 'המלך דורש אוצר מילים מלכותי.' },
  { name: 'ארץ הממתקים', icon: '🍭', bg: ['#ec4899', '#f472b6'], boss: '🐊', bossName: 'תנין הסוכר', story: 'מתוק… אבל הבוס חמוץ. היזהרו!' },
  { name: 'גלקסיית הכוכבים', icon: '🌌', bg: ['#4338ca', '#1e1b4b'], boss: '👾', bossName: 'חייזר הכוכבים', story: 'שיגרו מילים לחלל החיצון.' },
  { name: 'עיר הרובוטים', icon: '🏙️', bg: ['#64748b', '#0f766e'], boss: '🤖', bossName: 'מגה־רובוט', story: 'תכנתו את המוח שלכם באנגלית.' },
  { name: 'מערת הדרקון', icon: '🐉', bg: ['#b91c1c', '#7c2d12'], boss: '🐲', bossName: 'מלך הדרקונים', story: 'הדרקון שומר על המילים האחרונות.' },
];
/** Adult skin for the post-12 tracks (review #1: no coconut islands / giant crabs for university students). */
export const WORLDS_ADULT = [
  { name: 'יסודות', icon: '📘', bg: ['#334155', '#1e293b'], boss: '📝', bossName: 'בוחן מסכם', story: 'מילים שחוזרות בכל מאמר ובכל קורס.' },
  { name: 'ספריית המחקר', icon: '📚', bg: ['#3f3f46', '#27272a'], boss: '📜', bossName: 'מאמר מדעי', story: 'קוראים תקצירים בלי מילון.' },
  { name: 'מעבדה', icon: '🔬', bg: ['#155e75', '#164e63'], boss: '🧪', bossName: 'ניסוי מסכם', story: 'הגדרות מדויקות, תוצאות מדויקות.' },
  { name: 'חדר הסמינר', icon: '🏛️', bg: ['#4c1d95', '#2e1065'], boss: '🎓', bossName: 'עבודת סמינר', story: 'לנסח טיעון באנגלית אקדמית.' },
  { name: 'מרכז הנתונים', icon: '🗄️', bg: ['#1e3a8a', '#172554'], boss: '🖥️', bossName: 'שרת ראשי', story: 'מונחים מתיעוד טכני ומקוד אמיתי.' },
  { name: 'כנס בינלאומי', icon: '🌐', bg: ['#065f46', '#064e3b'], boss: '🎤', bossName: 'הרצאת מליאה', story: 'להבין דוברים מכל העולם.' },
  { name: 'מערכת העיתון', icon: '📰', bg: ['#7c2d12', '#431407'], boss: '🖋️', bossName: 'מאמר מערכת', story: 'אוצר מילים של עיתונות איכות.' },
  { name: 'ארכיון', icon: '🗂️', bg: ['#57534e', '#292524'], boss: '📖', bossName: 'כתב יד נדיר', story: 'מילים נדירות ומדויקות.' },
];
export const isAdultTrack = t => ['acad', 'tech', 'c1', 'c2'].includes(t);
export const worldsFor = t => isAdultTrack(t) ? WORLDS_ADULT : WORLDS;
export const PER_WORLD = 8;
export let D = null;           // current track data
let onTrackLoad = null;
export const setOnTrackLoad = f => { onTrackLoad = f; };
const cache = {};
export const loaded = t => cache[t];
export async function loadTrack(track) {
  if (!cache[track]) {
    const r = await fetch(`data/${track}.json`); const d = await r.json();
    d.byN = new Map(d.words.map(w => [w.n, w]));
    d.stageOf = new Map(); d.stages.forEach((b, i) => b.forEach(n => d.stageOf.set(n, i)));
    d.worlds = Math.ceil(d.stages.length / PER_WORLD);
    d.read ||= []; d.talk ||= [];
    cache[track] = d;
  }
  onTrackLoad?.(cache[track]);
  return (D = cache[track]);
}
export const W = n => D.byN.get(+n);
export const stageWords = i => D.stages[i].map(W);
export const worldOf = i => Math.floor(i / PER_WORLD);
export const world = i => { const L = worldsFor(D && D.track); return L[worldOf(i) % L.length]; };

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
