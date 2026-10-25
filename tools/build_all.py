"""v3: build data/<track>.json for every track from the official MoE Lexical Band lists.
pre1/b1c1/b1c2 (LexicalBand1.xlsx), g7/g9 (= Band II Core I/II from band2-study words.json), b3c1/b3c2 (LexicalBand3.xlsx).
Hebrew+emoji for new tracks: tools/src/he/<track>.txt (n|he|emoji). Stages: 12 words, Prod first then Rec,
alphabet stride, no two words in a stage share an English form or a Hebrew sense. b3c1 is ordered by bagrut List A..D.
Audio: Band II words have recorded clips (n 1..2016). A new word reuses a Band II clip when the English (or Hebrew) text is identical;
otherwise the app falls back to the browser voice and flags the word (ae/ah = clip number, absent = no clip)."""
import json, re, os, glob, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools/src')
RAW = json.load(open(os.path.join(SRC, 'raw.json')))
B2 = json.load(open('/workspace/band2-study/data/words.json'))['words']
EMO_FIX = json.load(open(os.path.join(ROOT, 'tools/emoji_fix.json')))
SENSITIVE = {9828, 9979}        # official B3C2 items kept in the word list but not used in games for teens
norm = lambda s: re.sub(r'\s+', ' ', s.strip().lower())
EN2N = {}; HE2N = {}
for w in B2:
    EN2N.setdefault(norm(w['en']), w['n']); HE2N.setdefault(w['he'].strip(), w['n'])

def senses(he):
    he = re.sub(r'\([^)]*\)', ' ', he); he = re.sub('[\u0591-\u05C7]', '', he)
    return {t.replace('…', '').replace('...', '').strip() for t in re.split(r'[,/;]|\s+או\s+', he) if t.strip()}
def enkey(en): return re.sub(r'\b(sb|sth)\b|[^a-z ]', '', en.lower()).strip()
def conflict(a, b):
    return enkey(a['en']) == enkey(b['en']) or bool(senses(a['he']) & senses(b['he'])) or a['he'].strip() == b['he'].strip()
