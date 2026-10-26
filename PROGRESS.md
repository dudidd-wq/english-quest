# English Quest – progress
- [x] v1 ship; [x] v2 arcade redesign (54f43fb)
- [x] v3 UNIFIED grades 4–12 (Dudi 2026-10-25)
  - [x] Official lists → tracks pre1,b1c1,b1c2,g7(B2C1),g9(B2C2),b3c1,b3c2; Hebrew+emoji; sentences; reading; forms
  - [x] Profiles (multi) + grade selector + englishQuest.v1 migration; Study tab (band2-study features); themes kids/arcade/bagrut
  - [x] SOURCES.md + About; band2-study notice (SW v1.4.0)
  - [x] TTS approved 17:26 → 5,928 clips generated (25,043 credits), QA (Whisper all EN + Scribe re-check + HE sample), installed, 100% coverage
  - [x] v3.1 local-only persistence (steering 17:37): js/backup.js — file export/import (Web Share / download), EQ2 backup code,
        auto-save file (FS Access, handle in IDB), IndexedDB mirror + storage.persist + auto-recovery, partial-loss prompt,
        reminder after 4 days, undo last restore, sanitised imports + schema-1 migration. Tests: tools/test_backup.js
  - [x] Full Playwright rerun (20 runs, 0 errors) + backup tests PASS → REVIEW.md (all ≥9, overall 9.2) → pushed both repos → live verified (eq-3.1.2, band2-study v1.4.0 notice)
  - [x] Audio-risk fixes (Dudi pt67u, 20:27):
    - [x] Homographs: 24 entries → 19 new EN clips per meaning (audio/en/11001–11019), phoneme-verified (bc08b1f)
    - [x] "mixed" re-recorded (respelt "mikst.", en/11020) (bc08b1f)
    - [x] Full Scribe STT pass on all 3,148 v3 HE clips + ivrit-ai 2nd opinion on 104 flagged → 14 re-recorded with niqqud (he/11001–11014, incl. להירקב) (54c699d)
    - [x] SW eq-3.2.0 (new clip numbers only → no stale audio cache; progress keyed by n untouched)
    - [x] Tests on eq-3.2.0: test_v3 full (20 runs; 1 load-induced timeout mobile/g12 → rerun PASS), test_backup PASS (progress preserved)
    - [x] Phoneme (consonant-skeleton) pass on all 3,148 HE clips → 18 more HE re-records (he/11015–11032) (d2b69ca)
    - [x] Docs (SOURCES §4, REVIEW addendum). Credits this task: 376 TTS + ≈1,450 STT
    - [x] Live verified 21:37: SW eq-3.2.0, 0 console errors, 0 bad requests; live data has 25 EN + 32 HE remapped entries; new clips 200; band2-study v1.4.0 OK
Grade map (Curriculum 2020 Table 4/5): 4=PreBand I+B1C1, 5=B1C1/B1C2, 6=B1C2, 7=B2C1, 8=B2C1/B2C2, 9=B2C2, 10–12: 3pts=Band II, 4pts=B3C1, 5pts=B3C1+B3C2
- [x] eq-3.2.1 (pt68u): first-screen grades ד׳–ו׳ looked "selected" — cause: kids theme gave those buttons a filled purple gradient + gold border; now neutral, grouped by stage, only the chosen grade highlighted (96e46d3)
- [x] Research: LEVELS.md (grades א׳–ג׳ and levels above י״ב; sources, licences, decision) (a9399d4)
- [x] eq-3.3.0: grades א׳–ב׳ (optional early start: `early` + `abc`), ג׳ (Pre-Band I + `abc`), grade 13 picker (acad NAWL / tech NCSAWL / c2 Octanove subset); listening-first picture game, picture memory, big targets, no typing for early grades (2e9fc2b, 0371864)
- [x] Audio: 1,304 EN + 1,323 HE new clips (455e550); HE QA: Scribe all + ivrit-ai on 77 → 40 niqqud re-records (e0810e9); EN QA: Whisper all + Scribe on 214 → 5 re-records (cfc1af7). Credits ≈8,594 TTS + ≈380 STT (cap 15k)
- [x] NCSAWL attribution corrected to Uba, Irudayasamy & Hankins 2023 (data, About, LEVELS, SOURCES); SW eq-3.3.2
- [x] Gloss audit (derived Hebrew, tech + c2 + acad scanned): sector, interrupt, hitch fixed + 3 HE clips; SW eq-3.3.3 live (52fd676). Credits ≈8,670 TTS + ≈385 STT

