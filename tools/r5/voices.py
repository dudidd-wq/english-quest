# voices.py : review #5 prep – re-record the words whose Matilda clips still fail the audio checks with OTHER ElevenLabs
# default (premade) voices, 2 takes each, judged with the round-4 dual check (tools/r4/check.py judge: Whisper small.en
# + medium.en whole-word test, wav2vec2 5-offset first-sound vote) on TWO passes (a take counts only if it passes both),
# plus a WavLM speaker-embedding similarity to Matilda so the closest-sounding voice wins. Same NORM as every clip
# (−60 dB trim, loudnorm I=−18, 95 ms adelay → ≥120 ms lead). Nothing is installed here; results -> /workspace/eq-tts/r5/.
# env LEDGER_MAX = stop before the billing ledger total would pass it.
import sys,os,json,re,glob,random,subprocess,numpy as np
sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import G,R,A
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','r4')); import check
VOICES={'XrExE9yKIg1WjnnlVkGX':'Matilda','hpp4J3VqNfWAUOO0d1Us':'Bella','EXAVITQu4vr4xnSDxMaL':'Sarah','Xb7hH8MSUJpSbSDYk0k2':'Alice'}
CAND=['hpp4J3VqNfWAUOO0d1Us','EXAVITQu4vr4xnSDxMaL','Xb7hH8MSUJpSbSDYk0k2']
# current clip, word, recording texts (2 takes); bare is a homophone of bear -> context phrase (as in round 4)
WORDS=[(1132,'bill',None),(58057,'bay',None),(62009,'mere',None),(578,'medal',None),(50402,'hall',None),(405,'hard',None),
       (61021,'hull',None),(69051,'bare',['Bare, as in bare feet.','bare, as in bare feet.']),(1417,'few',None),(8853,'vary',None),(9148,'chew',None)]
OUT='/workspace/eq-tts/r5'; LMAX=int(os.environ.get('LEDGER_MAX','38484'))
def ledger(): return sum(json.loads(l).get('cost',0) for l in open('/workspace/eq-tts/ledger.jsonl'))
def proc(src,dst):
    a=['ffmpeg','-v','error','-y','-i',src]; tail=['-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','-map_metadata','-1',dst]
    if subprocess.run(a+['-af',G['NORM']]+tail).returncode==0: return
    trim,rest=G['NORM'].split(',loudnorm',1); w=dst+'.wav'   # ffmpeg 'best_input' abort on some raws: two passes
    subprocess.run(a+['-af',trim,w],check=True); subprocess.run(['ffmpeg','-v','error','-y','-i',w,'-af','loudnorm'+rest]+tail,check=True); os.remove(w)
def lufs(p):
    e=subprocess.run(['ffmpeg','-nostats','-i',p,'-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
    m=re.findall(r'I:\s+(-?[\d.]+) LUFS',e); return float(m[-1]) if m else None
_E={}
def emb(p):
    import torch
    if not _E:
        from transformers import AutoFeatureExtractor, WavLMForXVector
        _E['fe']=AutoFeatureExtractor.from_pretrained('microsoft/wavlm-base-plus-sv'); _E['m']=WavLMForXVector.from_pretrained('microsoft/wavlm-base-plus-sv').eval()
    x=A(p); i=_E['fe'](x,sampling_rate=16000,return_tensors='pt')
    with torch.no_grad(): v=_E['m'](**i).embeddings[0].numpy()
    return v/np.linalg.norm(v)
def matilda_ref():
    f=OUT+'/matilda_ref.npy'
    if os.path.exists(f): return np.load(f)
    M=check.clips(); random.seed(5); ids=random.sample(sorted(a for a in M if a<40000),40)
    v=np.mean([emb(f'{R}/audio/en/{a:04d}.mp3') for a in ids],0); v/=np.linalg.norm(v); np.save(f,v); return v
def wok(word,text,phrase):
    if not phrase: return check.word_ok(word,text)
    return any(check.word_ok(word,t) for t in re.findall(r"[A-Za-z']+",text or ''))
def judge2(p,word,phrase):
    js=[check.judge(p,word,True) for _ in range(2)]
    r=[]
    for j in js:
        ws=wok(word,j['small'],phrase); wa=ws or wok(word,j['medium'],phrase)
        r.append({'small':j['small'],'medium':j['medium'],'ph':j['ph'],'votes':j['onset_votes'],'onset':j['onset_robust'],'word_small':ws,'word_any':wa,
                  'score':2*ws+wa+2*(j['onset_robust'] is not False)})
    return {'passes':r,'score':min(x['score'] for x in r),'lead':js[0]['lead'],'lufs':lufs(p)}
if __name__=='__main__':
    ref=matilda_ref(); res=OUT+'/results.jsonl'; done={(j['a'],j['voice'],j['text']) for j in map(json.loads,open(res))} if os.path.exists(res) else set()
    st=G['ledger_state'](); fo=open(res,'a'); only=set(map(int,sys.argv[1:]))
    for a,word,texts in WORDS:
        if only and a not in only: continue
        phrase=bool(texts); texts=texts or [word[:1].upper()+word[1:]+'.', word+'.']
        if (a,'Matilda','current') not in done:
            p=f'{R}/audio/en/{a:04d}.mp3'; j=judge2(p,word,phrase); j.update(a=a,word=word,voice='Matilda',text='current',file=p,sim=float(emb(p)@ref))
            fo.write(json.dumps(j,ensure_ascii=False)+'\n'); fo.flush()
        for v in CAND:
            for t in texts:
                if (a,VOICES[v],t) in done: continue
                if ledger()+40>LMAX: print('LEDGER CAP reached',ledger(),flush=True); fo.close(); print('VDONE'); sys.exit(0)
                s,c=G['synth'](t,v,'en',st); src=G['cpath'](t,v,'en')
                if not os.path.exists(src): print('synth fail',a,VOICES[v],t,s,flush=True); continue
                d=f"{OUT}/{a}_{VOICES[v]}_{texts.index(t)}.mp3"; proc(src,d)
                j=judge2(d,word,phrase); j.update(a=a,word=word,voice=VOICES[v],voice_id=v,text=t,file=d,cost=c,sim=float(emb(d)@ref))
                fo.write(json.dumps(j,ensure_ascii=False)+'\n'); fo.flush(); print(a,word,VOICES[v],repr(t),'score',j['score'],'sim %.3f'%j['sim'],flush=True)
    print('VDONE ledger',ledger(),flush=True)
