# topup.py : after retrim.py — redo 'error' rows one at a time, then pad any staged/kept clip whose lead (2%-of-peak, 16 kHz,
# the reviewer's metric) is < 125 ms up to ~135 ms. Writes retrim_final.jsonl {a, lead, src}.
import sys,os,json,shutil
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from retrim import one, span, pad, OUT, R
rows={}
for l in open(OUT+'.jsonl'): r=json.loads(l); rows[r['a']]=r
for a,r in list(rows.items()):   # 'error' = ffmpeg aborts on the raw (deterministic, e.g. 681): pad the installed clip instead
    d=f'{OUT}/{a:04d}.mp3'
    if os.path.exists(d) and os.path.getsize(d)<500: os.remove(d)
out=open(OUT+'_final.jsonl','w')
for a,r in sorted(rows.items()):
    d=f'{OUT}/{a:04d}.mp3'; src=d if os.path.exists(d) else f'{R}/audio/en/{a:04d}.mp3'
    s=span(src)
    if s[0]<125:
        t=d+'.tmp.mp3'; shutil.copy(src,t); pad(t,d,135-s[0]); os.remove(t); s=span(d)
    out.write(json.dumps({'a':a,'mode':r.get('mode'),'lead':round(s[0]),'staged':os.path.exists(d)})+'\n')
print('TDONE',flush=True)
