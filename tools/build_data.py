"""Build data/g7.json, data/g9.json from band2-study words + stages + sentences."""
import json, os, re, glob, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = {w['n']: w for w in json.load(open('/workspace/band2-study/data/words.json'))['words']}
ST = json.load(open(os.path.join(ROOT, 'tools/stages.json')))
OLD = json.load(open('/workspace/band2-study/data/sentences.json'))['items']
EMO_FIX = json.load(open(os.path.join(ROOT, 'tools/emoji_fix.json')))
sent = collections.defaultdict(list); errs = []
for f in sorted(glob.glob(os.path.join(ROOT, 'tools/sent/*.txt'))):
    for ln, line in enumerate(open(f, encoding='utf-8'), 1):
        line = line.strip()
        if not line: continue
        p = line.split('|')
        if len(p) != 4: errs.append((f, ln, 'fields')); continue
        n, s, a, d = int(p[0]), p[1], p[2], [x.strip() for x in p[3].split(';')]
        if n not in W: errs.append((f, ln, 'n')); continue
        if s.count('___') != 1: errs.append((f, ln, 'blank'))
        if len(d) != 3 or a.lower() in [x.lower() for x in d] or len(set(x.lower() for x in d)) != 3: errs.append((f, ln, 'opts', d))
        sent[n].append({'s': s, 'a': a, 'o': d})
for it in OLD:                                  # hand-written items from band2-study (fill + dialog)
    if it['type'] not in ('fill', 'dialog'): continue
    s = it['s'] if it['type'] == 'fill' else ' — '.join(l['en'] for l in it['lines'])
    a = it['ans'][0]; d = [o for o in it['opts'] if o.lower() != a.lower()][:3]
    sent[it['t'][0]].append({'s': s, 'a': a, 'o': d})
OV = collections.defaultdict(list)            # sense fixes: replace every sentence of these words
for ln, line in enumerate(open(os.path.join(ROOT, 'tools/sent_override.txt'), encoding='utf-8'), 1):
    line = line.strip()
    if not line: continue
    n, s, a, d = line.split('|'); n = int(n); d = d.split(';')
    if s.count('___') != 1 or len(set(x.lower() for x in d)) != 3 or a.lower() in [x.lower() for x in d]: errs.append(('override', ln))
    OV[n].append({'s': s, 'a': a, 'o': d})
for n, l in OV.items(): sent[n] = l
print('sentence errors:', errs, 'overrides:', len(OV))
WORLDS = 8
for key, stages in ST.items():
    words = []
    for b in stages:
        for n in b:
            w = W[n]
            words.append({'n': n, 'en': w['en'], 'he': w['he'], 'pos': w['pos'], 'm': w['m'], 'e': EMO_FIX.get(str(n), w['e']), 'rp': w['rp']})
    S = {str(n): sent[n] for b in stages for n in b if n in sent}
    cov = [sum(len(sent.get(n, [])) for n in b) for b in stages]
    print(key, 'stages', len(stages), 'sentences', sum(cov), 'min/stage', min(cov), 'stages<3:', [i + 1 for i, c in enumerate(cov) if c < 3])
    json.dump({'track': key, 'source': 'Israel MoE Lexical Band II (' + ('Core I' if key == 'g7' else 'Core II') + ')',
               'stages': stages, 'words': words, 'sent': S}, open(os.path.join(ROOT, f'data/{key}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
