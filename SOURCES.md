# English Quest – sources (official vs. derived)

Everything a learner sees is in one of two groups:
- **Official**: copied from a Ministry of Education (משרד החינוך) publication.
- **Derived**: written or arranged for this app. Derived content is marked as such here and in the app's "About" screen (פרופיל ← אודות ומקורות).

## 1. Grade → word list (official)
Source: *Revised English Curriculum 2020*, Ministry of Education, Israel. Copy used: https://education.biu.ac.il/sites/education/files/shared/curriculum2020Elementary.pdf

**Table 4, Bands and grade levels:**

| Curriculum unit | Grade level (verbatim from Table 4) |
|---|---|
| Pre-Band I | Grade 3 and/or first months of Grade 4 |
| Band I · Core I | Grade 4 to mid-Grade 5 |
| Band I · Core II | mid-Grade 5 to end of Grade 6 |
| Band II · Core I | Grade 7 to mid-Grade 8 |
| Band II · Core II | mid-Grade 8 to end of Grade 9 |
| Band III (4 points, B1) / Band III (5 points, B2) | Grades 10–12 |

**Table 5** links levels to grades as follows:
- Pre-A1 = grades 3–6
- A2 = "7-9, Bagrut 3 points"
- B1 = "10-12, Bagrut 4 points"
- B2 = "10-12, Bagrut 5 points"

Table 5 vocabulary targets:
- Receptive words per level: 200 / 1200 / 2000 / 900 / 1100
- Cumulative receptive: 200 / 1400 / 3400 / 4300 / 5400

| Grade | Lists in the app | Basis |
|---|---|---|
| א׳–ב׳ (1–2, optional "early start") | `early` (36 picturable Pre-Band I words) + `abc` (letters) | **Derived.** No MoE list exists for grades 1–2; some schools start English there. See LEVELS.md |
| ג׳ (3) | Pre-Band I + `abc` (letters) | Table 4 ("Grade 3 and/or first months of Grade 4"); `abc` is derived |
| ד׳ (4) | Pre-Band I → Band I Core I | Table 4 |
| ה׳ (5) | Band I Core I / Core II (the learner switches in mid-year) | Table 4 ("mid-Grade 5") |
| ו׳ (6) | Band I Core II | Table 4 |
| ז׳ (7) | Band II Core I | Table 4 |
| ח׳ (8) | Band II Core I / Core II (the learner switches in mid-year) | Table 4 ("mid-Grade 8") |
| ט׳ (9) | Band II Core II | Table 4 |
| י׳–י״ב, 3 יח״ל | Band II Core I + II | Table 5 (A2 = Bagrut 3 points) |
| י׳–י״ב, 4 יח״ל | Band III Core I | Table 4/5 (B1 = 4 points) |
| י׳–י״ב, 5 יח״ל | Band III Core I + Core II | Table 4/5 (B2 = 5 points, cumulative) |
| אחרי י״ב (13) | Picker: `acad` (NAWL) / `tech` (NCSAWL) / `c2` (Octanove C2 subset) | **Not MoE.** Open research lists, see §2b and LEVELS.md |

**Derived parts of the mapping:**
- The default order of lists within a grade.
- The two-way switch in grades 5 and 8. The curriculum says "mid-grade", so the app lets the learner (or a parent) choose when to switch.

## 2. Word lists (official)
All words, parts of speech and the Productive/Receptive split come from the Lexical Band files published by the Pedagogical Secretariat (English Language Inspectorate). The files are indexed in its "Band I & II / Band III" list document.

| Track | File | Words in app |
|---|---|---|
| Pre-Band I | https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand1.xlsx | 198 |
| Band I · Core I | (same file) | 549 |
| Band I · Core II | (same file) | 601 |
| Band II · Core I | https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand2.xlsx | 1014 |
| Band II · Core II | (same file) | 1002 |
| Band III · Core I | https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand3.xlsx | 886 |
| Band III · Core II | (same file) | 1100 |

**Bagrut List A–D labels on Band III Core I words.** These are official, from the Ministry's bagrut word lists:
- https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/4Lists/LISTA12.12.21.xlsx
- https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/4Lists/LISTB12.12.21.xlsx
- https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/4Lists/LISTC12.12.21.xlsx
- https://meyda.education.gov.il/files/Pop/0files/english/Chativa-Elyona/Bagrut/LIST-D.xlsx (List D, Winter 2026)

The app's counts are the rows in each file. The Table 5 figures (200 / 1200 / 2000 / 900 / 1100) are the curriculum's rounded targets.

Two Band III Core II items are kept in the word list but left out of games. This is an age-appropriateness choice, and it is derived.

