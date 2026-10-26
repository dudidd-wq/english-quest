# sweep.py : Whisper small + phonemes on every EN clip <=4 letters or b/m/p-initial; medium only when small or onset fails
import sys,re,json; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import *; from fix import ok,onset
M=clipmap(); R_='/workspace/english-quest'
S=sorted(a for a,(w,t) in M.items() if (a<20000 or a>=21000) and re.fullmatch(r'[A-Za-z]+',w['en']) and (len(w['en'])<=4 or w['en'][0].lower() in 'bmp'))
out=open('/tmp/r3_sweep.jsonl','a'); done={json.loads(l)['a'] for l in open('/tmp/r3_sweep.jsonl')} if os.path.exists('/tmp/r3_sweep.jsonl') else set()
for a in S:
    if a in done: continue
    w=M[a][0]['en']; f=f'{R_}/audio/en/{a:04d}.mp3'
    s=asr(f); p=ph(f); r={'a':a,'w':w,'s':s,'p':p,'ok_s':ok(w,s),'ok_p':onset(w,p)}
    if not (r['ok_s'] and r['ok_p']): m=asr(f,'medium.en'); r.update(m=m,ok_m=ok(w,m))
    out.write(json.dumps(r)+'\n'); out.flush()
print('done',len(S))
