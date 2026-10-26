# verify3.py out.jsonl a:word[:p] ... : review #5 three-model check of one EN clip (same method as reviewer #5):
#  whisper small.en, medium.en and large-v3-turbo (deepdml ct2, int8) at 0.3 s and 0.6 s zero pads = 6 transcripts;
#  wav2vec2 phoneme first sound voted over 5 pads (check.judge), with h/v/g/w added to the expected onsets so m->n, b->d, h->(none)
#  are rejected.  ':p' = context phrase (any token may carry the word).  ok = word right in >=4/6 runs and onset >=3/5 (or n/a).
import sys,os,json,re,subprocess,numpy as np
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','r4')); import check
from faster_whisper import WhisperModel
check.EXP.update({'h':'h','v':'v','g':'ɡg','w':'w'})
R=check.R; _W={}
def W(k):
    if k not in _W: _W[k]=WhisperModel({'sm':'small.en','md':'medium.en','tu':'deepdml/faster-whisper-large-v3-turbo-ct2'}[k],device='cpu',compute_type='int8',cpu_threads=4)
    return _W[k]
def ok(word,text,phrase):
    return check.word_ok(word,text) or (phrase and any(check.word_ok(word,t) for t in re.findall(r"[A-Za-z']+",text or '')))
def verify(path,word,phrase=False):
    y=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',path,'-f','f32le','-ar','16000','-ac','1','-'],capture_output=True).stdout,np.float32)
    runs=[]
    for k in ('sm','md','tu'):
        for pad in (0.3,0.6):
            x=np.concatenate([np.zeros(int(pad*16000),np.float32),y,np.zeros(11200,np.float32)])
            t=' '.join(s.text for s in W(k).transcribe(x,language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False)[0]).strip()
            runs.append({'m':k,'pad':pad,'t':t,'ok':ok(word,t,phrase)})
    j=check.judge(path,word)
    nok=sum(r['ok'] for r in runs); ons=j['onset_robust']
    return {'file':os.path.basename(path),'word':word,'phrase':phrase,'runs':runs,'word_ok_runs':nok,'ph':j['ph'],'onset_votes':j['onset_votes'],
            'onset':ons,'lead':j['lead'],'ok':nok>=4 and ons is not False}
if __name__=='__main__':
    out=sys.argv[1]; fo=open(out,'a')
    for arg in sys.argv[2:]:
        p=arg.split(':'); path=p[0] if p[0].endswith('.mp3') else f"{R}/audio/en/{int(p[0]):04d}.mp3"
        r=verify(path,p[1],len(p)>2); fo.write(json.dumps(r,ensure_ascii=False)+'\n'); fo.flush()
        print(r['file'],r['word'],'runs %d/6'%r['word_ok_runs'],'onset',r['onset_votes'],r['onset'],'OK' if r['ok'] else 'FAIL',flush=True)
    print('V3DONE')
