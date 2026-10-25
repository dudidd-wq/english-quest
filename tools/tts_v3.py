"""v3: generate the missing word clips (EN Matilda / HE Tomer, eleven_v4 – same voices/model as band2-study).
Key comes from the ELEVENLABS_API_KEY env var only (never stored in the repo).
Raw mp3s are cached in /workspace/eq-tts/cache with a billing ledger (a call that may have been billed is never re-issued).
  python3 tools/tts_v3.py plan            # count + characters (≈ credits), list texts to eyeball
  python3 tools/tts_v3.py run [limit]     # synthesize (4 threads)
  python3 tools/tts_v3.py install         # trim/normalise → audio/<lang>/<n>.mp3 and write tools/src/clips_v3.json
"""
import os, re, sys, json, hashlib, time, threading, subprocess
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN_VOICE = 'XrExE9yKIg1WjnnlVkGX'  # Matilda
HE_VOICE = 'yGpVFXFoImvRvaURKypy'  # Tomer
MODEL = 'eleven_v4'
WORK = '/workspace/eq-tts'; CACHE = WORK + '/cache'; LEDGER = WORK + '/ledger.jsonl'
os.makedirs(CACHE, exist_ok=True); lock = threading.Lock()
TRACKS = ['pre1', 'b1c1', 'b1c2', 'b3c1', 'b3c2']
OVR_EN = json.load(open(os.path.join(ROOT, 'tools/src/tts_overrides.json'))).get('en', {}) if os.path.exists(os.path.join(ROOT, 'tools/src/tts_overrides.json')) else {}
OVR_HE = json.load(open(os.path.join(ROOT, 'tools/src/tts_overrides.json'))).get('he', {}) if os.path.exists(os.path.join(ROOT, 'tools/src/tts_overrides.json')) else {}

def _chain(m):
    toks = [t.strip() for t in re.split(r'\s*/\s*', m.group(0))]
    tail = ''
    if toks[-1].lower().startswith('etc'): toks = toks[:-1]; tail = ', et cetera'
    out = toks[0] if len(toks) == 1 else (' or '.join(toks) if len(toks) == 2 else ', '.join(toks[:-1]) + ', or ' + toks[-1])
    return out + tail
def en_text(w):
    if str(w['n']) in OVR_EN: return OVR_EN[str(w['n'])]
    s = w['en'].replace('\u2026', '...')
    s = re.sub(r"\bsb's\b", "somebody's", s); s = re.sub(r"\bsth's\b", "something's", s)
    s = re.sub(r"\bsb/sth\b", 'somebody or something', s); s = re.sub(r"\bsth/sb\b", 'something or somebody', s)
    s = re.sub(r"\bsth\b", 'something', s); s = re.sub(r"\bsb\b", 'somebody', s)
    s = re.sub(r"[\w'-]+(?:\s*/\s*(?:etc\.?|[\w'-]+))+", _chain, s)
    s = re.sub(r'\betc\.?', 'et cetera', s); s = s.replace('p.m.', 'P M').replace('a.m.', 'A M')
    s = re.sub(r'\s*\.\.\.\s*', ' ', s)
    s = s.replace('(', '').replace(')', '').replace(';', ',')
    s = re.sub(r'([?!])\s*/\s*', r'\1 Or, ', s)
    s = re.sub(r'\s+', ' ', s).strip(' ,;')
    s = re.sub(r'\s+([?!,])', r'\1', s); s = re.sub(r',\s*,', ',', s)
    return s
NQ = {'ל': 'לְ', 'מ': 'מִ', 'ב': 'בְּ', 'ש': 'שֶׁ', 'ה': 'הַ', 'ו': 'וְ', 'כ': 'כְּ'}
def he_text(w):
    if str(w['n']) in OVR_HE: return OVR_HE[str(w['n'])]
    s = w['he']
    s = re.sub(r'\([^)]*[A-Za-z][^)]*\)', ' ', s)          # parenthetical English examples are not read aloud
    s = re.sub(r'\s*[–-]\s*[^\u0590-\u05FF;]*[A-Za-z][^;]*?(?=;|$)', ' ', s)  # "– I will go = ..." style examples
    s = s.replace('…', '').replace('...', '').replace('״', '"').replace('׳', "'").replace('־', '')
    s = re.sub(r'\s*/\s*', ' או ', s); s = re.sub(r'\s*\(\s*', ', ', s).replace(')', '').replace(';', ',')
    s = re.sub(r'\s*,\s*(,\s*)+', ', ', s); s = s.replace('\u200e', '').replace('\u200f', ''); s = re.sub(r'\s+', ' ', s); s = re.sub(r'\s+,', ',', s).strip(' ,;:–-')
    s = re.sub(r'(?<![\u0590-\u05FF"\'])([למבשהוכ])(?![\u0590-\u05FF])', lambda m: NQ[m.group(1)], s)
    return s
