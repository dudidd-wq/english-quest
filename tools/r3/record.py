# record.py : write chosen texts of re-recorded EN clips into tts_overrides.json (core, by word n) / say.json (extra, by clip id); list REFRESH urls
import json,glob,os
R='/workspace/english-quest'; os.chdir(R)
fixed={}
for f in sorted(glob.glob('/tmp/r3_fixed_*.json')):
    for j in json.load(open(f)): fixed[j['clip']]=j['say']
if os.path.exists('/tmp/r3_try.jsonl'):
    for l in open('/tmp/r3_try.jsonl'): j=json.loads(l); fixed[j['clip']]=j['say']
SPECIAL={8057:'Bay... bay.',8455:'Melt... melt.'}   # 2nd token kept (eq-tts/r3/dbl.py)
fixed.update(SPECIAL); fixed.setdefault(20013,None)
extra=json.load(open('/tmp/r3_extra.json')) if os.path.exists('/tmp/r3_extra.json') else {}
fixed.update({int(k):v for k,v in extra.items()})
byae={}
for f in glob.glob('data/*.json'):
    try: d=json.load(open(f))
    except Exception: continue
    if isinstance(d,dict) and 'words' in d:
        for w in d['words']:
            if w.get('ae'): byae.setdefault(w['ae'],set()).add(w['n'])
po='tools/src/tts_overrides.json'; O=json.load(open(po)); ps='tools/src/extra/say.json'; S=json.load(open(ps))
for c,say in fixed.items():
    if not say: continue
    if c>=20000: S['en'][str(c)]=say
    else:
        for n in byae.get(c,{c}): O['en'][str(n)]=say
json.dump(O,open(po,'w'),ensure_ascii=False,indent=1); json.dump(S,open(ps,'w'),ensure_ascii=False,indent=1)
json.dump(sorted(fixed),open('/tmp/r3_refresh.json','w')); print(len(fixed),'clips')
