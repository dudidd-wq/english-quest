# Extra levels: grades א׳–ג׳ and "after י״ב" – research and recommendation (2026-10-25)

## A. Early grades (א׳–ג׳)

| Fact | Source |
|---|---|
| English is compulsory from grade 4; most schools start in grade 3; some start in grades 1–2 (school-based). | MoE English Inspectorate, "English in Elementary School" (2011); Revised English Curriculum 2020, Elementary section |
| Curriculum 2020 begins with the **Pre-Basic User / Pre-A1 ("Pre-foundation")** stage for grade 3 / start of grade 4: listening and speaking first (rhymes, songs, chunks), phonemic awareness, recognising letters before reading. | English Curriculum 2020 (Elementary), Pre-Basic User benchmarks |
| The official word list for that stage is **Lexical Pre-Band I** (198 items, LexicalBand1.xlsx). It is already in the app (`pre1`). | MoE Lexical Bands |
| There is **no official MoE word list for grades 1–2**. | (no such list is published) |

**What we added**
- **ג׳** → `pre1` (official Pre-Band I) + `abc` (letters & sounds).
- **א׳–ב׳** = optional "early start" → `early` + `abc`.
- `early`: 36 picturable items taken from Pre-Band I. It is a subset of an official list; the subset rule is ours (derived).
- `abc`: 26 letters, each with a single example word ("B is for bus"). Derived; most example words come from Pre-Band I / Band I.
- Games for א׳–ב׳ are listening-first: hear the word, then tap a big picture or letter. A memory game uses picture pairs that speak the word when flipped. Intro cards play English and then Hebrew audio. No timers, and nothing requires reading.

## B. Above י״ב – candidates

| Candidate | What it is | Size | Licence | Fit | Effort | Decision |
|---|---|---|---|---|---|---|
| **NAWL 1.2** (Browne, Culligan & Phillips 2013) | Academic words beyond the NGSL core; ≈92 % coverage of academic text together with the NGSL | 959 (951 without prefixes) | **CC BY-SA 4.0** | Academic reading: university, psychometric English section (Amir/Amiram). Not an official NITE list. | Medium–high: Hebrew for every item + ≈1,900 clips | **Added** as "אקדמי / פסיכומטרי" (`acad`) |
| **NCSAWL** (Uba, Irudayasamy & Hankins 2023, WJEL 13(5), doi:10.5430/wjel.v13n5p319) | Computer-science academic word list | 444 | **CC BY 4.0** (article and appendix) | Technical/IT English for high-tech, CS studies and the Cyber/CS bagrut | Medium: CS-sense Hebrew needed; many EN clips reused | **Added** as "אנגלית טכנולוגית" (`tech`) |
| **Octanove Vocabulary Profile C1/C2 1.0** (openlanguageprofiles/olp-en-cefrj) | CEFR C1/C2 word list (1,111 C1 + 1,025 C2) | 2,136 | **CC BY-SA 4.0** | Near-native / proficient | Medium: needs a subset | **Added** a 180-word C1 subset ("מתקדמים (C1)") and a 300-word C2 subset as "קרוב לשפת אם" (`c2`), see rule below |
| CEFR-J A1–B2 (TUFS) | Japanese-context CEFR list | 7,800 | Free with citation; © TUFS (not CC) | Overlaps Bands I–III | — | Not needed (Bands cover A1–B2) |
| BSL / TSL (NGSL family) | Business / TOEIC words | 1,700 / 1,200 | CC BY-SA 4.0 | Business English | Medium | **Recommended next** (licence OK) |
| Coxhead AWL (2000) | Classic academic list | 570 families | Free for research/teaching; no open licence | Overlaps NAWL | — | Skip (NAWL is newer and openly licensed) |
| CSAVL (Coxhead/Dang) | Science academic list | — | Licence unclear | — | — | Skip |
| English Vocabulary Profile (Cambridge) | C1/C2 reference | — | Not openly licensed | — | — | Skip |
| NITE psychometric list | — | — | No official public list | — | — | NAWL is the openly licensed proxy; labelled as such |
| IELTS / TOEFL lists | Commercial | — | Proprietary | — | — | Skip |

**C2 subset rule (derived):** single-word C2 headwords in Octanove; drop the ones already in any Band, NAWL or NCSAWL list; drop offensive or sensitive items; rank by `wordfreq` English Zipf frequency; keep the 300 most frequent. The list is reproducible with `tools/build_c2_list.py (it also drops archaic/very rare items; lists already reachable elsewhere are excluded)`.

**C1 subset rule (derived, review #7 – a C1 step between 5 יח״ל and C2):** single-word C1 headwords in Octanove; drop words in any Band, NAWL, NCSAWL or the c2 subset; drop inflected forms of a listed/known word (plural, -ing, -ed); drop very frequent words (Zipf ≥ 4.8) whose C1 tag is an unusual sense of a word learners already know (e.g. condition_v, angle_v); drop odd POS tags and heteronyms (ODD1) and slang/adult/sensitive items (SENS1); rank by Zipf; keep 180. Reproducible with `tools/build_c1_list.py` → `tools/src/extra/c1_list.txt`; Hebrew in `c1_he.txt`. Track `c1`, n 33001+, shown in the post-12 picker before C2.

**Hebrew for all three levels** was written for this app. It is derived, not official; NAWL/Octanove carry no Hebrew. Where an item is already in an MoE list with the same sense, the app reuses that Hebrew and its clips.

**In the app:** grade "אחרי י״ב" (13) uses a level picker (אקדמי / טכנולוגי / קרוב לשפת אם) and the calm "bagrut" theme. All three lists are reachable from the track toggle. Progress is keyed by stable word numbers (abc 20001+, early 21001+, acad 30001+, tech 31001+, c2 32001+).