def key(text, voice, lang): return hashlib.sha1(f'{MODEL}|{voice}|{lang}|{text}'.encode()).hexdigest()[:16]
def cpath(text, voice, lang): return f'{CACHE}/{lang}_{key(text, voice, lang)}.mp3'
def jobs():
    J = []
    for t in TRACKS:
        for w in json.load(open(os.path.join(ROOT, f'data/{t}.json')))['words']:
            if not w.get('ae'): J.append((w['n'], 'en', en_text(w), EN_VOICE, t, w))
            if not w.get('ah'): J.append((w['n'], 'he', he_text(w), HE_VOICE, t, w))
    return J
def led(d):
    with lock:
        with open(LEDGER, 'a') as f: f.write(json.dumps(d, ensure_ascii=False) + '\n')
def ledger_state():
    st = {}
    if os.path.exists(LEDGER):
        for l in open(LEDGER): d = json.loads(l); st[d['key']] = d
    return st
STOP = threading.Event(); spent = [0]; CAP = int(os.environ.get('TTS_CAP', '40000'))
def synth(text, voice, lang, state):
    import requests
    p = cpath(text, voice, lang); k = key(text, voice, lang)
    if os.path.exists(p) and os.path.getsize(p) > 1000: return ('cached', 0)
    prev = state.get(k)
    if prev and prev['status'] in ('pending', 'uncertain'): return ('skip_uncertain', 0)
    if STOP.is_set() or spent[0] >= CAP: return ('stopped', 0)
    for attempt in range(6):
        led({'key': k, 'status': 'pending', 'text': text, 'lang': lang, 't': time.time()})
        try:
            r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',
                              headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'Content-Type': 'application/json'},
                              json={'text': text, 'model_id': MODEL, 'language_code': lang}, timeout=(10, 120))
        except Exception as ex:
            led({'key': k, 'status': 'uncertain', 'err': repr(ex)[:200]}); return ('uncertain', 0)
        if r.status_code == 200 and len(r.content) > 1000:
            tmp = p + '.tmp'; open(tmp, 'wb').write(r.content); os.replace(tmp, p)
            cost = int(r.headers.get('character-cost') or 0)
            with lock: spent[0] += cost
            led({'key': k, 'status': 'done', 'cost': cost, 'req': r.headers.get('request-id')}); return ('done', cost)
        if r.status_code == 429 and 'quota' not in r.text:
            led({'key': k, 'status': 'failed_429'}); time.sleep(3 * (attempt + 1)); continue
        led({'key': k, 'status': 'failed', 'code': r.status_code, 'body': r.text[:300]})
        if 'quota' in r.text or r.status_code in (401, 402): STOP.set()
        return ('failed', 0)
    return ('failed', 0)
def dst(n, lang): return os.path.join(ROOT, f'audio/{lang}/{n:04d}.mp3')
if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'plan'
    J = jobs()
    if cmd == 'plan':
        bad = [j for j in J if (j[1] == 'en' and re.search(r'[/()…;]|\bsth\b|\bsb\b', j[2])) or (j[1] == 'he' and re.search(r'[A-Za-z/()…]', j[2])) or not j[2].strip()]
        print('clips', len(J), 'EN', sum(j[1] == 'en' for j in J), 'HE', sum(j[1] == 'he' for j in J), 'chars', sum(len(j[2]) for j in J))
        print('suspicious', len(bad)); [print(' ', j[0], j[1], repr(j[5]['en' if j[1] == 'en' else 'he']), '->', repr(j[2])) for j in bad]
        if len(sys.argv) > 2: [print(j[0], j[1], j[2]) for j in J]
    elif cmd == 'run':
        lim = int(sys.argv[2]) if len(sys.argv) > 2 else len(J)
        uniq = list(dict.fromkeys((j[2], j[3], j[1]) for j in J))[:lim]
        state = ledger_state(); from collections import Counter; C = Counter(); cost = 0
        with ThreadPoolExecutor(4) as ex:
            for st, c in ex.map(lambda j: synth(*j, state), uniq): C[st] += 1; cost += c
        print(dict(C), 'cost this run', cost)
    elif cmd == 'install':
        out = {}; miss = 0
        for n, lang, text, voice, t, w in J:
            src = cpath(text, voice, lang)
            if not os.path.exists(src): miss += 1; continue
            d = dst(n, lang)
            if not os.path.exists(d):
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-1.5:LRA=11',
                    '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '32k', '-map_metadata', '-1', d], check=True)
            out.setdefault(str(n), {})['a' + lang[0]] = n
        json.dump(out, open(os.path.join(ROOT, 'tools/src/clips_v3.json'), 'w'))
        print('installed', sum(len(v) for v in out.values()), 'missing', miss)
