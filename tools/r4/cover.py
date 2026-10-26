import sys,os,glob; sys.path.insert(0,'/workspace/eq-tts/r3'); from lib import *
M=clipmap(); files=sorted(int(os.path.basename(f)[:-4]) for f in glob.glob(R+'/audio/en/*.mp3'))
have=[a for a in files if a in M and raw(M[a][1])]; nomap=[a for a in files if a not in M]
print('files',len(files),'mapped',len(files)-len(nomap),'raw',len(have),'nomap sample',nomap[:8])
import collections; print(collections.Counter((a//1000)*1000 for a in files if a in M and not raw(M[a][1])).most_common(8))
