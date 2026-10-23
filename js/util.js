// Small DOM + misc helpers
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/** h('div.cls#id', {attrs/on*}, ...children) */
export function h(tag, attrs, ...kids) {
  const m = tag.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0] === '.' ? el.classList.add(t.slice(1)) : (el.id = t.slice(1)));
  if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [p, x] of Object.entries(v)) p.startsWith('--') ? el.style.setProperty(p, x) : (el.style[p] = x);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = k => { if (k == null || k === false) return; if (Array.isArray(k)) k.forEach(add); else el.append(k instanceof Node ? k : document.createTextNode(String(k))); };
  kids.forEach(add);
  return el;
}
export function put(el, ...kids) { el.replaceChildren(...kids.flat(9).filter(k => k != null && k !== false)); return el; }
/** English text span (LTR, lang=en) */
export const en = (text, cls = '') => h('span.en' + (cls ? '.' + cls : ''), { lang: 'en', dir: 'ltr' }, text);
export function dayNum(d = new Date()) { return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
export function fmtDay(n) { const d = new Date(n * 86400000); return `${d.getUTCDate()}.${d.getUTCMonth() + 1}`; }
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const sample = (a, k) => shuffle(a).slice(0, k);
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const nWords = n => n === 1 ? 'מילה אחת' : `${n} מילים`;
let toastT;
export function toast(msg, ms = 2200) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}
export function download(name, text, type = 'application/json') {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const POS_HE = { n: 'שם עצם', v: 'פועל', adj: 'שם תואר', adv: 'תואר הפועל', prep: 'מילת יחס', pron: 'כינוי גוף', conj: 'מילת חיבור',
  det: 'מְיַדֵּעַ', exclam: 'מילת קריאה', 'aux v': 'פועל עזר', abbrev: 'קיצור' };
export const posTokens = pos => (pos || '').split(',').map(s => s.trim()).filter(Boolean);
export function posHe(pos) { const t = posTokens(pos); return t.length ? t.map(x => POS_HE[x] || x).join(' / ') : 'ביטוי'; }
export function posCat(pos) { const t = posTokens(pos)[0] || ''; return t === 'n' ? 'noun' : (t === 'v' || t === 'aux v') ? 'verb' : t === 'adj' ? 'adj' : 'other'; }
const heSenses = he => String(he).replace(/\([^)]*\)/g, ' ').replace(/[\u0591-\u05C7]/g, '').split(/[,/;]|\s+או\s+/).map(t => t.replace(/\.{2,}|…/g, '').trim()).filter(Boolean);
const enKey = en => String(en).toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
/** true if two entries could be confused as the same answer */
export function overlaps(w, x) {
  if (w.n === x.n || enKey(w.en) === enKey(x.en) || w.he.trim() === x.he.trim()) return true;
  const a = new Set(heSenses(w.he)); return heSenses(x.he).some(t => a.has(t));
}