## 2b. Lists beyond the MoE curriculum (open licences)
| Track | Source | Licence | Words in app | Notes |
|---|---|---|---|---|
| `acad` אקדמי / פסיכומטרי | NAWL 1.2 – New Academic Word List, Browne, Culligan & Phillips (2013), https://www.newgeneralservicelist.com/new-academic-word-list | CC BY-SA 4.0 | 943 | Prefix entries and duplicates removed. It is an open proxy for the psychometric English section; NITE publishes no official list. |
| `tech` אנגלית טכנולוגית | NCSAWL – A New Computer Science Academic Word List, Uba, Irudayasamy & Hankins (2023), *World Journal of English Language* 13(5):319, doi:10.5430/wjel.v13n5p319 | CC BY 4.0 | 429 | Of 444 items: brand names and typos were removed (`tools/build_extra.py`). |
| `c2` קרוב לשפת אם | Octanove Vocabulary Profile C1/C2 1.0, https://github.com/openlanguageprofiles/olp-en-cefrj | CC BY-SA 4.0 | 300 | **Derived subset.** The rule is in LEVELS.md, reproducible with `tools/build_c2_list.py`. |
| `early` (grades 1–2) | MoE Lexical Pre-Band I | official words | 36 | **Derived subset** (picturable concrete nouns, colours and numbers). |
| `abc` letters | written for the app | — | 26 | **Derived.** "X is for …" example words come mostly from Pre-Band I / Band I. X uses *box* (final x sound). |

For all five tracks the Hebrew and emoji were written for the app (derived). Sources are in `tools/src/extra/*.txt`. When a word already exists in an MoE list with the same sense, its Hebrew and clips are reused. Share-alike: the derived lists `data/acad.json` and `data/c2.json` are offered under CC BY-SA 4.0, with attribution as above.

## 3. Derived content (written for the app, not from the Ministry)
- **Hebrew translations and emoji hints** for Pre-Band I, Band I and Band III. Band II translations come from band2-study.
- **Example sentences** ("השלמת משפט"):
  - Every track except Pre-Band I.
  - Written to use only the target word in a simple context.
- **Reading snippets** ("קריאה"):
  - Band II Core II: 6. Band III Core I: 8. Band III Core II: 8.
  - Short texts written for the app in a bagrut-like format. They are **not** past bagrut exams, and the app labels them "written for the app".
- **Conversation sentences** ("שיחה"): 80 per Band II track (fill / build / dialog), taken from band2-study.
- **Word-family/forms items:** built from the forms columns of the official files, with distractors chosen by the app.
- **Stage order and grouping:**
  - Productive words come before Receptive ones.
  - 12 words per stage.
  - Band III Core I is ordered by List A→D.
- **Games, scores, XP and SRS intervals.**

## 4. Audio
- **Every word in every grade has recorded clips (English + Hebrew).** All are ElevenLabs TTS with the same voices and model as band2-study: Matilda (EN) and Tomer (HE), `eleven_v4`.
- **Band II words** (grades 7–9, bagrut 3 pts) use the original band2-study clips (1–2016).
  - Another list reuses one of these clips only when its text is identical.
  - Heteronyms (same spelling, different pronunciation) are mapped per meaning; see "Audio fixes" below.
- **Generated for v3 (approved by Dudi on 2026-10-25):** 5,928 clips (2,780 EN + 3,148 HE). These come from 5,647 unique texts (identical texts share one recording).
  - Cost: **25,043 credits** in total, including 7 re-records after QA. This is within the approved ~25k estimate (≈ $5.5–7.5).
  - Script: `tools/tts_v3.py`. It reads the key only from the environment; no key is in the repo.
- **Spoken text:** cleaned for speech.
  - English: *sb/sth* → somebody/something, "/" → "or", parentheses removed.
  - Hebrew: Latin examples removed, niqqud added for one-letter prefixes and ambiguous words.
  - Manual overrides cover about 80 items, such as "a, an" and "neither… nor".
- **Processing (same as band2-study):** trim silence, loudness normalised to −18 LUFS, mono 22.05 kHz 32 kbps MP3. Files are at `audio/en|he/<n>.mp3`.
- **QA:**
  - Every English clip was transcribed locally with Whisper small.en. Median similarity was 1.0.
  - 89 clips that Whisper could not read (mostly single short words and numbers) were re-checked with ElevenLabs Scribe. The remaining mismatches are homophones (eye/I, sea/C, tea/T, wear/where, queue/Q, bare/bear) or "i.e." read as "that is".
  - 3 clips were re-recorded: *knee, yawn, mixed*.
  - Hebrew: **all 3,148 v3 Hebrew clips** were transcribed with ElevenLabs Scribe (homophone-aware comparison). The 104 below 0.8 got a second, independent opinion from the local ivrit-ai Whisper model. All 3,148 were also run through a wav2vec2 phoneme model, and the consonant skeleton was compared with the written word.
