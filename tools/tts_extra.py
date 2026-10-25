#!/usr/bin/env python3
"""TTS for the derived tracks (tools/build_extra.py writes tools/src/extra/tts_todo.json).
Same voices/model/normalisation as tools/tts_v3.py; clip number = word number n. Key from env ELEVENLABS_API_KEY only.
usage: TTS_CAP=12000 python3 tools/tts_extra.py run [en|he]   ->  installs audio/<lang>/<n>.mp3, records tools/src/extra/clips.json"""
import json, os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(ROOT, 'tools/tts_v3.py')).read().split("if __name__")[0].replace('__file__', repr(os.path.join(ROOT, 'tools/tts_v3.py'))))
X = os.path.join(ROOT, 'tools/src/extra'); CL = f'{X}/clips.json'
NORM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-1.5:LRA=11'
SAY = json.load(open(f'{X}/say.json')) if os.path.exists(f'{X}/say.json') else {'en': {}, 'he': {}}   # respellings / carriers
def text(lang, n, t):
    if n in SAY.get(lang, {}): return SAY[lang][n]
    return (t if ',' in t and ' as in ' in t else en_text({'n': 0, 'en': t})) if lang == 'en' else he_text({'n': 0, 'he': t})
def install(src, n, lang):
    d = os.path.join(ROOT, f'audio/{lang}/{int(n):04d}.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', NORM, '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '32k', '-map_metadata', '-1', d], check=True)
if __name__ == '__main__':
    todo = json.load(open(f'{X}/tts_todo.json')); langs = sys.argv[2:] or ['en', 'he']
    clips = json.load(open(CL)) if os.path.exists(CL) else {'en': [], 'he': []}
    state = ledger_state(); total = 0; fails = []
    for lang in langs:
        voice = EN_VOICE if lang == 'en' else HE_VOICE
        J = [(n, text(lang, n, t)) for n, t in todo[lang].items()]
        def go(j):
            n, t = j; st, c = synth(t, voice, lang, state); p = cpath(t, voice, lang)
            if os.path.exists(p) and os.path.getsize(p) > 1000: install(p, n, lang); return n, st, c, True
            return n, st, c, False
        with ThreadPoolExecutor(4) as ex:
            for n, st, c, ok in ex.map(go, J):
                total += c
                if ok: clips[lang] = sorted(set(clips[lang]) | {int(n)})
                else: fails.append((lang, n, st))
        json.dump(clips, open(CL, 'w'))
        print(lang, 'done; spent so far', total, 'fails', len(fails), flush=True)
        if STOP.is_set(): print('STOPPED (quota/auth or cap)'); break
    print('TOTAL cost this run', total, 'fails', fails[:20])
