# English Quest 3.8.0 — test results (branch eq-3.8.0-voices)

Run 2026-10-26 against a local server (python3 -m http.server 8771), Playwright (playwright-core 1.59.1, Chrome).

| Test | Result |
|---|---|
| test_v3 (all grades, 4 chunks: 1–4, 5–8, 9–12, 131/132/134/133) | ERRORS 0 |
| test_backup (mobile + desktop) | PASS |
| test_a11y (axe) | serious/critical 0 |
| test_upgrade 3.7.0 (85d51f70) → 3.8.0 | PASS — SW activates, progress kept, retired clip 7306 evicted from eq-audio-v2, 0001 kept, 77306 served (200), offline OK |
| test_r5 (grades 1–2 hide XP/turns/rival/daily, cloze 8287, tech chapter, locked stages tabindex) | ALL PASS |
| test_remap | PASS |
| test_r3 | PASS |
| test_404 | no 404s |

## Audio replacements (verify3: Whisper small.en/medium.en/large-v3-turbo × 2 pads + wav2vec2 onset vote)

| word | clip | voice / text | before (3-model) | after (3-model) | sim to Matilda | LUFS | lead ms |
|---|---|---|---|---|---|---|---|
| bill | en/1132 → en/71132 | Alice "Bill." | 6/6 runs, onset 0/5, FAIL | 5/6 runs, onset 5/5, OK | 0.935 | -18.1 | 148.3 |
| bay | en/58057 (kept) | Matilda original — review #6: Alice "Bay!" (78057) was v-like at 0–0.1 s; 3 new takes not better | 5/6 runs, onset 5/5, OK | — (kept) | | -18.7 | 220.9 |
| mere | en/62009 → en/72009 | Alice "Mere." | 5/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK | 0.926 | -18.1 | 130.0 |
| medal | en/578 → en/70578 | Alice "Medal, as in a gold medal." | 0/6 runs, onset 5/5, FAIL | 6/6 runs, onset 5/5, OK | 0.696 | -18.2 | 143.7 |
| hall | en/50402 → en/70402 | Bella "Hall, as in the school hall." | 1/6 runs, onset 5/5, FAIL | 6/6 runs, onset 5/5, OK | 0.928 | -18.7 | 140.6 |
| few | en/1417 → en/71417 | Bella "Few, as in a few apples." | 4/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK | 0.879 | -18.3 | 134.6 |
| vary | en/8853 → en/78853 | Sarah "Vary, as in to vary the colors." | 0/6 runs, onset 5/5, FAIL | 6/6 runs, onset 5/5, OK | 0.811 | -18.3 | 130.2 |
| chew | en/9148 → en/79148 | Alice "Chew." | 2/6 runs, onset 0/5 (n/a), FAIL | 4/6 runs, onset 0/5 (n/a), OK | 0.892 | -18.7 | 156.2 |
| middle | en/7306 → en/77306 | Alice "Middle." | 1/6 runs, onset 0/5, FAIL | 6/6 runs, onset 5/5, OK | 0.939 | -18.2 | 139.3 |
| considerate | en/9192 → en/89192 | Alice "Considerate, as in a considerate friend." (review #6; 79192 had verb /-eɪt/) | 0/6 runs ("Consider it"), FAIL | 6/6 runs, phonemes /-ɪt/ 5/5 offsets, OK | 0.79 | -18.3 | 140 |
| beach | en/6050 → en/76050 | Alice "beach." | 4/6 runs, onset 0/5, FAIL | 4/6 runs, onset 5/5, OK | 0.883 | -17.9 | 130.2 |
| bench | en/8070 → en/78070 | Sarah "bench." | 6/6 runs, onset 0/5, FAIL | 6/6 runs, onset 5/5, OK | 0.95 | -17.9 | 130.5 |
| madam | en/8438 → en/78438 | Bella "Madam." | 5/6 runs, onset 0/5, FAIL | 6/6 runs, onset 5/5, OK | 0.918 | -17.8 | 148.9 |
| fear | en/50333 → en/80333 | Matilda "(re-pad)" | 5/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK |  | -19.3 | 130.1 |
| burn | en/50130 → en/80130 | Matilda "(re-pad)" | 6/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK |  | -18.0 | 129.9 |
| burn | en/51162 → en/81162 | Matilda "(re-pad)" | 6/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK |  | -18.0 | 129.9 |

Kept on Matilda (no improvement found): hard, hull, bare.

ElevenLabs spend: 1,104 credits (round 5) + 42 credits (review #6 follow-up) ; cumulative ≈12.91k of the 13.5k cap.

## Review #6 follow-up (eq-3.8.0 final)

wav2vec2 phoneme check at lead offsets 0.0/0.1/0.2/0.3/0.4 s (`tools/r6/r6.py`, results /workspace/eq-tts/r6/r6.jsonl):

| clip | STT (3 models × 2 pads) | phonemes, 5 offsets | verdict |
|---|---|---|---|
| considerate 9192 (Matilda, old) | 0/6 ("Consider it") | kənsɪdɚɹɪt ×5 | ending right, STT fails |
| considerate 79192 (Sarah "con-sid-er-ate.") | 6/6 | kənsɪdɚɹeɪt ×5 | verb-like ending — rejected |
| considerate plain "considerate."/"Considerate." Sarah ×2, Alice ×2 | 0/6 each ("Consider it") | kənsɪdɚɹɪt ×5 | ending right, STT fails |
| considerate Sarah "Considerate, as in a considerate friend." | 6/6 (headword 3/6) | kənsɪdɚɹɪt… ×5 | pass |
| **considerate Alice "Considerate, as in a considerate friend." → en/89192** | **6/6 (headword 6/6)** | **kənsɪdɚɹət… ×5** | **installed** |
| bay 58057 (Matilda, original) | 5/6 | beɪ ×5 | **kept** |
| bay 78057 (Alice "Bay!") | 1/6 | veɪ ×3, beɪ ×2 | rejected |
| bay Alice "Bay." / Sarah "Bay." / Bella "Bay." | 3/6 / 2/6 / 0/6 | beɪ ×5 / beɪ ×5 / deɪ ×5 | none beats original |

Other review #6 fixes: cloze b3c1 8386 distractor editor → earthquake; audio.js header names the alternate voices.

Re-run after the fixes (local server 127.0.0.1:8771): test_v3 all grades ERRORS 0 · test_backup mobile+desktop PASS · axe SERIOUS 0 · test_upgrade 3.7.0 (85d51f70) → 3.8.0 PASS · test_r5 / test_remap / test_r3 PASS · test_404 none.
