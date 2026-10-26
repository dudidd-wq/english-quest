# try.py id "text1" "text2" ... : synth each text, re-process, score; install the best if it beats the current clip
import sys,shutil,json; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import *; from fix import score
M=clipmap(); state=G['ledger_state'](); a=int(sys.argv[1]); w,t=M[a]; word=w['en']; cur=f'{R}/audio/en/{a:04d}.mp3'
b=score(word,cur); best=(b[0],None,None); log=[f'cur {b[0]} {b[1]}']; cost=0
for v in sys.argv[2:]:
    if best[0]==3: break
    st,c=G['synth'](v,G['EN_VOICE'],'en',state); cost+=c; src=raw(v)
    if not src: log.append(f'{v} fail'); continue
    d=f'/tmp/r3t_{a}_{abs(hash(v))%10**6}.mp3'; proc(src,d); sc=score(word,d); log.append(f'{v} {sc[0]} {sc[1]}')
    if sc[0]>best[0]: best=(sc[0],d,v)
if best[1]:
    shutil.copy(best[1],cur); L='/tmp/r3_try.jsonl'; open(L,'a').write(json.dumps({'clip':a,'say':best[2],'word':word})+'\n')
print(a,word,'|',' || '.join(log),'=>',best[2] or 'keep',best[0],'cost',cost,flush=True)
