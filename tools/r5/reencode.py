#!/usr/bin/env python3
"""eq-3.8.0 fix-up: install.py re-encoded the already-processed MP3 takes (a 2nd 32k MP3 generation), which smeared
plosive onsets (b->v in the phoneme check for bay/burn). Rebuild every new clip from the RAW TTS cache in ONE encode:
NORM with adelay = 95 + extra pad, and the gain fix applied after loudnorm. Updates tools/voices.json metrics."""
import json,os,sys,subprocess
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); import voices as V, r5install as I
G=V.G; ROOT=I.ROOT
RP={50333:'Fear.',50130:'burn.',51162:'burn.'}
def build(raw,dst,pad,gain):
    norm=G['NORM'].replace('adelay=95:all=1',f'adelay={95+pad}:all=1')
    if gain: norm=norm.replace(f',adelay=',f',volume={gain:.2f}dB,adelay=')
    a=['ffmpeg','-v','error','-y','-i',raw]; tail=['-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','-map_metadata','-1',dst]
    if subprocess.run(a+['-af',norm]+tail).returncode==0: return
    trim,rest=norm.split(',loudnorm',1); w=dst+'.wav'
    subprocess.run(a+['-af',trim,w],check=True); subprocess.run(['ffmpeg','-v','error','-y','-i',w,'-af','loudnorm'+rest]+tail,check=True); os.remove(w)
VJ=json.load(open(f'{ROOT}/tools/voices.json'))
jobs=[(a,I.res[k]['file'],G['cpath'](I.res[k]['text'],I.res[k]['voice_id'] if 'voice_id' in I.res[k] else I.VID[I.res[k]['voice']],'en'),70000+a%10000) for a,k in I.PICK.items()]
jobs+=[(a,f'{ROOT}/audio/en/{a}.mp3',G['cpath'](t,I.VID['Matilda'],'en'),80000+a%10000) for a,t in RP.items()]
for a,ref,raw,new in jobs:
    assert os.path.exists(raw),(a,raw)
    l=I.lead(ref); L=V.lufs(ref); pad=max(0,int(round(130-l))); g=-18.2-L if abs(L+18.2)>0.6 else 0
    dst=f'{ROOT}/audio/en/{new}.mp3'; build(raw,dst,pad,g)
    m=dict(lead_in=round(l,1),lufs_in=L,pad_ms=pad,gain_db=round(g,2),lead=round(I.lead(dst),1),lufs=V.lufs(dst),encode='single pass from raw TTS')
    VJ['clips'][f'en/{new}'].update(m); print(a,new,m,flush=True)
json.dump(VJ,open(f'{ROOT}/tools/voices.json','w'),ensure_ascii=False,indent=1)
print('RDONE')