## Review #1 fixes (eq-3.4.0) – resume checklist (/workspace/eq_review_findings_1.md)
- [x] #1 HE homographs: 62 niqqud re-records, split shared clips, tools/qa_he_pron.py (27c99a8)
- [x] #2 hull re-cut, say.json "hull" (27c99a8)
- [x] #3 adult worlds post-12 + cloze sentences acad/tech/c2 (8b4d89e)
- [x] #4 spoken HE instructions grades 1–2 (he/11099–11103), "Early words" translated, untimed grades 1–3 (8b4d89e)
- [x] #5 fan 🪭, hat 👒, soft 🪶, hello without "(בפגישה)" (8b4d89e)
- [x] #6 no overlapping glosses in one round (safeRounds/distinctWords) (8b4d89e)
- [x] #7 known Band words → optional ⚡ fast-review stages; 15 NCSAWL items listed in SOURCES (84f4338)
- [x] #7 C1 track data (498ea16) + audio 180 EN / 173 HE (4c98749, 01601f1)
- [x] #7 C1: HE QA (qa_he_pron 0 shared; phon spot-checks 0.7–1.0), wired in data.js/LEVEL_CARDS13/sw precache, tests GRADES incl. 134, SOURCES/LEVELS docs (bf3946e)
- [x] #8 About: licence links, source URLs, modifications note, LICENSE-DATA link (covers C1/C2) – verified
- [x] #9 abc: K key, L light, T taxi, V vegetable, Z zero – all 26 in MoE Pre-Band I/Band I (c93b5a6)
- [x] #10 conglomerate/tuple glosses verified in data; 19 identical-gloss pairs differentiated, new HE clips 11106–11124 (4e37779)
- [x] #11 splash + meta: official lists for grades 3–12, derived content otherwise (bf3946e)
- [x] low: scramble guard (no over-fill, lock during reset); tools/test_upgrade.js 3.3.2→3.4.0 PASS (progress kept, offline c1/c2/b1c1) (ea30035)
- [x] SW eq-3.4.0, full tests, live verify, credits report
Credits this task: 260 + 1,294 (C1) + 137 (19 pairs) + 40 (abc) = 1,731 → ledger 36,183; cumulative ≈11.2k of 15k cap

## Review #2 fixes (eq-3.5.0) – resume checklist (/workspace/eq_review_findings_2.md)
- [x] #17 shots/v3/desktop-g7-map.png committed
- [x] #1 EN apt 33094 → /æpt/ ("Apt!"); ASR re-check of all 294 ≤3-letter EN clips (whisper in carrier + standalone + wav2vec2 phonemes): 38 flags, mostly homophones (ten/10, by/bye, eye/I); real onset doubts re-recorded: mix 1629 "Mix!", bay 8057 "Bay!", map 573 "Map?"
- [x] #2 הבא 1431, #3 חזה 1211, #7 container 11035, #10 אי־צדק 33072, גנום 33092, שלשום 10010 re-record + verify
- [x] #4 testament 33027: no bracketed text in any recording text (lint)
- [x] #9 bat 30062 "Bat!" (phonemes b æ t), mid 30927 "Mid?" (m e d, ASR "Mid"), fin 30819 kept (ASR "Finn" = /fɪn/); all added to sw.js REFRESH
- [x] #5 11099 "green" vs kids button colour
- [x] #6/#8 cloze distractors (30439, 32255, 31312, 31131, 32146, 30805, 30520, 30867, 30563, 30953) + automatic near-synonym lint
- [x] #11 adult chapter themes (no repeats; ⚡ chapters named "חזרה מהירה")
- [x] #12 map old stage stars to new stages by words
- [x] #13 abc spoken instruction; instruction 🔊 visually distinct (🗣️)
- [x] #14 flourish += לשגשג, boast += להתרברב
- [x] #15 safeRounds max 5 words per round
- [x] #16 live_check probes c1.json + a C1 clip
- [x] fun/feel cats 1–2 (cheap extras)
- [x] SW eq-3.5.0, chunked full tests (TESTS-3.5.0.md; d g3/g5 study-type timeouts = harness flake, rerun in 3.6), live verify, credits: ledger 36,441 → this round ≈258, cumulative ≈11.46k of 15k

