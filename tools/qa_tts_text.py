# Lint the Hebrew/English *recording* texts (what TTS actually reads) for every word in data/*.json.
# Flags: bracket characters left in a recording text, and glosses whose parenthetical is only a prefix
# fragment such as "(ל־)" / "(ה־)" (TTS reads these as a lone letter) with no say/tts override.
# Exit code 1 if anything is flagged.  Usage: python3 tools/qa_tts_text.py
import json, re, glob, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
src = open('tools/tts_v3.py').read().split("if __name__")[0].replace('__file__', repr(R + '/tools/tts_v3.py'))
g = {}; exec(src, g)
SAY = json.load(open('tools/src/extra/say.json')) if os.path.exists('tools/src/extra/say.json') else {'he': {}, 'en': {}}
OV = json.load(open('tools/src/tts_overrides.json')) if os.path.exists('tools/src/tts_overrides.json') else {'he': {}, 'en': {}}
NIQ = re.compile(r'[\u0591-\u05C7]')
PREFIX_ONLY = re.compile(r"\(\s*(?:[\u05D0-\u05EA]\s*[־\-]?|[\u05D0-\u05EA]{1,2}\s*[־\-])\s*\)")
bad = []
for f in sorted(glob.glob('data/*.json')):
    d = json.load(open(f))
    if not isinstance(d, dict) or 'words' not in d: continue
    for w in d['words']:
        n = str(w['n']); he = w.get('he', '')
        ov_he = SAY['he'].get(n) or OV['he'].get(n)
        t_he = ov_he or g['he_text'](w)
        t_en = SAY['en'].get(n) or OV['en'].get(n) or g['en_text'](w) if 'en_text' in g else w.get('en', '')
        for lang, t in (('he', t_he), ('en', t_en)):
            if re.search(r'[()\[\]{}]', t or ''): bad.append((f, n, lang, 'bracket in recording text', t))
        if PREFIX_ONLY.search(NIQ.sub('', he)) and not ov_he:
            bad.append((f, n, 'he', 'prefix-only parenthetical, needs say override', he))
for b in bad: print(*b, sep=' | ')
print('qa_tts_text:', len(bad), 'issue(s)')
sys.exit(1 if bad else 0)
