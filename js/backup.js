// Local-only persistence: IndexedDB mirror, storage.persist(), backup file (share / download), backup code, optional
// auto-save file (File System Access API). NOTHING here talks to a server – there is no fetch/XHR/beacon in this file.
import { snapshot, restoreProfiles, profiles, onPersist, missingStates } from './store.js';
export const SCHEMA = 2;
const APP = 'english-quest', META = 'englishQuest.meta', MAX_BYTES = 5e6;
const TRACK_KEYS = ['pre1', 'b1c1', 'b1c2', 'g7', 'g9', 'b3c1', 'b3c2'];

// ---------- tiny IndexedDB key/value ----------
let dbp;
const db = () => dbp ||= new Promise((res, rej) => {
  if (!('indexedDB' in self)) return rej(new Error('no idb'));
  const r = indexedDB.open('englishQuest', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  setTimeout(() => rej(new Error('idb timeout')), 2500);              // never let a stuck IndexedDB block the app start
  r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; res(d); }; r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
}).catch(e => { dbp = null; throw e; });
const tx = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction('kv', mode); const q = fn(t.objectStore('kv')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
export const idbGet = k => tx('readonly', s => s.get(k)).catch(() => undefined);
const idbSet = (k, v) => tx('readwrite', s => s.put(v, k)).then(() => true).catch(() => false);
const idbDel = k => tx('readwrite', s => s.delete(k)).catch(() => {});

// ---------- meta (last backup time etc.), kept in localStorage + IndexedDB ----------
let meta = (() => { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch { return {}; } })();
export const getMeta = () => meta;
function setMeta(patch) { meta = { ...meta, ...patch }; try { localStorage.setItem(META, JSON.stringify(meta)); } catch {} idbSet('meta', meta); }
const markBackup = kind => setMeta({ lastBackup: Date.now(), lastKind: kind });

// ---------- sanitising (imports are data only: JSON.parse + whitelist copy; nothing is ever evaluated) ----------
const BAD_KEY = /^(__proto__|constructor|prototype)$/;
function clean(v, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 300000 || depth > 8) throw new Error('too big');
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(-1e12, Math.min(1e12, v)) : 0;
  if (typeof v === 'string') return v.replace(/[<>]/g, '').slice(0, 60);
  if (Array.isArray(v)) return v.slice(0, 500).map(x => clean(x, depth + 1, budget));
  if (typeof v === 'object') {
    const o = Object.create(null);
    for (const k of Object.keys(v)) { if (BAD_KEY.test(k) || !/^[\w-]{1,32}$/.test(k)) continue; o[k] = clean(v[k], depth + 1, budget); }
    return Object.assign({}, o);
  }
  return null;
}
const int = (x, lo, hi, d) => Number.isInteger(x) && x >= lo && x <= hi ? x : d;
function cleanState(raw) {
  const s = clean(raw);
  if (!s || typeof s !== 'object' || s.v !== 1 || !s.profile || typeof s.profile !== 'object') throw new Error('state');
  const p = s.profile;
  const grade = int(p.grade, 4, 12, p.track === 'g9' ? 9 : 7);
  s.profile = { name: String(p.name || 'שחקן').trim().slice(0, 14) || 'שחקן', avatar: typeof p.avatar === 'string' && p.avatar.length <= 8 ? p.avatar : '🦊',
    grade, level: grade >= 10 ? int(p.level, 3, 5, 4) : undefined, track: TRACK_KEYS.includes(p.track) ? p.track : undefined, created: int(p.created, 0, 1e13, Date.now()) };
  for (const k of ['xp', 'coins']) s[k] = int(Math.round(s[k] || 0), 0, 1e8, 0);
  if (s.tracks && typeof s.tracks === 'object') for (const k of Object.keys(s.tracks)) if (!TRACK_KEYS.includes(k)) delete s.tracks[k];
  return s;
}
/** parse + validate + migrate any supported backup format → { profiles, cur, savedAt } or throws Error(hebrew message) */
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('הקובץ גדול מדי או ריק');
  let obj; try { obj = JSON.parse(text); } catch { throw new Error('זה לא קובץ גיבוי של English Quest'); }
  if (!obj || typeof obj !== 'object') throw new Error('זה לא קובץ גיבוי של English Quest');
  let list, cur = null, savedAt = null;
  if (obj.app === APP && typeof obj.schema === 'number') {
    if (obj.schema > SCHEMA) throw new Error('הגיבוי נוצר בגרסה חדשה יותר – רעננו את האפליקציה ונסו שוב');
    if (!Array.isArray(obj.profiles)) throw new Error('בגיבוי אין שחקנים');
    list = obj.profiles.slice(0, 20).map(p => ({ id: /^p[\w]{1,16}$/.test(p?.id) ? p.id : null, state: p?.state }));
    cur = typeof obj.cur === 'string' ? obj.cur : null; savedAt = int(obj.savedAt, 0, 1e13, null);
  } else if (obj.v === 1 && obj.profile) list = [{ id: null, state: obj }];             // schema 1: single-player export (v2/v3.0)
  else throw new Error('זה לא קובץ גיבוי של English Quest');
  const out = [];
  for (const p of list) { try { const state = cleanState(p.state); out.push({ id: p.id || 'p' + (Date.now() + out.length).toString(36), state }); } catch {} }
  if (!out.length) throw new Error('בגיבוי אין שחקנים תקינים');
  return { profiles: out, cur: out.some(p => p.id === cur) ? cur : out[0].id, savedAt };
}

