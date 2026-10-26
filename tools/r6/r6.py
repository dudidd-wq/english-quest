# r6.py : review #6 lows — re-record considerate (plain "considerate.") and bay, judged by verify3 (Whisper small/medium/
# large-v3-turbo x 2 pads) PLUS a wav2vec2 phoneme check at 5 leading offsets 0.0-0.4 s (reviewer #6 method):
#   bay: first phoneme b at ALL offsets; considerate: k onset and adjective ending /-ɪt|-ət/ (not verb /-eɪt/) at ALL offsets.
# Single encode from raw TTS (NORM, adelay padded to ~130 ms lead). usage: r6.py eval <mp3:word>... | gen
import sys,os,json,re,subprocess,numpy as np
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','r5'))
import voices as V, verify3 as V3, check, torch
G=V.G; OUT='/workspace/eq-tts/r6'; ROOT=V.R
VID={'Sarah':'EXAVITQu4vr4xnSDxMaL','Alice':'Xb7hH8MSUJpSbSDYk0k2','Bella':'hpp4J3VqNfWAUOO0d1Us','Matilda':'XrExE9yKIg1WjnnlVkGX'}
def load(p): return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',p,'-f','f32le','-ar','16000','-ac','1','-'],capture_output=True).stdout,np.float32)
def lead(p): y=load(p); pk=np.abs(y).max()+1e-9; return float(np.argmax(np.abs(y)>0.02*pk)/16)
def phs(p):
    M=check._models(); y=load(p); r=[]
    for o in (0.0,0.1,0.2,0.3,0.4):
        x=np.concatenate([np.zeros(int(o*16000),np.float32),y,np.zeros(11200,np.float32)])
        with torch.no_grad(): r.append(M['tk'].batch_decode(M['mod'](M['fe'](x,sampling_rate=16000,return_tensors='pt').input_values).logits.argmax(-1))[0])
    return r
PH=''
def phok(word,ph):
    s=ph.replace(' ','')
    if word=='bay': return s.startswith('b') and 'eɪ' in s
    if word=='considerate' and ',' in PH: return s.startswith('k') and 'sɪdɚ' in s and 'eɪt' not in s
    if word=='considerate': return s.startswith('k') and bool(re.search(r'(ɪ|ə|ᵻ)t$',s)) and not s.endswith('eɪt')
    return None
def build(raw,dst,pad=0,gain=0):
    norm=G['NORM'].replace('adelay=95:all=1',f'adelay={95+pad}:all=1')
    if gain: norm=norm.replace(',adelay=',f',volume={gain:.2f}dB,adelay=')
    a=['ffmpeg','-v','error','-y','-i',raw]; tail=['-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','-map_metadata','-1',dst]
    if subprocess.run(a+['-af',norm]+tail).returncode==0: return
    trim,rest=norm.split(',loudnorm',1); w=dst+'.wav'
    subprocess.run(a+['-af',trim,w],check=True); subprocess.run(['ffmpeg','-v','error','-y','-i',w,'-af','loudnorm'+rest]+tail,check=True); os.remove(w)
def evaluate(p,word,**kw):
    r=V3.verify(p,word,',' in PH); P=phs(p); r.update(kw); r.update(ph5=P,ph_ok=sum(bool(phok(word,x)) for x in P),lufs=V.lufs(p),lead=round(lead(p),1))
    r['best']=r['word_ok_runs']>=4 and r['ph_ok']==5
    return r
JOBS=[('considerate','Sarah','considerate.'),('considerate','Alice','considerate.'),('considerate','Sarah','Considerate.'),('considerate','Alice','Considerate.'),
      ('bay','Alice','Bay.'),('bay','Sarah','Bay.'),('bay','Bella','Bay.')]
JOBS2=[('considerate','Sarah','Considerate, as in a considerate friend.'),('considerate','Alice','Considerate, as in a considerate friend.')]
if __name__=='__main__':
    if sys.argv[1]=='gen2': JOBS=JOBS2
    fo=open(OUT+'/r6.jsonl','a')
    def show(r): print(r.get('voice','cur'),repr(r.get('text',r['file'])),'stt %d/6'%r['word_ok_runs'],'ph %d/5'%r['ph_ok'],r['ph5'],'lead',r['lead'],'lufs',r['lufs'],'BEST' if r['best'] else '',[x['t'] for x in r['runs']],flush=True)
    if sys.argv[1]=='eval':
        for a in sys.argv[2:]:
            p,w=a.split(':'); r=evaluate(p,w,cur=True); fo.write(json.dumps(r,ensure_ascii=False)+'\n'); show(r)
    else:
        st=G['ledger_state']()
        for word,vn,t in JOBS:
            if V.ledger()+30>V.LMAX: print('LEDGER CAP',V.ledger(),flush=True); break
            v=VID[vn]; s,c=G['synth'](t,v,'en',st); raw=G['cpath'](t,v,'en')
            if not os.path.exists(raw): print('synth fail',t,s,flush=True); continue
            d=f'{OUT}/{word}_{vn}_{sys.argv[1]}{JOBS.index((word,vn,t))}.mp3'; build(raw,d); l=lead(d); L=V.lufs(d)
            build(raw,d,max(0,int(round(130-l))),-18.2-L if abs(L+18.2)>0.6 else 0)
            PH=t; r=evaluate(d,word,voice=vn,voice_id=v,text=t,cost=c,raw=raw); fo.write(json.dumps(r,ensure_ascii=False)+'\n'); show(r)
    print('R6DONE ledger',V.ledger(),flush=True)