- **Audio fixes (2026-10-25, approved by Dudi):**
  - **Heteronyms:** 24 entries now have their own clip for their meaning/part of speech: 19 new EN clips (`audio/en/11001–11019`), e.g. *close* (v), *live* (adj), *tear* (n), *use* (n), *record* (n), *object/insult/progress/present/produce/permit/protest/suspect/associate* (v), *separate/content* (adj), *estimate/excuse/conduct* (n).
    - Each one was cut from a carrier sentence and verified with a phoneme model (stress/vowel) and Whisper.
    - Clips already checked as correct: *lead, read, wind, bow, row, minute, wound, desert, refuse, rebel* and others.
  - **"mixed"** was re-recorded from the respelling "mikst." (`en/11020`).
  - **Hebrew:** 32 clips were re-recorded with explicit niqqud and verified by Scribe and ivrit-ai (`audio/he/11001–11032`). Examples:
    - להירקב
    - וו
    - יד, which had been read as letter names
    - פה (mouth), which had been read as "here"
    - short words ending in ר: הר, צר, קר, דור, כפר, קבר, אוצר, העבר
  - Fixed clips always get **new file numbers** (`tools/audio_fix.json`), so no stale cached audio can play. Learner progress is keyed by word number, so it is untouched.
  - Cost: **376 TTS credits + ≈1,450 speech-to-text credits**.
  - Durations of all clips were checked; there were no outliers.
- **Extra tracks (eq-3.3, approved within the ~15k credit cap):** 1,304 EN + 1,323 HE new clip files (`audio/en|he/20001–32300`); the rest are reused where the text is identical. Same voices, model and processing as above.
  - "Letter" clips for `abc` say "B, as in bus."; `early` reuses existing Pre-Band I clips.
  - Heteronyms: *attribute* (n) and *incline* (n) were cut from carrier sentences (`audio_fix.json`). Other stress-ambiguous NAWL words (approximate, associate, aggregate, articulate…) are spoken in the citation form for the listed part of speech.
  - **QA EN:** Whisper small.en on all of them. The 214 clips Whisper could not read (empty or hallucinated output on single words) got an ElevenLabs Scribe second opinion. The 17 remaining mismatches were homophones (cue/Q, dye/die, cache/cash, route/root, pole/poll, palate/palette, herald/Harold…) except 5 real errors, which were re-recorded and re-checked: *hull* (spoken "the hull"), *null* ×2, *mere*, *cocoon* (`en/40874, 41227, 42009, 42015, 42253`).
  - **QA HE:** Scribe on all 1,323. The 77 below 0.8 got an ivrit-ai second opinion and listening-level phoneme review. 40 were re-recorded with niqqud (`he/40xxx–42xxx`, spoken texts in `tools/src/extra/say.json`). Glosses for *cattle* (בקר, פרות), *pulse* (tech: פולס, דופק) and *morphological* (צורני, מורפולוגי) were clarified so the audio is unambiguous.
  - Fixes always use new file numbers (n+10000), so no stale cached audio can play.
  - Cost: **≈8,594 TTS + ≈380 STT credits** (cap 15,000).
- **Offline:** audio is not precached. Each clip is cached on first play, and the "אני" tab can download a whole list for offline use. The browser voice (🤖) remains only as a fallback, if a file fails to load.

| Track | EN clips | HE clips |
|---|---|---|
| Pre-Band I | 198/198 | 198/198 |
| Band I · Core I | 549/549 | 549/549 |
| Band I · Core II | 601/601 | 601/601 |
| Band II · Core I | 1014/1014 | 1014/1014 |
| Band II · Core II | 1002/1002 | 1002/1002 |
| Band III · Core I | 886/886 | 886/886 |
| Band III · Core II | 1100/1100 | 1100/1100 |
| abc (letters) | 26/26 | 26/26 |
| early | 36/36 | 36/36 |
| acad (NAWL) | 943/943 | 943/943 |
| tech (NCSAWL) | 429/429 | 429/429 |
| c2 (Octanove subset) | 300/300 | 300/300 |

## 5. Privacy and local persistence
- **No server:** there is no server, account, analytics or third-party request. Every request is a same-origin GET of a static file. `tools/test_backup.js` asserts this.
- **On-device storage:** progress is kept in `localStorage`, plus a mirror copy in IndexedDB. `navigator.storage.persist()` is requested.
- **Automatic recovery:** if localStorage is wiped, progress is restored from the mirror on the next start. If a player's data is missing and there is no mirror, a restore prompt appears.
- **Backups the parent controls:**
  - A JSON file (schema 2, all players + SRS). It uses the Web Share sheet on phones and a download elsewhere.
  - A copy-paste code: `EQ2-…`, deflate + base64url + checksum.
  - Optional auto-save to a chosen file (File System Access API, Chrome/Edge desktop).
- **Safe imports:** a backup is parsed with `JSON.parse` only, then copied through a whitelist. Prototype keys are dropped, strings are capped with `<>` stripped, and numbers and grades are clamped. Schema-1 single-player exports are migrated.
- **Reminder:** a gentle backup reminder appears after 4 days with progress and no backup.