## Review #3 fixes (eq-3.6.0) – resume checklist (/workspace/eq_review_findings_3.md)
- [x] R1a trim: keep ≥120 ms lead (-60 dB) in tools/tts_v3.py + tts_extra.py
- [x] R1b re-process 32 labial clips (_r3/lab.txt) + bay/bat/bear/mail/base/melt/bare/Miss/he 5068/hall/all
- [x] R1c ASR gate (Whisper small+medium + phonemes) on every EN ≤4 letters + b/m/p-initial
- [x] R2 per-track chapter themes (tech / C1 / C2 / acad)
- [x] R3 HE 893 שלשום, 11101 שיאה, 6402, 31210
- [x] R4 cloze 30015, 32232 + 30548 30383 30411 33080 30685 30127 31020 31218 31309
- [x] R5 cap match time-bonus XP (bonus ≤30, match pairs ½ XP + combo ≤×2: perfect round ≈140 instead of 424)
- [x] R6 grades 1–2: hide rival/daily banners, results = stars + big emoji
- [x] R7 grade 3: spelling games (scramble/type) unlocked after chapter 1
- [x] R9 gloss nits: fan, indulge, imposition, gate, 10010 display
- [x] R10 people emoji as word pictures in new tracks; parents button icon
- [x] SW eq-3.6.0, chunked full tests, live verify, credits (all chunks ERRORS 0 except transient Pages 503s, rerun clean; ledger total 36754; round 3 ≈313 credits; cumulative ≈11.77k of 15k cap)

## Round 4 (review #4 → eq-3.7.0)
- [x] R4-2 sw.js audio miss: fetch(key,{cache:'no-cache'})
- [x] R4-3 a11y: avatar/🗣️ aria-label contains visible text; contrast .gglabel, .floaty
- [x] R4-4 grades 1–2: no daily-goal coins toast, no "רמה/XP" text in HUD
- [x] R4-5a cloze 30368, 30127
- [x] R4-5b pluck gloss (noun+verb); "to" (consequence) in b1c2
- [x] R4-5c tech themes for all chapters; C2 ch4 stages; C1 card text
- [x] R4-5d one-off 404 after profile creation
  - not reproducible: tools/test_404.js (fresh profiles g1/g5/g9 + acad/c2, page + SW network events, local and live, with reload) logs 0 HTTP≥400, 0 failed requests, 0 console errors; every ae/ah clip, REFRESH entry and UI clip exists. Most likely a transient GitHub Pages response (we saw 503s during round-3 tests).
  - update (3.7.0 tests): cause found – the only 404 is Chrome's root favicon request (dudidd-wq.github.io/favicon.ico, outside this repo) when a test harness opens manifest.webmanifest directly before the app; not an app request. tools/test_a11y.js now logs HTTP≥400 URLs.
- [x] R4-5e Band III source URL
- [x] R4-6 human-figure emoji pre-1/MoE → neutral where cheap
  - glyph table NEUTRAL in tools/build_all.py: 0 person/face-figure pictograms left in pre1/b1c1/b1c2/g7/g9/b3c1/b3c2 (was ~420). Kept on purpose: 👤 👥 (faceless silhouettes, 50 words), hand gestures 🙏 🤲 🙌, and 🙈. man/woman/boy/girl words → ♂️/♀️; family → 🌳.
