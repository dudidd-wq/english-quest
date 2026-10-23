"""Build stage assignment for the two tracks from band2-study/data/words.json (official MoE Lexical Band II).
grade 7 = Band II Core I (MoE: Grade 7 - mid Grade 8); grade 9 = Band II Core II (mid Grade 8 - end Grade 9).
Order inside a track: Prod (productive) items first, then Rec; spread across the alphabet; no two items in a stage
share an English form or a Hebrew sense (keeps every match/memory game unambiguous)."""
import json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/workspace/band2-study/data/words.json'
W = json.load(open(SRC))['words']
def senses(he):
    he = re.sub(r'\([^)]*\)', ' ', he); he = re.sub('[\u0591-\u05C7]', '', he)
    return {t.replace('…','').replace('...','').strip() for t in re.split(r'[,/;]|\s+או\s+', he) if t.strip()}
def enkey(en): return re.sub(r'\b(sb|sth)\b|[^a-z ]', '', en.lower()).strip()
def conflict(a, b):
    return enkey(a['en']) == enkey(b['en']) or bool(senses(a['he']) & senses(b['he'])) or a['he'].strip() == b['he'].strip()
SIZE = 12
out = {}
for core, key in ((1, 'g7'), (2, 'g9')):
    L = [w for w in W if w['core'] == core]
    prod = [w for w in L if w['rp'] == 'Prod']; rec = [w for w in L if w['rp'] != 'Prod']
    stages = []
    for group in (prod, rec):
        S = max(1, round(len(group) / SIZE))
        bins = [[] for _ in range(S)]
        cap = -(-len(group) // S)
        for i, w in enumerate(group):          # alphabetical stride -> each stage spans the alphabet
            j0 = i % S
            for d in range(S):
                b = bins[(j0 + d) % S]
                if len(b) < cap and not any(conflict(w, x) for x in b):
                    b.append(w); break
            else:
                min(bins, key=len).append(w)
        stages += bins
    out[key] = [[w['n'] for w in b] for b in stages]
    print(key, len(L), 'stages', len(stages), 'sizes', sorted({len(b) for b in stages}))
    # verify
    for b in stages:
        for i in range(len(b)):
            for j in range(i):
                if conflict(b[i], b[j]): print('  conflict', b[i]['en'], '|', b[j]['en'])
json.dump(out, open(os.path.join(ROOT, 'tools/stages.json'), 'w'))
