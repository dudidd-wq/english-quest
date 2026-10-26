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
- [ ] #7 C1: HE QA, wire into data.js/picker, tests, docs
- [ ] #8 About links + LICENSE-DATA.md check
- [ ] #9 abc example words
- [ ] #10 conglomerate/tuple (done in data? verify) + 19 duplicate-gloss pairs
- [ ] #11 splash claim
- [ ] low: scramble stall g10; upgrade 3.3.2→3.4.0 + offline reload
- [ ] SW eq-3.4.0, full tests, live verify, credits report
Credits this task so far: 260 + 1,294 (C1) TTS → ledger 36,006; cumulative ≈11.0k of 15k cap
