# dbl.py ids... : synth "Word... word." and keep the 2nd token (onset follows a pause, so the closure is articulated)
import sys,json,shutil,subprocess,re; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import *; from fix import score
def second(src,dst):
    o=subprocess.run(['ffmpeg','-i',src,'-af','silencedetect=noise=-45dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
    ss=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',o)]; se=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',o)]
    mids=[(s,e) for s,e in zip(ss,se) if s>0.15]
    if not mids: return False
    s,e=max(mids,key=lambda x:x[1]-x[0]); cut=max(s,e-0.2)
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(cut),'-i',src,dst],check=True); return True
if __name__=='__main__':
    M=clipmap(); state=G['ledger_state'](); cost=0
    for a in map(int,sys.argv[1:]):
        w,t=M[a]; word=w['en']; W=word[:1].upper()+word[1:]; cur=f'{R}/audio/en/{a:04d}.mp3'
        b=score(word,cur); log=[f'cur {b[0]} {b[1]}']; best=(b[0],None)
        for v in [f'{W}... {word}.', f'{W}, {word}!']:
            if best[0]==3: break
            st,c=G['synth'](v,G['EN_VOICE'],'en',state); cost+=c; src=raw(v)
            if not src: continue
            t2=f'/tmp/r3d_{a}_{len(v)}.mp3'; d=f'/tmp/r3d_{a}_{len(v)}n.mp3'
            if not second(src,t2): log.append(f'{v} nosplit'); continue
            proc(t2,d); sc=score(word,d); log.append(f'{v} {sc[0]} {sc[1]}')
            if sc[0]>best[0]: best=(sc[0],d,v)
        if best[1]: shutil.copy(best[1],cur)
        print(a,word,'|',' || '.join(log),'=>',best[2] if best[1] else 'keep',best[0],flush=True)
    print('cost',cost)
