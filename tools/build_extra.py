#!/usr/bin/env python3
"""Build the DERIVED tracks (not official MoE lists) – see LEVELS.md / SOURCES.md.
  early : 36 picturable items from the official Pre-Band I list (grades 1–2, optional early start), n 21001+
  abc   : 26 letters with an example word (grades 1–3), n 20001+
  acad  : New Academic Word List (NAWL 1.2, Browne/Culligan/Phillips, CC BY-SA 4.0), prefixes removed, n 30001+
  tech  : New Computer Science Academic Word List (NCSAWL, Roesler 2021, CC BY 4.0), brand names/typos removed, n 31001+
  c2    : 300-word C2 subset of the Octanove C1/C2 list (CC BY-SA 4.0) – rule in tools/build_c2_list.py, n 32001+
Hebrew for acad/tech/c2 and the abc example words: written for this app (derived); where an official MoE item
has the same English word its Hebrew is reused for acad (not for tech, which uses the computing sense).
Audio: a clip is reused when the identical English (same part of speech) / Hebrew text already has one;
otherwise the clip number is the word number n (tools/src/extra/clips.json records which exist).
n of an item never changes once published (progress is keyed by n)."""
import json, os, re, csv
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = os.path.join(ROOT, 'tools/src/extra')
ADV = os.environ.get('EQ_ADV', '/workspace/eq-adv')
OFFICIAL = ['pre1', 'b1c1', 'b1c2', 'g7', 'g9', 'b3c1', 'b3c2']
norm = lambda s: re.sub(r'\s+', ' ', s.strip().lower())
P1 = lambda p: (p or '').split(',')[0].strip()[:1]          # n / v / a(dj|dv) …
OFF = {t: json.load(open(f'{ROOT}/data/{t}.json')) for t in OFFICIAL}
EN, HE, BYEN = {}, {}, {}
for t in OFFICIAL:
    for w in OFF[t]['words']:
        if w.get('ae'): EN.setdefault(norm(w['en']), []).append((P1(w.get('pos')), w['ae']))
        if w.get('ah'): HE.setdefault(w['he'].strip(), w['ah'])
        BYEN.setdefault(norm(w['en']), w)
CLIPS = json.load(open(f'{X}/clips.json')) if os.path.exists(f'{X}/clips.json') else {'en': [], 'he': []}
HAVE = {l: set(CLIPS[l]) for l in ('en', 'he')}
TODO = {'en': {}, 'he': {}}

def en_clip(en, pos, n, say=None):
    c = [a for p, a in EN.get(norm(en), []) if not pos or not p or p == P1(pos)]
    if c and not say: return c[0]
    if n in HAVE['en']: return n
    TODO['en'][n] = say or en
def he_clip(he, n):
    if he.strip() in HE: return HE[he.strip()]
    if n in HAVE['he']: return n
    TODO['he'][n] = he
def word(n, en, he, pos, e, m='', say=None, rp='Rec'):
    w = {'n': n, 'en': en, 'he': he, 'pos': pos, 'm': m, 'e': e, 'rp': rp}
    a = en_clip(en, pos, n, say); b = he_clip(he, n)
    if a: w['ae'] = a
    if b: w['ah'] = b
    return w
