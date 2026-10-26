# round2.py : second voice round for words where round 1 gave no improvement (bay, few, vary) using an exclamation take and a
# short context phrase (as already done for bare/hull), plus a phrase-mode re-judge of the current hull phrase clip.
# Same voices/NORM/judge2/similarity as voices.py; appends to /workspace/eq-tts/r5/results.jsonl with round=2.
import json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import voices as V
W2=[(58057,'bay',['Bay!','Bay, as in a bay by the sea.']),(1417,'few',['Few!','Few, as in a few apples.']),
    (8853,'vary',['Vary!','Vary, as in to vary the colors.'])]
# round 3 (arg '3'): near-homophones whose single-word takes only reached 3/5 (mere~Mir/near, medal~metal, hall~haul)
W3=[(62009,'mere',['Mere, as in a mere minute.']),(578,'medal',['Medal, as in a gold medal.']),(50402,'hall',['Hall, as in a long hall.'])]
# round 4 (arg '4'): review #5 items - middle (m->n), considerate (too fast), onset-only flags beach/bench/madam
W4=[(7306,'middle',['Middle.','middle.']),(9192,'considerate',['Considerate.','con-sid-er-ate.']),(6050,'beach',['Beach.','beach.']),
    (8070,'bench',['Bench.','bench.']),(8438,'madam',['Madam.','madam.'])]
RN={'3':3,'4':4}.get((sys.argv[1:] or ['2'])[0],2)
if RN==3: W2=W3
if RN==4: W2=W4
if __name__=='__main__':
    ref=V.matilda_ref(); res=V.OUT+'/results.jsonl'; done={(j['a'],j['voice'],j['text']) for j in map(json.loads,open(res))}
    st=V.G['ledger_state'](); fo=open(res,'a')
    if (61021,'Matilda','current-phrase') not in done:
        p=f'{V.R}/audio/en/61021.mp3'; j=V.judge2(p,'hull',True); j.update(a=61021,word='hull',voice='Matilda',text='current-phrase',file=p,sim=float(V.emb(p)@ref),round=2)
        fo.write(json.dumps(j,ensure_ascii=False)+'\n'); fo.flush(); print('hull current as phrase score',j['score'],flush=True)
    for a,word,texts in W2:
        if RN==4 and (a,'Matilda','current') not in done:
            p=f'{V.R}/audio/en/{a:04d}.mp3'; j=V.judge2(p,word,False); j.update(a=a,word=word,voice='Matilda',text='current',file=p,sim=float(V.emb(p)@ref),round=4)
            fo.write(json.dumps(j,ensure_ascii=False)+'\n'); fo.flush(); print(a,word,'BEFORE score',j['score'],flush=True)
        for v in V.CAND:
            for i,t in enumerate(texts):
                if (a,V.VOICES[v],t) in done: continue
                if V.ledger()+40>V.LMAX: print('LEDGER CAP reached',V.ledger(),flush=True); print('VDONE'); sys.exit(0)
                s,c=V.G['synth'](t,v,'en',st); src=V.G['cpath'](t,v,'en')
                if not os.path.exists(src): print('synth fail',a,t,s,flush=True); continue
                d=f"{V.OUT}/{a}_{V.VOICES[v]}_r{RN}_{i}.mp3"; V.proc(src,d)
                j=V.judge2(d,word,True); j.update(a=a,word=word,voice=V.VOICES[v],voice_id=v,text=t,file=d,cost=c,sim=float(V.emb(d)@ref),round=RN)
                fo.write(json.dumps(j,ensure_ascii=False)+'\n'); fo.flush(); print(a,word,V.VOICES[v],repr(t),'score',j['score'],'sim %.3f'%j['sim'],flush=True)
    print('VDONE ledger',V.ledger())