// ---------- backup code: deflate + base64url + checksum ----------
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const sum = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0; return (h % 0x10000).toString(16).padStart(4, '0'); };
async function pipe(u8, stream) { const r = new Blob([u8]).stream().pipeThrough(stream).getReader(); const parts = []; let n = 0; for (;;) { const { done, value } = await r.read(); if (done) break; n += value.length; if (n > MAX_BYTES) throw new Error('big'); parts.push(value); } const o = new Uint8Array(n); let i = 0; for (const p of parts) { o.set(p, i); i += p.length; } return o; }
function compactSnap() {     // the code drops day-by-day history older than 60 days to stay short; the file keeps everything
  const s = snapshot(), cut = Math.floor(Date.now() / 864e5) - 60;
  for (const p of s.profiles) if (p.state?.days) for (const d of Object.keys(p.state.days)) if (+d < cut) delete p.state.days[d];
  for (const p of s.profiles) delete p.name, delete p.avatar, delete p.grade, delete p.level, delete p.xp;
  return s;
}
export async function makeCode() {
  const raw = new TextEncoder().encode(JSON.stringify(compactSnap()));
  let body, tag;
  if ('CompressionStream' in self) { body = b64(await pipe(raw, new CompressionStream('deflate-raw'))); tag = 'EQ2'; } else { body = b64(raw); tag = 'EQ2U'; }
  markBackup('code');
  return `${tag}-${body}-${sum(body)}`;
}
export async function readCode(code) {
  const m = /^(EQ2U?)-([\w-]+)-([0-9a-f]{4})$/.exec(String(code || '').replace(/\s+/g, ''));
  if (!m) throw new Error('הקוד לא שלם – העתיקו אותו שוב מתחילתו (EQ2-…) ועד סופו');
  if (sum(m[2]) !== m[3]) throw new Error('הקוד לא שלם או שהשתנה בהעתקה');
  let u8 = unb64(m[2]);
  if (m[1] === 'EQ2') { if (!('DecompressionStream' in self)) throw new Error('הדפדפן הזה ישן מדי לקוד – השתמשו בקובץ'); u8 = await pipe(u8, new DecompressionStream('deflate-raw')); }
  return parseBackup(new TextDecoder().decode(u8));
}

// ---------- backup file: share sheet on phones, download elsewhere ----------
const stamp = () => new Date().toISOString().slice(0, 10);
export async function exportFile() {
  const text = JSON.stringify(snapshot(), null, 1), name = `english-quest-backup-${stamp()}.json`;
  const file = typeof File === 'function' ? new File([text], name, { type: 'application/json' }) : null;
  if (file && navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], title: 'English Quest – גיבוי' }); markBackup('file'); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  markBackup('file'); return 'downloaded';
}
export async function readFile(file) {
  if (!file) throw new Error('לא נבחר קובץ');
  if (file.size > MAX_BYTES) throw new Error('הקובץ גדול מדי');
  return parseBackup(await file.text());
}

// ---------- restore (keeps an undo copy in IndexedDB) ----------
export async function applyBackup(b, mode = 'replace') {
  await idbSet('preRestore', snapshot());
  restoreProfiles(b.profiles, b.cur, mode);
  await mirrorNow();
}
export async function undoRestore() { const s = await idbGet('preRestore'); if (!s) return false; const b = parseBackup(JSON.stringify(s)); restoreProfiles(b.profiles, s.cur, 'replace'); await idbDel('preRestore'); await mirrorNow(); return true; }
export const canUndo = async () => !!(await idbGet('preRestore'));

