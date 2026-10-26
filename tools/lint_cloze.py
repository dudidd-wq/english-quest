# Automatic near-synonym check for cloze distractors (review #2 #6/#8).
# For every sentence in data/{acad,tech,c1,c2}.json 'sent', a masked language model (roberta-base) scores how well the
# answer and each distractor fit the blank (mean token log-prob, pseudo-log-likelihood). A distractor that fits almost as
# well as the answer (within MARGIN nats) may be a second right answer: it is written to tools/src/extra/cloze_ban.txt
# ("n|word"), and build_extra.py then never offers it for that sentence.  Re-run build_extra + this until it reports 0.
# Usage: /workspace/venv-w2v/bin/python tools/lint_cloze.py [--write]
import json, os, sys, torch
from transformers import AutoTokenizer, AutoModelForMaskedLM
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
MARGIN = 1.5
tok = AutoTokenizer.from_pretrained('roberta-base'); lm = AutoModelForMaskedLM.from_pretrained('roberta-base').eval()
def fit(s, w):
    a, b = s.split('___')
    ids_w = tok((' ' if a.strip() else '') + w, add_special_tokens=False)['input_ids']
    ids = [tok.bos_token_id] + tok(a.rstrip(), add_special_tokens=False)['input_ids'] if a.strip() else [tok.bos_token_id]
    start = len(ids); ids = ids + ids_w + tok((' ' if not b.startswith((',', '.', '?', '!', ';', ':', "'")) else '') + b.strip(), add_special_tokens=False)['input_ids'] + [tok.eos_token_id]
    batch = []
    for i in range(len(ids_w)):
        x = list(ids)
        for j in range(i, len(ids_w)): x[start + j] = tok.mask_token_id   # PLL-word-l2r: mask this and later sub-tokens
        batch.append(x)
    with torch.no_grad(): lp = lm(torch.tensor(batch)).logits.log_softmax(-1)
    return sum(lp[i, start + i, ids_w[i]].item() for i in range(len(ids_w))) / len(ids_w)
flags = []
for t in ('acad', 'tech', 'c1', 'c2'):
    d = json.load(open(f'data/{t}.json'))
    for n, items in d.get('sent', {}).items():
        for it in items:
            sa = fit(it['s'], it['a'])
            for o in it['o']:
                so = fit(it['s'], o)
                if so >= sa - MARGIN: flags.append((t, n, it['a'], o, round(sa, 2), round(so, 2), it['s']))
for f in flags: print(*f, sep=' | ')
print('lint_cloze:', len(flags), 'distractor(s) fit nearly as well as the answer')
if '--write' in sys.argv and flags:
    p = 'tools/src/extra/cloze_ban.txt'; old = open(p).read().splitlines() if os.path.exists(p) else []
    new = [f'{n}|{o}' for _, n, _, o, *_ in flags if f'{n}|{o}' not in old]
    open(p, 'a').write(''.join(x + '\n' for x in new)); print('banned +', len(new))
