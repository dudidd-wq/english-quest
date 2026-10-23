// Audio: recorded clips (ElevenLabs "Matilda" EN / "Tomer" HE, from band2-study) + speechSynthesis fallback + Web Audio SFX.
import { S } from './store.js';
const pad = n => String(n).padStart(4, '0');
export const audioUrl = (w, lang) => `audio/${lang}/${pad(w.n)}.mp3`;
const player = () => document.getElementById('player');
let token = 0;
function spokenText(w, lang) {
  if (lang === 'he') return w.he.replace(/\//g, ' או ').replace(/[()…]/g, ' ');
  return w.en.replace(/\bsb\/sth\b/g, 'somebody or something').replace(/\bsth\b/g, 'something').replace(/\bsb\b/g, 'somebody').replace(/\//g, ' or ').replace(/[()…]/g, ' ');
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
/** Play a word (recorded clip; speech synthesis only if the clip is missing/unplayable). */
export async function playWord(w, lang = 'en', btn) {
  if (!w || !S.settings.voice) return false;
  btn?.classList.add('playing');
  const my = token + 1;
  let ok = await playUrl(audioUrl(w, lang));
  if (!ok && ok !== 'blocked' && my === token) ok = await speak(spokenText(w, lang), lang);
  btn?.classList.remove('playing');
  return ok;
}
export function stop() { token++; const a = player(); a.onended = a.onerror = null; try { a.pause(); } catch {} if ('speechSynthesis' in window) speechSynthesis.cancel(); }
/** warm the cache for a list of words (service worker stores them for offline play) */
export function prefetch(words) {
  if (!navigator.onLine) return;
  let i = 0; const urls = words.flatMap(w => [audioUrl(w, 'en'), audioUrl(w, 'he')]);
  const next = () => { if (i < urls.length) fetch(urls[i++]).catch(() => {}).finally(next); };
  next(); next();
}

// ---------- SFX (synthesised with Web Audio – no audio files, no copyright) ----------
let ctx;
function ac() { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function tone(f, t0, dur, { type = 'sine', vol = .16, slide = 0 } = {}) {
  const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(t0, dur, vol = .2) {
  const c = ac(), len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
  s.buffer = b; g.gain.value = vol; s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + t0);
}
export function sfx(kind, combo = 0) {
  if (!S.settings.sfx) return;
  try {
    const up = Math.pow(2, Math.min(combo, 12) / 12);   // rising pitch with combo
    switch (kind) {
      case 'ok': tone(660 * up, 0, .12, { type: 'triangle' }); tone(990 * up, .07, .18, { type: 'triangle' }); break;
      case 'bad': tone(220, 0, .22, { type: 'sawtooth', vol: .08, slide: .7 }); tone(165, .1, .25, { type: 'square', vol: .05 }); break;
      case 'tap': tone(900, 0, .05, { vol: .07 }); break;
      case 'flip': tone(500, 0, .07, { type: 'triangle', vol: .08, slide: 1.6 }); break;
      case 'coin': tone(988, 0, .08, { type: 'square', vol: .06 }); tone(1319, .07, .2, { type: 'square', vol: .06 }); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .09, .3, { type: 'triangle', vol: .14 })); tone(1568, .5, .6, { type: 'sine', vol: .1 }); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, i * .14, .3, { type: 'triangle', vol: .12 })); break;
      case 'level': [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * .08, .25, { type: 'square', vol: .06 })); break;
      case 'hit': noise(0, .18, .25); tone(160, 0, .2, { type: 'square', vol: .1, slide: .5 }); break;
      case 'hurt': tone(300, 0, .3, { type: 'sawtooth', vol: .09, slide: .4 }); break;
      case 'tick': tone(1200, 0, .03, { type: 'square', vol: .04 }); break;
      case 'combo': [784, 988, 1175].forEach((f, i) => tone(f * up, i * .05, .12, { type: 'square', vol: .05 })); break;
      case 'whoosh': noise(0, .25, .08); break;
    }
  } catch {}
}
