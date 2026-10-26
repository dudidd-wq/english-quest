# rates.py check.jsonl : failure rates of the dual check over the clips CURRENTLY used by the app (tools/r4/check.py clips())
import sys,json,os,collections; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import importlib.util; src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'check.py')).read().split('import sys,os')[0]
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'check.py')).read().split('from faster_whisper')[0]+open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'check.py')).read().split("EXP={")[0].split('Wav2Vec2ForCTC\n')[1]+"EXP={"+open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'check.py')).read().split("EXP={")[1].split('_M={}')[0])
M=clips(); L={}
for l in open(sys.argv[1]): j=json.loads(l); L[j['clip']]=j
miss=[a for a in M if a not in L]; rows=collections.defaultdict(lambda:[0,0,0,0,[],0])
for a,w in M.items():
    if a not in L: continue
    j=L[a]; c=w[0].lower(); k=c if c in 'bmp' else ('ctrl' if c in 'dlrntsfk' else 'other')
    r=rows[k]; r[0]+=1; o1=j['onset'] is False; o=j['onset_robust'] is False; r[5]+=o1; ws=not word_ok(w,j['small']); wa=ws and not word_ok(w,j['medium'] or '')
    r[1]+=o; r[2]+=ws; r[3]+=wa
    if o or wa: r[4].append(f"{a}:{w}|{j['small']}|{j['medium']}|{j['ph']}")
for k in ['b','m','p','ctrl','other']:
    n,o,ws,wa,f,o1=rows[k]
    if n: print(f"{k:5} n={n:4} onset-fail single-pad {o1} ({100*o1/n:.1f}%) robust {o} ({100*o/n:.1f}%)  word-fail small {ws} ({100*ws/n:.1f}%)  both models {wa} ({100*wa/n:.1f}%)  any-fail {len(f)} ({100*len(f)/n:.1f}%)")
print('not yet checked',len(miss))
json.dump({k:v[4] for k,v in rows.items()},open(sys.argv[1]+'.fails.json','w'),indent=0)
