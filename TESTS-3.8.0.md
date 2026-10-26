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
| bay | en/58057 → en/78057 | Alice "Bay!" | 5/6 runs, onset 5/5, OK | 4/6 runs, onset 5/5, OK | 0.908 | -18.2 | 130.2 |
| mere | en/62009 → en/72009 | Alice "Mere." | 5/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK | 0.926 | -18.1 | 130.0 |
| medal | en/578 → en/70578 | Alice "Medal, as in a gold medal." | 0/6 runs, onset 5/5, FAIL | 6/6 runs, onset 5/5, OK | 0.696 | -18.2 | 143.7 |
| hall | en/50402 → en/70402 | Bella "Hall, as in the school hall." | 1/6 runs, onset 5/5, FAIL | 6/6 runs, onset 5/5, OK | 0.928 | -18.7 | 140.6 |
| few | en/1417 → en/71417 | Bella "Few, as in a few apples." | 4/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK | 0.879 | -18.3 | 134.6 |
| vary | en/8853 → en/78853 | Sarah "Vary, as in to vary the colors." | 0/6 runs, onset 5/5, FAIL | 6/6 runs, onset 5/5, OK | 0.811 | -18.3 | 130.2 |
| chew | en/9148 → en/79148 | Alice "Chew." | 2/6 runs, onset 0/5 (n/a), FAIL | 4/6 runs, onset 0/5 (n/a), OK | 0.892 | -18.7 | 156.2 |
| middle | en/7306 → en/77306 | Alice "Middle." | 1/6 runs, onset 0/5, FAIL | 6/6 runs, onset 5/5, OK | 0.939 | -18.2 | 139.3 |
| considerate | en/9192 → en/79192 | Sarah "con-sid-er-ate." | 0/6 runs, onset 0/5 (n/a), FAIL | 6/6 runs, onset 0/5 (n/a), OK | 0.898 | -18.5 | 137.0 |
| beach | en/6050 → en/76050 | Alice "beach." | 4/6 runs, onset 0/5, FAIL | 4/6 runs, onset 5/5, OK | 0.883 | -17.9 | 130.2 |
| bench | en/8070 → en/78070 | Sarah "bench." | 6/6 runs, onset 0/5, FAIL | 6/6 runs, onset 5/5, OK | 0.95 | -17.9 | 130.5 |
| madam | en/8438 → en/78438 | Bella "Madam." | 5/6 runs, onset 0/5, FAIL | 6/6 runs, onset 5/5, OK | 0.918 | -17.8 | 148.9 |
| fear | en/50333 → en/80333 | Matilda "(re-pad)" | 5/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK |  | -19.3 | 130.1 |
| burn | en/50130 → en/80130 | Matilda "(re-pad)" | 6/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK |  | -18.0 | 129.9 |
| burn | en/51162 → en/81162 | Matilda "(re-pad)" | 6/6 runs, onset 5/5, OK | 6/6 runs, onset 5/5, OK |  | -18.0 | 129.9 |

Kept on Matilda (no improvement found): hard, hull, bare.

ElevenLabs spend: 1,104 credits this round; cumulative ≈12.87k of the 13.5k cap.