def chunks(ws, size): return [[w['n'] for w in ws[i:i + size]] for i in range(0, len(ws), size)]
def out(track, source, words, stages):
    assert len({w['n'] for w in words}) == len(words), track
    d = {'track': track, 'source': source, 'derived': True, 'stages': stages, 'words': words, 'sent': {}, 'read': [], 'talk': []}
    json.dump(d, open(f'{ROOT}/data/{track}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print(track, len(words), 'words', len(stages), 'stages')
def lines(f): return [l.rstrip('\n').split('|') for l in open(f'{X}/{f}', encoding='utf-8') if l.strip() and not l.startswith('#')]

# ---- abc
ws = [word(int(n), f'{L} {L.lower()}', he, 'letter', e, m=ex, say=f'{L}, as in {ex}.') for n, L, ex, he, e in lines('abc.txt')]
out('abc', 'Derived: English alphabet with example words (mostly from the MoE Pre-Band I / Band I lists)', ws, chunks(ws[:18], 6) + [[w['n'] for w in ws[18:]]])  # A–F, G–L, M–R, S–Z

# ---- early (reuses the official item's Hebrew, emoji and clips)
ws, stages, n = [], [], 21001
pre = {norm(w['en']): w for w in OFF['pre1']['words']}
for row in lines('early.txt'):
    st = []
    for en in row:
        o = pre[norm(en)]; w = {k: o[k] for k in ('en', 'he', 'pos', 'm', 'e', 'rp', 'ae', 'ah') if k in o}; w['n'] = n; w['src'] = o['n']
        ws.append(w); st.append(n); n += 1
    stages.append(st)
out('early', 'Derived: picturable subset of the MoE Lexical Pre-Band I list (optional early start, grades 1–2)', ws, stages)

# ---- acad (NAWL 1.2)
mine = {r[0].lower(): r for f in ('acad_he_1.txt', 'acad_he_2.txt') for r in lines(f)}
OVR = {'tense': ('adj', 'מתוח'), 'pardon': ('v', 'לחון'), 'flip': ('n', 'היפוך'), 'junior': ('adj', 'זוטר, צעיר'), 'nonetheless': ('adv', 'אף על פי כן'),
       'plural': ('adj', 'רבים (דקדוק)'), 'cure': ('n', 'תרופה, ריפוי'), 'cheat': ('v', 'לרמות'), 'punch': ('v', 'להכות באגרוף'), 'spray': ('v', 'לרסס'), 'sneeze': ('v', 'להתעטש')}
SKIP = {'sexuality', 'suicide', 'naked', 'sperm', 'urine', 'founds', 'neo', 'descendent'}
PM = {'n': 'n', 'n pl.': 'n', 'verb': 'v', 'adj': 'adj', 'adv': 'adv', 'prep': 'prep', 'det': 'det', 'pron': 'pron'}
ws, n, MISS = [], 30001, []
for r in csv.DictReader(open(f'{ADV}/NAWL_12_with_en_definitions.csv', encoding='utf-8-sig')):
    en = r['Meanings'].strip(); k = en.lower()
    if r['POS'] == 'prefix' or k in SKIP: n += 1; continue
    if k == 'headquarter': en = k = 'headquarters'
    if k in OVR: pos, he = OVR[k]
    elif k in mine: pos, he = mine[k][1], mine[k][2]
    elif norm(en) in BYEN: o = BYEN[norm(en)]; pos, he = (o.get('pos') or PM.get(r['POS'], '')), o['he']
    else: MISS.append(en); n += 1; continue
    ws.append(word(n, en, he, pos, '🎓')); n += 1
assert not MISS, MISS
out('acad', 'NAWL 1.2 – New Academic Word List (Browne, Culligan & Phillips 2013), CC BY-SA 4.0; Hebrew derived', ws, chunks(ws, 12))

# ---- tech (NCSAWL)
ws, n = [], 31001
for idx, en, pos, he in [(i,) + tuple(r) for i, r in enumerate(lines('tech_he.txt'))]:
    ws.append(word(n, en, he, pos, '💻')); n += 1
out('tech', 'NCSAWL – New Computer Science Academic Word List (Roesler 2021), CC BY 4.0; Hebrew derived (computing sense)', ws, chunks(ws, 12))

# ---- c2 (Octanove subset)
PO = {'noun': 'n', 'verb': 'v', 'adjective': 'adj', 'adverb': 'adv'}
ws, n = [], 32001
for en, pos, he in lines('c2_he.txt'):
    ws.append(word(n, en, he, PO.get(pos, pos), '💎')); n += 1
out('c2', 'Derived 300-word subset of the Octanove C1/C2 Vocabulary List (CC BY-SA 4.0), rule in tools/build_c2_list.py; Hebrew derived', ws, chunks(ws, 12))

json.dump({l: {str(k): v for k, v in sorted(TODO[l].items())} for l in TODO}, open(f'{X}/tts_todo.json', 'w'), ensure_ascii=False, indent=0)
print('TODO clips: en', len(TODO['en']), 'he', len(TODO['he']), 'chars en', sum(map(len, TODO['en'].values())), 'he', sum(map(len, TODO['he'].values())))
