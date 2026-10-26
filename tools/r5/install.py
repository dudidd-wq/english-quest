#!/usr/bin/env python3
"""eq-3.8.0: install chosen alternate-voice takes + fear/burn re-pads under NEW numbers, remap, write tools/voices.json."""
import json,os,sys,subprocess,glob,numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); import voices as V
R5='/workspace/eq-tts/r5/'; ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
VID={'Matilda':'XrExE9yKIg1WjnnlVkGX','Bella':'hpp4J3VqNfWAUOO0d1Us','Sarah':'EXAVITQu4vr4xnSDxMaL','Alice':'Xb7hH8MSUJpSbSDYk0k2'}
PICK={1132:'1132_Alice_0',58057:'58057_Alice_r2_0',62009:'62009_Alice_0',578:'578_Alice_r3_0',50402:'50402_Bella_r3_0',
 1417:'1417_Bella_r2_1',8853:'8853_Sarah_r2_1',9148:'9148_Alice_0',7306:'7306_Alice_r4_0',9192:'9192_Sarah_r4_1',
 6050:'6050_Alice_r4_1',8070:'8070_Sarah_r4_1',8438:'8438_Bella_r4_0'}
REPAD=[50333,50130,51162]
def pcm(p): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','22050','-'],capture_output=True,check=True).stdout,np.float32)
def lead(p):
    x=np.abs(pcm(p)); return float(np.argmax(x>0.02*x.max())/22.05)
def fix(src,dst):
    l=lead(src); L=V.lufs(src); pad=max(0,int(round(130-l))); g=-18.2-L if abs(L+18.2)>0.6 else 0
    af=f'adelay={pad}:all=1,volume={g:.2f}dB' if pad or g else 'anull'
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-af',af,'-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','-map_metadata','-1',dst],check=True)
    return dict(lead_in=round(l,1),lufs_in=L,pad_ms=pad,gain_db=round(g,2),lead=round(lead(dst),1),lufs=V.lufs(dst))
res={json.loads(l)['file'].split('/')[-1][:-4]:json.loads(l) for l in open(R5+'results.jsonl')}
cur={}
for l in open(R5+'results.jsonl'):
    r=json.loads(l)
    if r['voice']=='Matilda': cur.setdefault(r['a'],r)
AF=json.load(open(f'{ROOT}/tools/audio_fix.json')); CLp=f'{ROOT}/tools/src/extra/clips.json'; CL=json.load(open(CLp))
OFF={'pre1','b1c1','b1c2','g7','g9','b3c1','b3c2'}
words={}
for f in glob.glob(f'{ROOT}/data/*.json'):
    d=json.load(open(f))
    for w in d.get('words',[]): words.setdefault(w.get('ae'),[]).append((d['track'],w['n'],w.get('en')))
out={'note':'eq-3.8.0 per-clip voice record. Default voice everywhere else: ElevenLabs "Matilda" (XrExE9yKIg1WjnnlVkGX), model eleven_v4.','clips':{}}
def remap(old,new,why):
    hits=words.get(old,[])
    assert hits,old
    for t,n,_ in hits:
        if t in OFF: AF['ae'][str(n)]=new
        else: CL['fix']['en'][str(n)]=new
    AF['clips'][f'en/{new}']=why
    return hits
for a,k in PICK.items():
    r=res[k]; new=70000+a%10000; dst=f'{ROOT}/audio/en/{new}.mp3'; m=fix(r['file'],dst)
    hits=remap(a,new,f'3.8.0 alt voice {r["voice"]} "{r["text"]}" replaces en/{a}')
    b=cur[a]
    out['clips'][f'en/{new}']=dict(replaces=f'en/{a}',word=r['word'],voice=r['voice'],voice_id=VID[r['voice']],text=r['text'],
      words=[f'{t}#{n}' for t,n,_ in hits],before_score=b['score'],after_score=r['score'],sim_to_matilda=round(r['sim'],3),**m)
    print(a,'->',new,r['voice'],r['text'],m,len(hits))
for a in REPAD:
    new=80000+a%10000; m=fix(f'{ROOT}/audio/en/{a}.mp3',f'{ROOT}/audio/en/{new}.mp3')
    hits=remap(a,new,f'3.8.0 re-pad of en/{a} to >=120ms lead')
    out['clips'][f'en/{new}']=dict(replaces=f'en/{a}',voice='Matilda',voice_id=VID['Matilda'],text='(re-pad)',words=[f'{t}#{n}' for t,n,_ in hits],**m)
    print(a,'->',new,m,len(hits))
out['weak']=sorted(set(json.load(open(f'{ROOT}/tools/voices.json')).get('weak',[])) if os.path.exists(f'{ROOT}/tools/voices.json') else set())
out['weak']=sorted(set(out['weak'])|{r['word'] for r in (res[k] for k in PICK.values())}|{'hard','hull','bare'})
json.dump(out,open(f'{ROOT}/tools/voices.json','w'),ensure_ascii=False,indent=1)
json.dump(AF,open(f'{ROOT}/tools/audio_fix.json','w'),ensure_ascii=False,indent=1)
json.dump(CL,open(CLp,'w'),ensure_ascii=False)
print('IDONE')