- [x] R4-1a global re-trim of short EN clips (lead ≥120 ms, −60 dB), verify
  - finding: the ElevenLabs raws themselves start only ~30–60 ms before speech, so onsets were never clipped by trimming; the fix is padding. All 6,311 EN clips re-processed from the cached raws with NORM + adelay=95 (tools/r4/topup.py tops up anything <125 ms; 16 raws that crash ffmpeg's loudnorm were padded from the installed file). Measured lead (reviewer metric, first sample >2% of peak @16 kHz): min 122 ms, median ≈135 ms, 0 clips <120 ms (all 6,311). Same file names → SW audio cache renamed eq-audio-v1 → eq-audio-v2 (old one deleted on activate) and audio is fetched with cache:'no-cache'.
- [x] R4-1b re-record 17 labial clips + medal/hull/mere (new file numbers, SW bust)
  - judged with tools/r4/check.py (reviewer's method: faster-whisper small.en + medium.en, wav2vec2-lv-60 phoneme onset, 0.5/0.7 s pad); tools/r4/rerec.py tries up to 8 phrasings (plain, CAPS, 2nd-token cuts of "W... w." / "W, w!" / "W. W." / "The word is: w." / "Listen: w."). Installed under NEW numbers (official 50000+n, derived 60000+n%10000) by tools/r4/install.py; log tools/r4/rerec_installed.json.
  - new takes passing all three tests: pain 50659, milk 55113, bank 56045 (also b3c1 8051 + derived 31028), bell 58069, pill 58544, pin 58545, beg 59090, mask 58448 (+31201), melt 58455, mesh 62042.
  - bare 59051 = "bare, as in bare feet." (the option in the brief; Whisper: "Bear, as in, bare feet" – homophone, context disambiguates; onset b).
  - hull 61021 = "hull, as in the hull of a ship." (both models hear "Hull").
  - may 7298, pick 7384, pig 7388, male 1605: after the R4-1a lead padding the existing clips pass all three tests → kept (no new take needed).
  - residual (documented): bay 58057 – medium.en and phonemes say "bay"/b, small.en says "They" (better than before: phonemes were wrong too). mere 62009 – both models write the homophone "Mir"/"mirror"; onset m ok. medal 578 – kept: every take (8 plain/cut + 2 "as in a gold medal") is heard "metal" (American flap: medal/metal are homophones for this voice).
- [x] R4-1c automatic dual check (word+onset) on all EN ≤4 letters; rates
  - tools/r4/check.py over all 1,063 EN clips of ≤4 letters the app uses (203 start with b/m/p, 466 controls d l r n t s f k, 394 other): word test = faster-whisper small.en (beam 5), medium.en when small fails; onset test = wav2vec2-lv-60 espeak phonemes. Results: tools/r4/results/ (run1_all, run2_bmp + their rejudge files); rates: tools/r4/rates.py, second pass: tools/r4/rejudge.py.
  - measurement caveat: the phoneme model flips b↔v/d/ð when the SAME audio is shifted by 5–10 ms of leading silence (e.g. bed at pads 0.30…0.70 s: vɛ vɛ bɛ vɛ vɛ bɛ bɛ vɛ vɛ), so the reviewer's single-pad onset figure is noisy; reported both single-pad and a robust vote (5 pads 0.40–0.60 s, ≥3 agree). Whisper also sometimes returns an empty transcript for a short clip on one pass; failures are therefore re-judged once (rejudge.py) and only CONSISTENT failures count. Homophones/numerals (four→"4", sea→"C", prey/pray, band/banned …) count as passes (list in check.py HOMO).
  - action: 19 b/m/p clips that failed robustly or in both models were re-recorded under new numbers (bang, best ×2, bye, base, bare, bed, bear ×2, burn ×2, mole, Miss/miss, mix, pay, pig, path, past) + 6 consistent non-b/m/p failures (hall, ally, like, fill, fear, fare). ~170 credits.
  - final rates, run 1 (all clips), single pass: b 80 – onset single-pad 5.0 % / robust 1.2 %, word fails both models 0 %, any 1.2 %; m 54 – 1.9 % / 0 %, 3.7 %, any 3.7 %; p 69 – 0 % / 0 %, 0 %, any 0 %; controls 466 – 0.4 % / 0.4 %, 2.1 %, any 2.6 %; other 393 – any 1.5 %. Run 2 (b/m/p only, under CPU load): any-fail b 6.2 %, m 1.9 %, p 4.3 % – all empty-transcript flakes except bill.
  - CONSISTENT failures (fail on both passes): b/m/p 1 of 203 = 0.5 % (b 1.2 %, m 0 %, p 0 %) → target <3 % met. Others 8 of 860.
  - residual list: bill 1132 (phonemes "dɪl" on every pad; 8 re-record phrasings all scored the same, both ASR models hear "bill" → kept); bay 58057, mere 62009, medal 578 (see R4-1b); hall 50402 (new take; "Haul"/"hull" – old clip gave an empty transcript); hard 405 (empty on two check passes, passes in rerec's judge – ASR flake); hull 61021 (phrase take by design); sure (letter s, sound ʃ – test artefact); FOMO (f heard as s by the phoneme model; both ASR ok); few→"Phew", vary→"Very", chew→"choo" (homophones/merger).
- [x] R4-1d HE 872, 33045
  - 872 taste → new clip he/50872 "טַעַם, לִטְעוֹם" (vocalised; ivrit-ai turbo hears "טעם לטעום"). 33045 acre → he/53045 "אַקֶר. בְּעֵרֶךְ אַרְבָּעָה דּוּנָם." (5 wordings tried; ASR writes the homophone "עקר" for every correctly pronounced take – א/ע sound the same in modern Hebrew – rest of the gloss exact). Tools: tools/r4/he.py. Ledger 80.
- [x] SW eq-3.7.0, full tests, live verify, credits
  - live: SW eq-3.7.0 + eq-audio-v2; 9 test_v3 chunks (mobile/desktop × grades 1–3, 4–7, 8–12, post-12) ERRORS 0 (mobile post-12 first run hit a transient GitHub Pages 503 on js/util.js, rerun clean); live_check, test_backup, test_upgrade, test_remap, test_r3, test_a11y (serious 0), test_404 all PASS – TESTS-3.7.0.md.
  - credits: ledger total 37,311; round 4 ≈557 (HE 2 clips, 6,311 re-pads cost 0, ~50 EN re-records incl. phrase tries); cumulative ≈12.33k of the 15k approved (cap 14k not reached).

## Round 5 (review #5 → eq-3.8.0, branch `eq-3.8.0-voices`, NOT on main until Dudi approves)
- [x] #1 alt voices (Alice/Bella/Sarah) for weak EN clips: middle 77306, medal, mere, bay, hall, bill, few, vary, chew, considerate, beach, bench, madam (new numbers 7xxxx); per-clip record tools/voices.json; 3-model verify tools/r5/verify3.py (c97a2722)
- [x] #2 grades 1–2: no XP numbers, rival card, memory turns counter, daily challenge (0f4780dd)
- [x] #3 cloze 8287 rewritten (former), 8318 distractor "bent" removed (53fc6e67)
- [x] #4 fear 80333, burn 80130/81162 re-padded to ≥120 ms lead (c97a2722)
- [x] #5 SOURCES §4 (lead pad, 3.7.0 in-place + eq-audio-v2, new-number rule, alt voices + licence), c2 ally=verb note, About credits (3087ef1b); tech last chapter merged, locked stages not tab stops (4facefce)
- [x] #6 sw eq-3.8.0, retired clips evicted from eq-audio-v2 (369702ce); tests → TESTS-3.8.0.md
