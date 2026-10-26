# clip -> recording text + cached raw TTS; re-process with new NORM; ASR (whisper small/medium) + phonemes
import sys, os, json, glob, re, subprocess, numpy as np
R='/workspace/english-quest'; sys.path.insert(0,'/workspace/eq-tts')
src=open(R+'/tools/tts_extra.py').read(); src=src[:src.rindex("if __name__")]
G={'__file__':R+'/tools/tts_extra.py','__name__':'x'}; exec(src,G)
def clipmap():
    M={}
    for f in sorted(glob.glob(R+'/data/*.json')):
        d=json.load(open(f))
        if not isinstance(d,dict) or not isinstance(d.get('words'),list): continue
        for w in d['words']:
            a=w.get('ae') or w.get('n')
            if a and a not in M: M[a]=(w, G['SAY']['en'].get(str(a)) or G['en_text'](w))
    return M
def raw(text): p=G['cpath'](text,G['EN_VOICE'],'en'); return p if os.path.exists(p) else None
def proc(src,dst):
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-af',G['NORM'],'-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','-map_metadata','-1',dst],check=True)
def A(p):
    a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32); z=np.zeros(8000,np.float32); return np.concatenate([z,a,z])
_m={}
def asr(p,size='small.en'):
    from faster_whisper import WhisperModel
    if size not in _m: _m[size]=WhisperModel(size,device='cpu',compute_type='int8',cpu_threads=4)
    return ' '.join(s.text for s in _m[size].transcribe(A(p),language='en',beam_size=5)[0]).strip()
def ph(p):
    from phon import phon
    try: return phon(p)
    except Exception as e: return 'ERR'
def norm(s): return re.sub(r'[^a-z]','',s.lower())
