# rejudge.py check.jsonl : second, independent pass over every clip that failed in check.jsonl (rates.py must have written check.jsonl.fails.json).
# Whisper occasionally returns an empty transcript for a short clip on one pass; a clip is counted as a CONSISTENT failure only if it fails again.
import sys,json,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
src=sys.argv[1]; sys.argv=[sys.argv[0]]
import check
M=check.clips(); F=json.load(open(src+'.fails.json')); out=src+'.rejudge.jsonl'
done={json.loads(l)['clip'] for l in open(out)} if os.path.exists(out) else set()
with open(out,'a') as fo:
    for k,v in F.items():
        for x in v:
            a=int(x.split(':')[0])
            if a in done or a not in M: continue
            r=check.judge(f"{check.R}/audio/en/{a:04d}.mp3",M[a]); r['clip']=a; r['en']=M[a]
            fo.write(json.dumps(r,ensure_ascii=False)+'\n'); fo.flush()
cons=[]
for l in open(out):
    j=json.loads(l)
    if j['clip'] not in M: continue
    wa=not check.word_ok(M[j['clip']],j['small']) and not check.word_ok(M[j['clip']],j['medium'] or '')
    if wa or j['onset_robust'] is False: cons.append(f"{j['clip']}:{M[j['clip']]}|{j['small']}|{j['medium']}|{j['ph']}")
print('consistent fails',len(cons)); print('\n'.join(cons)); print('RJDONE')
