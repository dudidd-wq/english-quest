# fix.py ids... : re-process (new NORM) or re-record short EN clips until Whisper small+medium+phonemes agree; installs best; prints 1 line/clip
import sys, json, shutil; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import *
HOMO=[{'bear','bare'},{'be','bee','b'},{'by','bye','buy'},{'pi','pie'},{'pea','pee','p'},{'mail','male'},{'pain','pane'},{'pail','pale'},{'mist','missed'},{'peek','peak'},{'pair','pear','pare'},{'plain','plane'},{'meet','meat'},{'made','maid'},{'bored','board'},{'berry','bury'},{'beat','beet'},{'hall','haul'},{'he','hee'},{'miss','ms'},{'mr','mister'},{'mrs','misses','missus'},{'base','bass'},{'bean','been'},{'mind','mined'},{'bin','been'},{'bow','bough'},{'brake','break'},{'buy','by','bye'},{'meter','metre'},{'pour','pore','poor'},{'past','passed'},{'pause','paws'},{'plum','plumb'},{'pole','poll'},{'pray','prey'},{'prince','prints'},{'peace','piece'}]
def ok(word,h):
    w,h=norm(word),norm(h); return h==w or any(w in s and h in s for s in HOMO)
LAB={'b':'b','m':'m','p':'p','h':'h'}
def onset(word,p):
    c=norm(word)[:1]
    if c not in LAB: return True
    return p.replace('ʰ','').startswith(LAB[c]) or (c=='p' and p.startswith('ph'))
def score(word,f):
    s,m,p=asr(f),asr(f,'medium.en'),ph(f); return ok(word,s)+ok(word,m)+onset(word,p),f'{s}/{m}/{p}'
if __name__=='__main__':
    M=clipmap(); state=G['ledger_state'](); cost=0; out=[]
    for a in map(int,sys.argv[1:]):
        w,t=M[a]; word=w['en']; cur=f'{R}/audio/en/{a:04d}.mp3'; best=score(word,cur)+(None,); log=[f'cur {best[0]} {best[1]}']
        cands=[]
        r=raw(t)
        if r: cands.append(('raw',r))
        W=word[:1].upper()+word[1:]
        for v in [f'{W}.',f'{W}!',f'{word}.']:
            if best[0]==3: break
            if not cands or cands[-1][0]!='raw' or best[0]<3:
                pass
            cands.append((v,None))
        for v,src in cands:
            if best[0]==3: break
            if src is None:
                st,c=G['synth'](v,G['EN_VOICE'],'en',state); cost+=c; src=raw(v)
                if not src: continue
            d=f'/tmp/r3_{a}_{norm(v)}{len(v)}.mp3'; proc(src,d); sc=score(word,d)
            log.append(f'{v} {sc[0]} {sc[1]}')
            if sc[0]>best[0]: best=(sc[0],sc[1],(v,d))
        if best[2]: shutil.copy(best[2][1],cur); out.append({'clip':a,'say':best[2][0] if best[2][0]!='raw' else t,'word':word})
        print(a,word,'|',' || '.join(log),'=>',best[2][0] if best[2] else 'keep',best[0],flush=True)
    json.dump(out,open('/tmp/r3_fixed_%d.json'%os.getpid(),'w')); print('cost',cost,'installed',len(out),'->','/tmp/r3_fixed_%d.json'%os.getpid())
