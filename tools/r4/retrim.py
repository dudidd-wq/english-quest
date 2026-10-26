# retrim.py : re-trim every EN clip from its raw TTS source with the current NORM (-60 dB, 0.12 s lead, 0.15 s tail).
# Safety: the voiced span (first..last sample >2% of peak) must match the installed clip within 80 ms, else the clip is
# only padded with leading silence to >=120 ms (no re-encode of the speech). Output: staging dir + jsonl log.
import sys,os,glob,json,subprocess,numpy as np
from concurrent.futures import ProcessPoolExecutor
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from src import source, proc, R
OUT='/workspace/eq-tts/r4/retrim'; os.makedirs(OUT,exist_ok=True)
SKIP={8057,8455}   # "Word... word." 2nd-token cuts (re-recorded in R4 anyway)
def pcm(p): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32)
def span(p):
    y=pcm(p); pk=np.abs(y).max() or 1; i=np.nonzero(np.abs(y)>0.02*pk)[0]
    return (i[0]/16, i[-1]/16, len(y)/16) if len(i) else (0,0,len(y)/16)   # ms
def pad(src,dst,ms):
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-af',f'adelay={int(ms)}:all=1','-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','-map_metadata','-1',dst],check=True)
def one(a):
    cur=f'{R}/audio/en/{a:04d}.mp3'; d=f'{OUT}/{a:04d}.mp3'; c=span(cur); r={'a':a,'lead0':round(c[0]),'core0':round(c[1]-c[0])}
    s,_=source(a) if a not in SKIP else (None,None)
    if s:
        proc(s,d); n=span(d); r.update(mode='raw',lead=round(n[0]),core=round(n[1]-n[0]))
        if abs(r['core']-r['core0'])<=80 and n[0]>=110: return r
        r['mode']='raw-mismatch'
    if c[0]>=120: r.update(mode='keep',lead=round(c[0])); os.path.exists(d) and os.remove(d); return r
    pad(cur,d,125-c[0]); n=span(d); r.update(mode=r.get('mode','')+'pad',lead=round(n[0]),core=round(n[1]-n[0])); return r
if __name__=='__main__':
    files=sorted(int(os.path.basename(f)[:-4]) for f in glob.glob(R+'/audio/en/*.mp3'))
    L=f'{OUT}.jsonl'; done={json.loads(l)['a'] for l in open(L)} if os.path.exists(L) else set()
    todo=[a for a in files if a not in done]; print('todo',len(todo),flush=True)
    with ProcessPoolExecutor(7) as ex, open(L,'a') as f:
        for i,r in enumerate(ex.map(one,todo,chunksize=8)):
            f.write(json.dumps(r)+'\n')
            if i%500==0: f.flush(); print(i,flush=True)
    print('RDONE',flush=True)
