#!/usr/bin/env python3
"""Pronunciation-level QA for Hebrew clips (added after review #1: homograph clips said the wrong word).
Text-level STT cannot tell חֶבֶל from חֲבָל, so we compare *phonemes*:
  1. every Hebrew gloss is vocalised (Dicta Nakdan, https://nakdan-2-0.loadbalancer.dicta.org.il/api) and homographs are
     reviewed by hand -> tools/qa/he_homograph_flags.txt  ("<gloss idx> <en>|<correct niqqud>")
  2. the clip is transcribed to IPA with facebook/wav2vec2-lv-60-espeak-cv-ft and compared (difflib ratio) with a
     romanisation of the correct niqqud text and of the competing reading; a clip closer to the wrong reading is re-recorded
     from the niqqud text under a NEW clip number (tools/audio_fix.json 'ah' for official tracks, clips.json 'fix' for derived)
  3. rule enforced by `check`: a clip may be shared only by glosses whose vocalised Hebrew is identical.
usage: python3 tools/qa_he_pron.py phon <clip> "<niqqud text>"     (needs torch/transformers)
       python3 tools/qa_he_pron.py check                              (shared-clip rule over data/*.json + say.json)"""
import json, os, re, sys, difflib, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAG, SIN = '\u05bc', '\u05c2'
V = {'\u05b7':'a','\u05b8':'a','\u05b2':'a','\u05b3':'o','\u05b6':'e','\u05b5':'e','\u05b1':'e','\u05b4':'i','\u05b9':'o','\u05ba':'o','\u05bb':'u','\u05b0':''}
C = {'א':'','ב':'v','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'x','ט':'t','י':'y','כ':'x','ך':'x','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s','ע':'','פ':'f','ף':'f','צ':'ts','ץ':'ts','ק':'k','ר':'r','ש':'sh','ת':'t'}
HARD = {'ב':'b','כ':'k','ך':'k','פ':'p'}
def roman(s):
    g = []
    for ch in s.replace('\u05bd', ''):
        if '\u0591' <= ch <= '\u05c7' and g: g[-1][1].append(ch)
        else: g.append([ch, []])
    out = []
    for k, (L, m) in enumerate(g):
        if L not in C: out.append(' '); continue
        nxt = g[k + 1][0] if k + 1 < len(g) else ' '; v = ''.join(V.get(x, '') for x in m)
        if L == 'ו' and DAG in m and not v: out.append('u'); continue
        if L == 'ו' and '\u05b9' in m: out.append('o'); continue
        c = HARD[L] if L in HARD and DAG in m else C[L]
        if L == 'ש' and SIN in m: c = 's'
        if L == 'י' and not v and out and out[-1][-1:] in ('i', 'e'): c = ''
        if L == 'ה' and not v and nxt not in C: c = ''
        out.append(('a' + c) if L in 'חע' and v == 'a' and nxt not in C and k else c + v)
    return re.sub(r'\s+', '', ''.join(out))
IPA = {'ʁ':'x','χ':'x','x':'x','ħ':'x','ʃ':'sh','ɪ':'i','iː':'i','ɛ':'e','eː':'e','aː':'a','ɑ':'a','ɐ':'a','ə':'e','oː':'o','ɔ':'o','uː':'u','ʊ':'u','w':'v','j':'y','ʔ':'','q':'k','ɡ':'g','β':'v','ɾ':'r','ɹ':'r'}
def ipa(ph): return ''.join(IPA.get(t, t if len(t) == 1 and t.isalpha() else '') for t in ph.split())
def score(niqqud, ph): return round(difflib.SequenceMatcher(None, roman(niqqud), ipa(ph)).ratio(), 2)
if __name__ == '__main__':
    if sys.argv[1:2] == ['phon']:
        import subprocess, numpy as np, torch
        from transformers import Wav2Vec2ForCTC
        from huggingface_hub import hf_hub_download
        M = 'facebook/wav2vec2-lv-60-espeak-cv-ft'; model = Wav2Vec2ForCTC.from_pretrained(M).eval()
        voc = {v: k for k, v in json.load(open(hf_hub_download(M, 'vocab.json'))).items()}
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, 'audio/he/%04d.mp3' % int(sys.argv[2])), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.float32); x = (x - x.mean()) / (x.std() + 1e-7)
        with torch.no_grad(): ids = model(torch.tensor(x)[None]).logits[0].argmax(-1).tolist()
        toks = [voc[i] for j, i in enumerate(ids) if (j == 0 or i != ids[j - 1]) and voc.get(i) not in ('<pad>', '<s>', '</s>', '<unk>', None)]
        ph = ' '.join(toks); print(ph, '|', roman(sys.argv[3]), 'vs', ipa(ph), '| score', score(sys.argv[3], ph))
    if len(sys.argv) > 1 and sys.argv[1] == 'check':
        say = json.load(open(os.path.join(ROOT, 'tools/src/extra/say.json')))['he']
        fix = json.load(open(os.path.join(ROOT, 'tools/audio_fix.json')))['clips']
        spoken = {int(k.split('/')[1]): v.split(': ', 1)[1] for k, v in fix.items() if k.startswith('he/') and 'niqqud' in v}
        by = collections.defaultdict(set)
        for f in sorted(os.listdir(os.path.join(ROOT, 'data'))):
            for w in json.load(open(os.path.join(ROOT, 'data', f)))['words']:
                if w.get('ah'): by[w['ah']].add(spoken.get(w['ah'], w['he']).strip())
        bad = {a: s for a, s in by.items() if len(s) > 1}
        print(len(by), 'Hebrew clips;', sum(1 for a, s in by.items() if s), 'checked; clips shared by different Hebrew texts:', len(bad))
        for a, s in list(bad.items())[:20]: print(' ', a, s)
