# hall5.py : round 5 for "hall" (Whisper hears "haul" in every voice). Stronger context phrases, judged directly with the
# 3-model verify3 check (the release criterion). Appends to /workspace/eq-tts/r5/hall5.jsonl.
import json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import voices as V, verify3 as V3
T=['Hall, as in the school hall.','Hall. The children walk down the hall.']
st=V.G['ledger_state'](); ref=V.matilda_ref(); fo=open('/workspace/eq-tts/r5/hall5.jsonl','a')
for v in V.CAND:
    for i,t in enumerate(T):
        if V.ledger()+40>V.LMAX: print('LEDGER CAP',V.ledger(),flush=True); sys.exit(0)
        s,c=V.G['synth'](t,v,'en',st); src=V.G['cpath'](t,v,'en')
        if not os.path.exists(src): print('synth fail',t,s,flush=True); continue
        d=f"{V.OUT}/50402_{V.VOICES[v]}_r5_{i}.mp3"; V.proc(src,d)
        r=V3.verify(d,'hall',True); r.update(voice=V.VOICES[v],voice_id=v,text=t,cost=c,sim=float(V.emb(d)@ref),lufs=V.lufs(d))
        fo.write(json.dumps(r,ensure_ascii=False)+'\n'); fo.flush()
        print(V.VOICES[v],repr(t),'runs',r['word_ok_runs'],'onset',r['onset_votes'],'sim %.3f'%r['sim'],'lead',r['lead'],[x.get('t') for x in r['runs']],flush=True)
print('HDONE ledger',V.ledger(),flush=True)
