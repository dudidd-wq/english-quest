# check.py out.jsonl [ids...] : automatic dual check of EN clips (review #4, same method as the reviewer's run.py/an.py):
#  word test  = faster-whisper small.en (int8, beam 5, 0.5 s/0.7 s zero pad); medium.en second opinion when small misses
#  sound test = wav2vec2-lv-60-espeak phonemes: first phoneme must match the first letter (b m p d l r n t s f k)
#  robust sound test: the CTC phoneme model flips b<->v/d with 5-10 ms framing shifts of the SAME audio (measured), so the
#               onset is also voted over 5 leading pads (0.40/0.45/0.50/0.55/0.60 s); onset_robust = majority
#  lead       = ms before first sample > 2% of peak (16 kHz)
# Default set: every EN clip in data/*.json whose word is alphabetic and <=4 letters. Resumable (skips done clips).
import sys,os,json,glob,re,subprocess,difflib,numpy as np,torch
from faster_whisper import WhisperModel
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2CTCTokenizer, Wav2Vec2ForCTC
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HOMO=[{'bear','bare'},{'be','bee','b'},{'by','bye','buy'},{'pi','pie'},{'pea','pee','p'},{'mail','male'},{'pain','pane'},{'pail','pale'},
 {'peek','peak'},{'pair','pear','pare'},{'meet','meat'},{'made','maid'},{'mind','mined'},{'bin','been'},{'bury','berry'},{'bored','board'},
 {'bow','bough'},{'bean','been'},{'brake','break'},{'mere','mir'},{'pore','pour','poor','paw'},{'peel','peal'},{'but','butt'},{'minor','miner'},
 {'bay','bey'},{'pause','paws'},{'role','roll'},{'sale','sail'},{'son','sun'},{'tail','tale'},{'wait','weight'},{'week','weak'},{'wear','where'},
 {'hour','our'},{'know','no'},{'right','write'},{'sea','see'},{'two','to','too'},{'one','won'},{'eight','ate'},{'for','four'},{'new','knew'},
 {'hear','here'},{'their','there'},{'road','rode'},{'flour','flower'},{'fair','fare'},{'deer','dear'},{'die','dye'},{'mist','missed'}]
EXP={'b':'b','m':'m','p':'p','d':'d','l':'l','r':'ɹr','n':'n','t':'t','s':'s','f':'f','k':'k'}
nz=lambda s:re.sub(r'[^a-z]','',s.lower())
def word_ok(w,h):
    w,h=nz(w),nz(h); return h==w or any(w in s and h in s for s in HOMO)
def onset_ok(w,ph):
    w=w.lower(); ph=ph.replace('ˈ','').replace('ˌ','').strip(); c=w[0]
    if w[:2] in('sh','th','ch','kn','ph','wr','ps','pn') or c not in EXP: return None
    return bool(ph) and ph[0] in EXP[c]
def clips():
    M={}
    for f in sorted(glob.glob(R+'/data/*.json')):
        d=json.load(open(f))
        if not isinstance(d,dict) or not isinstance(d.get('words'),list): continue
        for w in d['words']:
            a=w.get('ae')
            if a and re.fullmatch(r'[A-Za-z]{1,4}',w['en']) and a not in M: M[a]=w['en']
    return M
_M={}
def _models():
    if not _M:
        torch.set_num_threads(4); P='facebook/wav2vec2-lv-60-espeak-cv-ft'
        _M.update(sm=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=4),md=None,fe=Wav2Vec2FeatureExtractor.from_pretrained(P),
                  tk=Wav2Vec2CTCTokenizer.from_pretrained(P),mod=Wav2Vec2ForCTC.from_pretrained(P).eval())
    return _M
def _tr(m,x): return ' '.join(t.text for t in m.transcribe(x,language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False)[0]).strip()
def judge(path,w,always_medium=False):
    M=_models(); y=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',path,'-f','f32le','-ar','16000','-ac','1','-'],capture_output=True).stdout,np.float32)
    pk=np.abs(y).max()+1e-9; lead=float(np.argmax(np.abs(y)>0.02*pk)/16)
    x=np.concatenate([np.zeros(8000,np.float32),y,np.zeros(11200,np.float32)])
    s=_tr(M['sm'],x); m=''
    if always_medium or not word_ok(w,s):
        M['md']=M['md'] or WhisperModel('medium.en',device='cpu',compute_type='int8',cpu_threads=4); m=_tr(M['md'],x)
    def P(x):
        with torch.no_grad(): return M['tk'].batch_decode(M['mod'](M['fe'](x,sampling_rate=16000,return_tensors='pt').input_values).logits.argmax(-1))[0]
    ph=P(x); votes=[onset_ok(w,P(np.concatenate([np.zeros(int(p*16000),np.float32),y,np.zeros(11200,np.float32)]))) for p in (0.4,0.45,0.55,0.6)]+[onset_ok(w,ph)]
    rob=None if votes[-1] is None else sum(v is True for v in votes)>=3
    return {'onset_votes':sum(v is True for v in votes),'onset_robust':rob,'en':w,'small':s,'medium':m,'ph':ph,'word_small':word_ok(w,s),'word_any':word_ok(w,s) or word_ok(w,m),'onset':onset_ok(w,ph),'lead':round(lead,1)}
if __name__=='__main__':
    out=sys.argv[1]; M=clips(); ids=[int(x) for x in sys.argv[2:]] or sorted(M)
    done={json.loads(l)['clip'] for l in open(out)} if os.path.exists(out) else set(); fo=open(out,'a')
    for a in ids:
        if a in done: continue
        fo.write(json.dumps({'clip':a,**judge(f'{R}/audio/en/{a:04d}.mp3',M.get(a,'?'))})+'\n'); fo.flush()
    print('CKDONE',flush=True)
