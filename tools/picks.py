import json,sys,re
t=sys.argv[1]; k=int(sys.argv[2])
d=json.load(open(f'data/{t}.json')); W={w['n']:w for w in d['words']}
for i,s in enumerate(d['stages']):
    ws=[W[n] for n in s]
    good=[w for w in ws if re.fullmatch(r"[A-Za-z'-]+",w['en']) and w['pos'] not in ('det','pron','prep','conj','')]
    good.sort(key=lambda w:(w['rp']!='Prod', len(w['en'])<3))
    seen=set();pick=[]
    for w in good:
        if w['pos'] in seen and len(set(x['pos'] for x in good))>=k: continue
        pick.append(w);seen.add(w['pos'])
        if len(pick)==k:break
    for w in good:
        if len(pick)<k and w not in pick: pick.append(w)
    print(f'#S{i+1}: '+', '.join(f"{w['n']} {w['en']}({w['pos']}) {w['he']}" for w in pick))
