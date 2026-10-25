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
| ד׳ (4) | Pre-Band I → Band I Core I | Table 4 |
| ה׳ (5) | Band I Core I / Core II (the learner switches in mid-year) | Table 4 ("mid-Grade 5") |
| ו׳ (6) | Band I Core II | Table 4 |
| ז׳ (7) | Band II Core I | Table 4 |
| ח׳ (8) | Band II Core I / Core II (the learner switches in mid-year) | Table 4 ("mid-Grade 8") |
| ט׳ (9) | Band II Core II | Table 4 |
| י׳–י״ב, 3 יח״ל | Band II Core I + II | Table 5 (A2 = Bagrut 3 points) |
| י׳–י״ב, 4 יח״ל | Band III Core I | Table 4/5 (B1 = 4 points) |
| י׳–י״ב, 5 יח״ל | Band III Core I + Core II | Table 4/5 (B2 = 5 points, cumulative) |

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
- **Recorded clips** (ElevenLabs, voices Matilda for English and Tomer for Hebrew) come from band2-study. They cover every Band II word.
- A word in another list reuses a Band II clip only when its English (or Hebrew) text is identical.
  - Known risk: heteronyms such as *live, read, wind, lead, tear, close* may be voiced with the Band II reading.
- **Words without a clip** use the browser's speechSynthesis voice. These are flagged in the app with 🤖: an icon on the word, a note in the Study tab, and a short "קול דפדפן" banner while it plays.
- **No new TTS was generated.** Estimate for full coverage: about 25k ElevenLabs credits (≈ $5.5–7.5) for 2,780 English and 3,148 Hebrew clips. This is waiting for Dudi's approval.

| Track | EN clips | HE clips |
|---|---|---|
| Pre-Band I | 45/198 | 17/198 |
| Band I · Core I | 109/549 | 25/549 |
| Band I · Core II | 163/601 | 58/601 |
| Band II · Core I | 1014/1014 | 1014/1014 |
| Band II · Core II | 1002/1002 | 1002/1002 |
| Band III · Core I | 141/886 | 46/886 |
| Band III · Core II | 96/1100 | 40/1100 |
