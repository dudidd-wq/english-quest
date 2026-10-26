# install.py : install staged EN re-records (/workspace/eq-tts/r4/rerec/<clip>.mp3 + .json) under NEW file numbers
# (official clip a<10000 -> 50000+a, derived-track clip -> 60000+a%10000) so no browser/SW cache can serve the old take.
# Official words: tools/audio_fix.json ae[n]; derived words: tools/src/extra/clips.json fix.en[n]. Log: tools/r4/rerec_installed.json
import json,glob,os,shutil,sys
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); os.chdir(R); S='/workspace/eq-tts/r4/rerec'
OFF={'pre1','b1c1','b1c2','g7','g9','b3c1','b3c2'}
users={}
for f in glob.glob('data/*.json'):
    d=json.load(open(f)); t=os.path.basename(f)[:-5]
    if isinstance(d,dict) and isinstance(d.get('words'),list):
        for w in d['words']:
            if w.get('ae') and 'src' not in w: users.setdefault(w['ae'],set()).add((t in OFF,w['n']))
AF=json.load(open('tools/audio_fix.json')); CL=json.load(open('tools/src/extra/clips.json'))
LOGP='tools/r4/rerec_installed.json'; LOG=json.load(open(LOGP)) if os.path.exists(LOGP) else []
only=set(map(int,sys.argv[1:]))
for j in sorted(glob.glob(f'{S}/*.json')):
    m=json.load(open(j)); a=m['a']
    if only and a not in only: continue
    new=50000+a if a<10000 else 60000+a%10000
    shutil.copy(f'{S}/{a}.mp3',f'audio/en/{new}.mp3')
    for off,n in sorted(users.get(a,())):
        (AF['ae'] if off else CL['fix']['en'])[str(n)]=new
    LOG=[x for x in LOG if x['old']!=a]+[{**m,'old':a,'new':new,'words':sorted(n for _,n in users.get(a,()))}]
    print(a,'->',new,sorted(users.get(a,())))
open('tools/audio_fix.json','w').write(json.dumps(AF,ensure_ascii=False,indent=1)+'\n')
open('tools/src/extra/clips.json','w').write(json.dumps(CL,ensure_ascii=False))
open(LOGP,'w').write(json.dumps(sorted(LOG,key=lambda x:x['old']),ensure_ascii=False,indent=1)+'\n')