// ---------- IndexedDB mirror + storage.persist + auto-save file ----------
let fileHandle = null, fileState = 'off', autoT;
export const autoFileSupported = () => 'showSaveFilePicker' in self && !matchMedia('(pointer: coarse)').matches;
export const autoFileState = () => ({ state: fileState, name: fileHandle?.name || meta.autoName || '' });
async function mirrorNow(allowEmpty = false) {   // an empty device never overwrites the mirror (that is what recovery is for)
  const s = snapshot();
  if (s.profiles.length || allowEmpty) await idbSet('snapshot', s);
}
/** after the parent deliberately deletes a player: update the mirror even if no players are left */
export const afterDelete = () => mirrorNow(true);
async function writeAutoFile(ask = false) {
  if (!fileHandle) return false;
  try {
    let perm = await fileHandle.queryPermission?.({ mode: 'readwrite' }) ?? 'granted';
    if (perm !== 'granted' && ask) perm = await fileHandle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') { fileState = 'needs-permission'; return false; }
    const w = await fileHandle.createWritable(); await w.write(JSON.stringify(snapshot(), null, 1)); await w.close();
    fileState = 'on'; markBackup('auto'); return true;
  } catch (e) { fileState = e?.name === 'NotFoundError' ? 'missing' : 'needs-permission'; return false; }
}
export async function enableAutoFile() {
  const h = await showSaveFilePicker({ suggestedName: 'english-quest-autosave.json', types: [{ description: 'English Quest backup', accept: { 'application/json': ['.json'] } }] });
  fileHandle = h; setMeta({ autoName: h.name });
  if (!(await idbSet('fileHandle', h))) setMeta({ autoSession: true });   // handle could not be stored → works for this session only
  return writeAutoFile(true);
}
export const resumeAutoFile = () => writeAutoFile(true);
export async function disableAutoFile() { fileHandle = null; fileState = 'off'; await idbDel('fileHandle'); setMeta({ autoName: '' }); }
export async function storageStatus() {
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  return { persisted: !!persisted, mirror: !!(await idbGet('snapshot')) };
}
export async function requestPersist() { try { return !!(await navigator.storage?.persist?.()); } catch { return false; } }

/** on startup: recover from the IndexedDB mirror if localStorage lost data; returns 'restored' | 'partial' | null */
export async function init() {
  let res = null;
  try {
    const mirror = await idbGet('snapshot');
    if (!Object.keys(meta).length) { const m = await idbGet('meta'); if (m && typeof m === 'object') { meta = m; try { localStorage.setItem(META, JSON.stringify(meta)); } catch {} } }
    const lost = missingStates();
    if (mirror && (!profiles().length || lost.length)) {
      const b = parseBackup(JSON.stringify(mirror));
      if (!profiles().length) { restoreProfiles(b.profiles, mirror.cur, 'replace'); res = 'restored'; }
      else { const pick = b.profiles.filter(p => lost.includes(p.id)); if (pick.length) { restoreProfiles(pick, null, 'merge'); res = 'restored'; } else res = 'partial'; }
    } else if (lost.length) res = 'partial';
  } catch {}
  try { const h = await idbGet('fileHandle'); if (h && typeof h.createWritable === 'function') { fileHandle = h; fileState = (await h.queryPermission?.({ mode: 'readwrite' })) === 'granted' ? 'on' : 'needs-permission'; } } catch {}
  onPersist(() => { mirrorNow(); if (fileHandle && fileState === 'on') { autoT ||= setTimeout(() => { autoT = 0; writeAutoFile(false); }, 4000); } });   // auto-file: throttled (not debounced) so steady play still saves every ~4 s
  if (!meta.firstSeen) setMeta({ firstSeen: Date.now() });
  if (profiles().length) { mirrorNow(); requestPersist(); }
  return res;
}
/** days since the last backup (file / code / auto-save) or null if never; the reminder shows after 4 days with progress */
export function backupDue() {
  if (!profiles().some(p => (p.xp || 0) > 0)) return null;
  if (meta.snooze && Date.now() < meta.snooze) return null;
  if (!meta.firstSeen) setMeta({ firstSeen: Date.now() });
  const since = meta.lastBackup || meta.firstSeen, days = Math.floor((Date.now() - since) / 864e5);
  return days >= 4 ? { days, never: !meta.lastBackup } : null;
}
export const snoozeReminder = () => setMeta({ snooze: Date.now() + 2 * 864e5 });
