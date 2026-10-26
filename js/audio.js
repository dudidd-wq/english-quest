// Recorded clips (EN: Matilda, plus Alice/Bella/Sarah for a few weak words - see tools/voices.json; HE: Tomer from band2) + speechSynthesis fallback + punchy Web Audio SFX.
import { S } from './store.js';
const pad = n => String(n).padStart(4, '0');
/** recorded clip for a word, or null (then the browser voice is used and flagged in the UI) */
export const clipNo = (w, lang) => lang === 'he' ? w.ah : w.ae;
export const hasClip = (w, lang) => !!clipNo(w, lang);
export const audioUrl = (w, lang) => hasClip(w, lang) ? `audio/${lang}/${pad(clipNo(w, lang))}.mp3` : null;
/** fires when the browser voice (speechSynthesis) is used instead of a recording */
const robo = new Set(); export const onRobo = fn => robo.add(fn);
const player = () => document.getElementById('player');
let token = 0, AC = null, master = null;

function ctx() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume().catch(() => {});
  return AC;
}
function tone(freq, dur, type = 'square', gain = 0.18, when = 0, slideTo = null) {
  if (S.settings && S.settings.sfx === false) return;
  const c = ctx(), t0 = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, gain = 0.12, when = 0, bp = 800) {
  if (S.settings && S.settings.sfx === false) return;
  const c = ctx(), t0 = c.currentTime + when, n = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bp; f.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + dur + 0.02);
}

export function speak(text, lang) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res(false);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'he' ? 'he-IL' : 'en-US';
    let done = false; const fin = ok => { if (!done) { done = true; res(ok); } };
    u.onend = () => fin(true); u.onerror = () => fin(false); setTimeout(() => fin(false), 6000);
    speechSynthesis.speak(u);
  });
}
function spokenText(w, lang) {
  if (lang === 'he') return w.he.replace(/\//g, ' או ').replace(/[()…]/g, ' ');
  return w.en.replace(/\bsb\/sth\b/g, 'somebody or something').replace(/\bsth\b/g, 'something').replace(/\bsb\b/g, 'somebody').replace(/\//g, ' or ').replace(/[()…]/g, ' ');
}
export function playUrl(url) {
  const a = player(); const my = ++token;
  return new Promise(res => {
    const clean = () => { a.onended = a.onerror = null; };
    a.onended = () => { clean(); res(my === token); };
    a.onerror = () => { clean(); res(false); };
    a.src = url;
    const p = a.play(); if (p) p.catch(err => { if (my === token) { clean(); res(err && err.name === 'NotAllowedError' ? 'blocked' : false); } });
  });
}
export async function playWord(w, lang = 'en', btn) {
  if (!w || !S.settings.voice) return false;
  btn?.classList.add('playing');
  const my = token + 1;
  const url = audioUrl(w, lang);
  let ok = url ? await playUrl(url) : false;
  if (!ok && ok !== 'blocked' && (my === token || !url)) { robo.forEach(f => f(w, lang)); ok = await speak(spokenText(w, lang), lang); }
  btn?.classList.remove('playing');
  return ok;
}
export function stop() { token++; const a = player(); a.onended = a.onerror = null; try { a.pause(); } catch {} if ('speechSynthesis' in window) speechSynthesis.cancel(); }
export function prefetch(words) {
  if (!navigator.onLine) return;
  let i = 0; const urls = words.flatMap(w => [audioUrl(w, 'en'), audioUrl(w, 'he')]).filter(Boolean);
  const next = () => { if (i < urls.length) fetch(urls[i++]).catch(() => {}).finally(next); };
  next(); next();
}

/** Punchy arcade SFX – every tap should feel physical */
export function sfx(kind, combo = 0) {
  try {
    if (S.settings && S.settings.sfx === false) return;
    ctx();
    switch (kind) {
      case 'tap': tone(420, 0.04, 'square', 0.08); break;
      case 'ok': {
        const base = 520 + Math.min(combo, 12) * 28;
        tone(base, 0.08, 'square', 0.2); tone(base * 1.5, 0.12, 'square', 0.14, 0.05);
        noise(0.05, 0.06, 0, 2000); break;
      }
      case 'bad': tone(180, 0.18, 'sawtooth', 0.16, 0, 70); noise(0.12, 0.1, 0, 200); break;
      case 'combo': {
        tone(600, 0.06, 'square', 0.16); tone(900, 0.08, "square", 0.14, 0.05); tone(1200, 0.14, 'square', 0.12, 0.1);
        noise(0.08, 0.08, 0.05, 3000); break;
      }
      case 'coin': tone(980, 0.06, 'square', 0.14); tone(1400, 0.12, 'square', 0.1, 0.05); break;
      case 'level': tone(400, 0.1, 'square', 0.14); tone(600, 0.1, 'square', 0.14, 0.1); tone(800, 0.2, 'square', 0.16, 0.2); break;
      case 'win': tone(523, 0.1, 'square', 0.16); tone(659, 0.1, 'square', 0.16, 0.1); tone(784, 0.1, 'square', 0.16, 0.2); tone(1046, 0.28, 'square', 0.18, 0.3); noise(0.2, 0.08, 0.25, 2500); break;
      case 'lose': tone(300, 0.2, 'sawtooth', 0.14, 0, 120); tone(200, 0.3, 'sawtooth', 0.12, 0.15, 80); break;
      case 'hit': tone(90, 0.08, 'sawtooth', 0.22); noise(0.1, 0.18, 0, 400); tone(220, 0.06, 'square', 0.1, 0.04); break;
      case 'hurt': tone(140, 0.15, 'sawtooth', 0.2, 0, 60); noise(0.15, 0.14, 0, 150); break;
      case 'sparkle': tone(1320, 0.05, 'triangle', 0.07, 0.12); tone(1760, 0.07, 'triangle', 0.06, 0.17); tone(2093, 0.1, 'triangle', 0.05, 0.22); break;
      case 'tick': tone(880, 0.025, 'square', 0.06); break;
      case 'flip': tone(340, 0.04, 'triangle', 0.08); break;
      case 'whoosh': noise(0.08, 0.07, 0, 1200); tone(500, 0.08, 'sine', 0.05, 0, 200); break;
      case 'boss': tone(80, 0.25, 'sawtooth', 0.2); tone(100, 0.3, 'sawtooth', 0.14, 0.1); noise(0.25, 0.12, 0, 180); break;
      case 'blitz': tone(760, 0.04, 'square', 0.12); tone(1100, 0.06, 'square', 0.1, 0.03); break;
      case 'streak': tone(440, 0.05, 'square', 0.1); tone(660, 0.08, 'square', 0.12, 0.05); tone(880, 0.12, 'square', 0.14, 0.1); break;
      default: tone(440, 0.05, 'square', 0.08);
    }
  } catch {}
}
