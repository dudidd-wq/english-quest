# rerec.py ids... : re-record short EN clips (review #4) with several phrasing tricks until Whisper small+medium AND the
# phoneme onset agree (tools/r4/check.py judge: reviewer's method). Best take -> /workspace/eq-tts/r4/rerec/<id>.mp3 (+ .json with the text);
# nothing is installed here (install.py gives fixed clips NEW file numbers). Env CAP_ROUND = max ledger cost for this run.
import sys,os,json,shutil,subprocess; sys.path.insert(0,'/workspace/eq-tts/r3')
from lib import *; from dbl import second
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from check import judge
def score(word,f):
    j=judge(f,word,True); return 2*j['word_small']+j['word_any']+2*(j['onset'] is not False), f"{j['small']}/{j['medium']}/{j['ph']}"
FULL=5
OUT='/workspace/eq-tts/r4/rerec'; os.makedirs(OUT,exist_ok=True)
CAP=int(os.environ.get('CAP_ROUND','400'))
def variants(word):
    W=word[:1].upper()+word[1:]
    return [('plain',f'{W}.'),('plain',f'{word}.'),('2nd',f'{W}... {word}.'),('2nd',f'{W}, {word}!'),
            ('2nd',f'{W}. {W}.'),('2nd',f'The word is: {word}.'),('plain',f'{word.upper()}!'),('2nd',f'Listen: {word}.')]
if __name__=='__main__':
    M=clipmap(); state=G['ledger_state'](); cost=0
    for a in map(int,sys.argv[1:]):
        w,t=M[a]; word=w['en']; cur=f'{R}/audio/en/{a:04d}.mp3'; b=score(word,cur); log=[f'cur {b[0]} {b[1]}']; best=(b[0],None,None)
        for kind,v in variants(word):
            if best[0]==FULL or cost>=CAP: break
            st,c=G['synth'](v,G['EN_VOICE'],'en',state); cost+=c; src=raw(v)
            if not src: log.append(f'{v} fail'); continue
            d=f'/tmp/r4r_{a}_{abs(hash(v))%10**6}.mp3'
            if kind=='2nd':
                t2=d+'.cut.mp3'
                if not second(src,t2): log.append(f'{v} nosplit'); continue
                proc(t2,d)
            else: proc(src,d)
            sc=score(word,d); log.append(f'{v} {sc[0]} {sc[1]}')
            if sc[0]>best[0]: best=(sc[0],d,v)
        if best[1]:
            shutil.copy(best[1],f'{OUT}/{a}.mp3'); json.dump({'a':a,'word':word,'say':best[2],'score':best[0]},open(f'{OUT}/{a}.json','w'))
        print(json.dumps({'a':a,'word':word,'best':best[2],'score':best[0],'cost':cost,'log':log}),flush=True)
    print('RRDONE cost',cost,flush=True)
