# clip -> raw TTS source (eq-tts cache, else band2 cache) for re-trimming with the current NORM
import sys,os,json,glob; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import *
_c=os.getcwd(); os.chdir('/workspace/band2'); sys.path.insert(0,'/workspace/band2'); import tts as B2; os.chdir(_c)
B2W={w['n']:w for w in json.load(open('/workspace/band2-study/data/words.json'))['words']}
def b2raw(a):
    w=B2W.get(a)
    if not w: return None
    try: p='/workspace/band2/'+B2.path(B2.en_tts_text(w['en'],a),B2.EN_VOICE,'en')
    except Exception: return None
    return p if os.path.exists(p) else None
M=clipmap()
def source(a):
    if a in M:
        r=raw(M[a][1])
        if r: return r,M[a][1]
    r=b2raw(a)
    return (r,'b2') if r else (None,None)
if __name__=='__main__':
    files=sorted(int(os.path.basename(f)[:-4]) for f in glob.glob(R+'/audio/en/*.mp3'))
    S={a:source(a) for a in files}; miss=[a for a in files if not S[a][0]]
    print('files',len(files),'with raw',len(files)-len(miss),'missing',len(miss),miss[:15])
