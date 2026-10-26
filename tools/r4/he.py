# he.py : re-record HE clips flagged in review #4 with alternative (vocalised) texts; score with ivrit-ai whisper-large-v3-turbo
# (same model the reviewer used, 0.5 s / 0.7 s zero pad); best take -> /workspace/eq-tts/r4/he/<n>.mp3 + .json. Nothing installed here.
import sys,os,json,re,shutil,subprocess,numpy as np; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import G,proc
from faster_whisper import WhisperModel
OUT='/workspace/eq-tts/r4/he'; os.makedirs(OUT,exist_ok=True)
JOBS={872:(['טעם','לטעום'],['טַעַם, לִטְעוֹם','טַעַם. לִטְעוֹם.','טַעַם, וְגַם לִטְעוֹם']),
      33045:(['אקר','דונם'],['אֵיקֶר, כְּאַרְבָּעָה דּוּנָם','אַקֶר, כְּאַרְבָּעָה דּוּנָם','יְחִידַת שֶׁטַח: אַקֶר, כְּאַרְבָּעָה דּוּנָם','אַקֶר. בְּעֵרֶךְ אַרְבָּעָה דּוּנָם.','אַקֶר, אַקֶר אֶחָד הוּא כְּאַרְבָּעָה דּוּנָם'])}
m=WhisperModel('ivrit-ai/whisper-large-v3-turbo-ct2',device='cpu',compute_type='int8',cpu_threads=4)
nz=lambda s:re.sub(r'\s+',' ',re.sub(r'[^\u05d0-\u05ea ]',' ',re.sub(r'[\u0591-\u05c7]','',s))).strip()
def asr(p):
    y=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',p,'-f','f32le','-ar','16000','-ac','1','-'],capture_output=True).stdout,np.float32)
    x=np.concatenate([np.zeros(8000,np.float32),y,np.zeros(11200,np.float32)])
    return nz(' '.join(t.text for t in m.transcribe(x,language='he',beam_size=5,vad_filter=False,condition_on_previous_text=False)[0]))
state=G['ledger_state'](); cost=0
for n,(need,texts) in JOBS.items():
    if os.path.exists(f'{OUT}/{n}.mp3'): continue
    log=[]; best=None
    for t in texts:
        st,c=G['synth'](t,G['HE_VOICE'],'he',state); cost+=c; src=G['cpath'](t,G['HE_VOICE'],'he')
        if not os.path.exists(src): log.append(f'{t} fail'); continue
        d=f'/tmp/r4h_{n}_{len(log)}.mp3'; proc(src,d); h=asr(d); ok=all(w in h.split() for w in need); log.append(f'{t} -> {h} {ok}')
        if ok: best=(d,t); break
    if best: shutil.copy(best[0],f'{OUT}/{n}.mp3'); json.dump({'n':n,'say':best[1]},open(f'{OUT}/{n}.json','w'),ensure_ascii=False)
    print(n,'|',' || '.join(log),'=>',best and best[1],flush=True)
print('HEDONE cost',cost,flush=True)