def make_stages(group, size=12):
    S = max(1, round(len(group) / size)); bins = [[] for _ in range(S)]; cap = -(-len(group) // S)
    for i, w in enumerate(group):
        j0 = i % S
        for d in range(S):
            b = bins[(j0 + d) % S]
            if len(b) < cap and not any(conflict(w, x) for x in b): b.append(w); break
        else: min(bins, key=len).append(w)
    return bins
def he_file(t):
    out = {}
    for line in open(os.path.join(SRC, 'he', t + '.txt'), encoding='utf-8'):
        n, he, e = line.rstrip('\n').split('|'); out[int(n)] = (he.strip(), e.strip())
    return out

TRACKS = {}
for t in ('pre1', 'b1c1', 'b1c2', 'b3c1', 'b3c2'):
    H = he_file(t); words = []
    for r in RAW[t]:
        he, e = H[r['n']]
        w = {'n': r['n'], 'en': r['en'].strip(), 'he': he, 'pos': r['pos'], 'm': r['m'], 'e': e, 'rp': r['rp'] or 'Rec'}
        if r.get('fpos'): w['fp'] = r['fpos']
        if r.get('fam'): w['f'] = r['fam']
        if r.get('lst'): w['l'] = r['lst']
        a = EN2N.get(norm(r['en']));  b = HE2N.get(he)
        if a: w['ae'] = a
        if b: w['ah'] = b
        words.append(w)
    TRACKS[t] = words
for core, t in ((1, 'g7'), (2, 'g9')):
    TRACKS[t] = [{'n': w['n'], 'en': w['en'], 'he': w['he'], 'pos': w['pos'], 'm': w['m'], 'e': EMO_FIX.get(str(w['n']), w['e']), 'rp': w['rp'], 'ae': w['n'], 'ah': w['n']}
                 for w in B2 if w['core'] == core]

OLD_STAGES = json.load(open(os.path.join(ROOT, 'tools/stages.json')))   # keep v1/v2 stage order for g7/g9 (saved progress!)
def stages_for(t, words):
    if t in OLD_STAGES: return OLD_STAGES[t]
    play = [w for w in words if w['n'] not in SENSITIVE]
    if t == 'b3c1':
        out = []
        for L in ('A', 'B', 'C', 'D', ''):
            g = [w for w in play if w.get('l', '') == L]
            if not g: continue
            if L == '': out[-1] += []; out += make_stages(g, 12) if len(g) > 6 else []; 
            if L == '' and len(g) <= 6:
                for w in g: min(out[-4:], key=len).append(w)
                continue
            if L: out += make_stages([w for w in g if w['rp'] == 'Prod'] + [w for w in g if w['rp'] != 'Prod'])
        return [[w['n'] for w in b] for b in out]
    prod = [w for w in play if w['rp'] == 'Prod']; rec = [w for w in play if w['rp'] != 'Prod']
    return [[w['n'] for w in b] for g in (prod, rec) if g for b in make_stages(g)]

# sentences
def read_sent(paths, valid):
    sent = collections.defaultdict(list); errs = []
    for f in paths:
        for ln, line in enumerate(open(f, encoding='utf-8'), 1):
            line = line.strip()
            if not line or line.startswith('#'): continue
            p = line.split('|')
            if len(p) != 4: errs.append((f, ln, 'fields')); continue
            n, s, a, d = int(p[0]), p[1], p[2], [x.strip() for x in p[3].split(';')]
            if n not in valid: errs.append((f, ln, 'n')); continue
            if s.count('___') != 1: errs.append((f, ln, 'blank'))
            if len(d) != 3 or a.lower() in [x.lower() for x in d] or len(set(x.lower() for x in d)) != 3: errs.append((f, ln, 'opts', d))
            sent[n].append({'s': s, 'a': a, 'o': d})
    return sent, errs
OLD = json.load(open(os.path.join(ROOT, 'data/g7.json'))), json.load(open(os.path.join(ROOT, 'data/g9.json')))
OLD_SENT = {**OLD[0]['sent'], **OLD[1]['sent']}        # v2 sentences (built by tools/build_data.py)
SRCN = {'pre1': 'Pre-Band I', 'b1c1': 'Band I · Core I', 'b1c2': 'Band I · Core II', 'g7': 'Band II · Core I', 'g9': 'Band II · Core II', 'b3c1': 'Band III · Core I', 'b3c2': 'Band III · Core II'}
FILE = {'pre1': 'LexicalBand1.xlsx', 'b1c1': 'LexicalBand1.xlsx', 'b1c2': 'LexicalBand1.xlsx', 'g7': 'LexicalBand2.xlsx', 'g9': 'LexicalBand2.xlsx', 'b3c1': 'LexicalBand3.xlsx', 'b3c2': 'LexicalBand3.xlsx'}
READ = json.load(open(os.path.join(ROOT, 'tools/src/reading.json'))) if os.path.exists(os.path.join(ROOT, 'tools/src/reading.json')) else {}
TALK = {'g7': [], 'g9': []}   # conversation items from band2-study (parts 1–10 = Core I, 11–20 = Core II)
for it in json.load(open(os.path.join(ROOT, 'tools/src/talk_band2.json')))['items']:
    TALK['g7' if it['part'] <= 10 else 'g9'].append({k: v for k, v in it.items() if k not in ('part',)})
report = {}
for t, words in TRACKS.items():
    valid = {w['n'] for w in words}
    st = stages_for(t, words)
    if t in ('g7', 'g9'): S = {k: v for k, v in OLD_SENT.items() if int(k) in valid}
    else:
        sent, errs = read_sent(sorted(glob.glob(os.path.join(SRC, 'sent', t + '*.txt'))), valid)
        if errs: print(t, 'SENT ERRORS', errs[:10])
        S = {str(n): v for n, v in sent.items()}
    cov = [sum(len(S.get(str(n), [])) for n in b) for b in st]
    ae = sum(1 for w in words if 'ae' in w); ah = sum(1 for w in words if 'ah' in w)
    report[t] = dict(words=len(words), stages=len(st), in_games=sum(map(len, st)), sentences=sum(cov), min_sent=min(cov), audio_en=ae, audio_he=ah)
    print(t, report[t], 'stages<2 sent:', sum(1 for c in cov if c < 2))
    json.dump({'track': t, 'source': f'Israel MoE Lexical {SRCN[t]} ({FILE[t]})', 'stages': st, 'words': words, 'sent': S, 'read': READ.get(t, []), 'talk': TALK.get(t, [])},
              open(os.path.join(ROOT, f'data/{t}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(report, open(os.path.join(ROOT, 'tools/report.json'), 'w'), indent=1)
