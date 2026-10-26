#!/usr/bin/env python3
"""Reproducible C1 subset (bridge between the MoE Bands and c2; eq-3.4) (derived) — see LEVELS.md.
Rule: Octanove C1/C2 Vocabulary List (CC BY-SA 4.0) entries tagged C1, single lower-case word,
not already in any MoE band list / NAWL / NCSAWL, minus SENS (sensitive for teens), ODD (archaic/very
narrow) and HETERO (stress/voicing differs by part of speech, so a single audio clip would be ambiguous);
rank by wordfreq Zipf frequency (desc, tie: alphabetical) and keep the top 180.
Needs: pip install wordfreq; /workspace/eq-adv/octanove.csv + NAWL csv; writes tools/src/extra/c1_list.txt"""
import csv, json, re, os
from wordfreq import zipf_frequency as z
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADV = os.environ.get('EQ_ADV', '/workspace/eq-adv')
SENS = set('corpse interrogation hysterical hysteria paralysis apostle depressive crippling mercenary perverse depraved gout infernal'.split())
ODD = set('plum nigh epoxy acreage sulphur lark moor proximal genomic'.split())
HETERO = set('deliberate converse annex rebound overlay remit diffuse'.split())
ex = set()
for t in ['pre1', 'b1c1', 'b1c2', 'g7', 'g9', 'b3c1', 'b3c2']:
    for w in json.load(open(f'{ROOT}/data/{t}.json'))['words']: ex.add(w['en'].lower())
for f in ['acad_he_1.txt', 'acad_he_2.txt', 'tech_he.txt', 'c2_he.txt']:
    for l in open(f'{ROOT}/tools/src/extra/{f}'): ex.add(l.split('|')[0].lower())
ex |= {r['Meanings'].strip().lower() for r in csv.DictReader(open(f'{ADV}/NAWL_12_with_en_definitions.csv', encoding='utf-8-sig'))}
# C1 extra rule: skip inflected forms (plural, -ing, -ed) of a known or listed headword, and a few slang/adult items (SENS1)
SENS1 = set('gypsy lust woo con classy gig wicked prophet preacher preach salvation persecution traumatic psychiatrist'.split())
# odd tags (an everyday word given an unusual part of speech, e.g. automatic_v, absolute_n) and stress/voicing heteronyms
ODD1 = set('automatic absolute angle humble bald awe orphan batter convict jersey premier corps demo ego sap whilst stoke chill clutch prop lodge twitch slack stray plague rally charter drill anchor'.split())
ALL = list(csv.DictReader(open(f'{ADV}/octanove.csv', encoding='utf-8-sig')))
HW = {r['headword'].strip() for r in ALL}
BASE = HW | ex
def form_of(hw): return any(hw.endswith(x) and (b in BASE or b + 'e' in BASE or (b.endswith('i') and b[:-1] + 'y' in BASE) or (len(b) > 3 and b[-1] == b[-2] and b[:-1] in BASE))
                           for x in ('s', 'es', 'ing', 'ed', 'd') for b in [hw[:-len(x)]])
# the list has only C1/C2 tags, so a very frequent headword (Zipf >= 4.8, e.g. condition_v, angle_v) is a C1 *sense* of a word
# learners already know: skip it
ex |= SENS1 | ODD1 | {hw for hw in HW if form_of(hw) or z(hw, 'en') >= 4.8}
seen = {}
for r in csv.DictReader(open(f'{ADV}/octanove.csv', encoding='utf-8-sig')):
    hw = r['headword'].strip()
    if r['CEFR'].strip() != 'C1' or not re.fullmatch(r'[a-z]+', hw) or hw in ex or hw in seen or hw in SENS | ODD | HETERO: continue
    seen[hw] = r['pos']
c = sorted(seen, key=lambda w: (-z(w, 'en'), w))[:180]
open(f'{ROOT}/tools/src/extra/c1_list.txt', 'w').write('\n'.join(f'{w}|{seen[w]}|{z(w, "en"):.2f}' for w in c) + '\n')
print(len(c), c[-10:])
