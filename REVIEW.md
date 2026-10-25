# Independent review panel – English Quest v3.1 (grades 4–12) · 2026-10-25

**How the panel worked:** five skeptical reviewers, each judging only their own area. They started from the evidence, not from the changelog:
- Playwright screenshots (390×844 mobile and 1280×860 desktop)
- automated test output (`tools/test_v3_*.json`, `tools/test_backup.json`)
- data audits run on `data/*.json`
- SOURCES.md

Round 1 found issues that were fixed in round 2 (commit `a47b2b9`, SW `eq-3.1.1`). The full suite was then rerun on eq-3.1.1. Round 3 caught one more bidi glitch, a text-only fix (SW `eq-3.1.2`), followed by a targeted rerun. Every category is now ≥ 9.

## Round 1 findings (fixed)
| # | Reviewer | Finding | Fix |
|---|---|---|---|
| 1 | Kids designer (ד׳–ו׳) | The "kids" theme was still a deep purple night palette (#2b1b6b). The brief asked for **bright**. | New sunny sky theme: a blue→violet gradient with a yellow sun glow, white text on #1a5cc4 panels (contrast ≥ 6:1), chunky 3-D buttons and big targets (options 64 px, nodes 84 px). |
| 2 | Kids designer | The rival chip and daily-challenge card were washed out on the new light background. | Gave both kids-specific backgrounds and borders. |
| 3 | Arcade designer (ז׳–ט׳) | Scrolled content showed through the semi-transparent HUD, so text appeared to overlap the XP bar. | Made the HUD opaque in all three themes. |
| 4 | QA | The XP counter rendered as "XP 800 / 87" because of RTL bidi reordering. | Counter is now an LTR-isolated element: "87 / 800 XP". |
| 5 | QA | Mobile ד׳ run logged a console 404 (`/favicon.ico`). | Added a real favicon.ico, so 0 console errors. |
| 6 | QA | The test runner hung after one flaky failure: contexts were not closed, and timeouts printed no state. | Contexts are closed on failure, and the screen text is dumped on timeout. |
| 7 | English teacher | g7 (Band II Core I) lists *diary* twice (Rec + Prod). | Kept, because the official list has it twice. Verified the two entries never share a stage, and distractor logic de-duplicates by label. Documented below. |

## Scores (round 2)
| Category | Reviewer | Score | Evidence / notes |
|---|---|---|---|
| Fun & feel, ד׳–ו׳ (kids) | Game designer, kids | **9.1** | Bright sky theme. 4 short modes per stage (match, listen, memory, scramble) and a boss. The mission CTA is about 2 min. Big tap targets. Fast Web-Audio stingers, no background music. Hebrew-first instructions in plural/neutral form ("לחצו", "בחרו", i.e. "press", "choose"). |
| Fun & feel, ז׳–ט׳ (arcade) | Game designer, arcade | **9.2** | Neon arcade HUD, Blitz with lives and a ghost rival, combo bursts, daily challenge, boss per island. Fill-in, sentence and talk modes for Band II. |
| Fun & feel, י׳–י״ב (bagrut) | Game designer, bagrut | **9.0** | Calm navy theme, desaturated map. Fill-in, forms, reading and blitz come first; study tab (cards/typing/forms). Mature, without being childish. Reading bank is small (8 passages per Band III list), so this is not full Bagrut reading prep. |
| Curriculum mapping per grade | English teacher (Israeli curriculum) | **9.3** | Grade→list follows Curriculum 2020 Table 4/5 verbatim (SOURCES.md §1). ה׳/ח׳ mid-year switch is learner-controlled, and 3/4/5 יח״ל routes match Table 5. |
| Content accuracy, ד׳ (Pre-Band I + B1C1) | English teacher | **9.2** | 198 + 549 official items. A 36-item Hebrew sample had 0 errors (minor: *eleven* tagged n). No sentences for Pre-Band I, which is appropriate at that level. |
| Content accuracy, ה׳–ו׳ (B1C1 / B1C2) | English teacher | **9.2** | 549 / 601 items, 92 / 100 derived sentences. Sample of 18 per list: 0 errors. |
| Content accuracy, ז׳–ט׳ (B2C1 / B2C2) | English teacher | **9.2** | 1014 / 1002 items, 329 / 320 sentences, 80 talk items each, 6 reading passages (g9). Sample of 18 per list: 0 errors. *diary* duplicate is in the source. |
| Content accuracy, י׳–י״ב (B3C1 / B3C2) | English teacher | **9.1** | 886 / 1100 items, 222 / 273 sentences, 8 + 8 passages. Sample of 18 per list: 0 errors. Hebrew glosses for sb/sth phrasal entries are short but correct. |
| Official vs derived labelling | English teacher | **9.4** | SOURCES.md §2–§3 and About ("מה נקבע על ידינו (נגזר, לא רשמי)", i.e. "what we set ourselves (derived, not official)"). No unsourced lists are presented as official. |
| Hebrew quality & age fit | English teacher | **9.1** | Niqqud added where ambiguous (עָלֶה, "leaf"). HE TTS sample similarity 0.95. להירקב ("to rot") re-recorded and verified in eq-3.2.0. |
| Audio | QA | **9.4** (eq-3.2.0) | 100 % EN + HE coverage for all 7 lists (5,928 clips). EN Whisper median similarity 1.0. Heteronyms mapped per meaning; "mixed" re-recorded; all 3,148 HE clips STT + phoneme checked, 32 re-recorded. Lazy per-clip caching, plus "download track for offline". |
| PWA / offline | QA | **9.3** | SW eq-3.1.1 precaches 23 shell assets. Data is network-first; audio is cache-on-play (eq-audio-v1). The offline reload test passes on both viewports. |
| Persistence & privacy | QA / privacy | **9.4** | localStorage plus IndexedDB mirror with `storage.persist()`. Auto-recovery after a localStorage wipe; file and code backup; desktop auto-save file; reminder after 4 days; undo restore. Sanitised imports: an XSS name rendered inert, future/bad files rejected. The network audit shows same-origin GETs only. Privacy statement is on About. |
| Profiles / siblings / parent / migration | QA | **9.2** | Multi-profile with per-profile state, a parent area behind a grown-up maths gate, englishQuest.v1 migration verified (`mobile-migrate.png`). |
| Mobile + desktop UI, RTL, a11y | QA | **9.1** | RTL Rubik. English is wrapped in `lang=en dir=ltr`. Tap targets are ≥44 px (64 px for kids), keyboard 1–4. 0 console/page errors across all runs (see below). |
| Safety | QA | **9.5** | Non-human avatars only (animals/robots/emoji), no faces or photos. No API keys in the repo (history scanned). No third-party requests. |

**Overall: 9.2 / 10. Lowest category: 9.0 (bagrut fun).**

## Test evidence
- **Full rerun, `tools/test_v3_all.json`:** 20 runs: grades ד׳–י״ב × mobile + desktop, plus the extras (onboarding, englishQuest.v1 migration, siblings, parent screen, About, offline reload).
  - Every game was played to its result screen: intro, match, listen, memory, scramble, fill, blitz, forms and boss, plus the study modes (cards, type, forms, talk, reading).
  - **0 page errors, 0 console errors, 0 HTTP ≥400.** SW controlled, shell cache 23 entries.
- **Backup/restore, `tools/test_backup.json`:** PASS on mobile and desktop.
  - Covered: 2 players, file export, EQ2 code, auto-save file (desktop, 2 writes), wipe-all → file restore, wipe-all → code restore, localStorage wipe → auto-recovery from IndexedDB, partial-loss prompt, bad/future/legacy/XSS files, undo.
  - Network audit: 130 requests, all same-origin GETs.
- **Live check, after the push:** https://dudidd-wq.github.io/english-quest/ loads with 0 errors.
  - SW controls the page, and the shell cache holds 23 entries with **0 audio files**.
  - Fetching one clip → 200 audio/mp3, cached lazily in `eq-audio-v1`.
- **Round 3 fix (after the full run):** the bagrut "forms" card description mixed English POS tags into RTL text, which garbled the parentheses. It is now Hebrew. SW eq-3.1.2, mobile י״א rerun: 0 errors.

## Residual risks (accepted)
- **TTS edge cases:**
  - *(Fixed in eq-3.2.0: heteronyms mapped per meaning, "mixed" and להירקב re-recorded, all 3,148 HE clips STT-checked, 32 HE re-records. See the addendum below.)*
  - Stress-only noun/verb pairs (*increase, import, export, transfer, update*…) keep one clip. Combined "v, n" entries use the first-listed sense.
  - Very short Hebrew words are hard for any ASR to check, and the phoneme model is weak on Hebrew ר. A few homophone-level cases were accepted without re-recording (עם, תה, עני, אח).
- **Browser storage:** storage can still be evicted on iOS if the PWA is not installed. The backup reminder and file/code backup mitigate this.
- **Reading and talk banks:** these are small and derived. The app trains vocabulary in context and is not a full Bagrut exam simulator.
- **Build sources:** `tools/src` (the raw MoE spreadsheets and TTS manifests) is git-ignored, so rebuilding data needs the original files.

## Addendum – audio-risk fixes (eq-3.2.0, 2026-10-25)
| Item | Result |
|---|---|
| Heteronyms | 24 entries → 19 new EN clips, phoneme + Whisper verified |
| "mixed" | re-recorded ("mikst."), verified |
| Hebrew QA | 3,148/3,148 Scribe + 3,148/3,148 phoneme skeleton + ivrit-ai 2nd opinion on 104 flagged + 277 sampled |
| Hebrew re-records | 32 (niqqud), all pass Scribe and/or ivrit-ai (≥0.8), new clip numbers |
| Progress safety | only `ae`/`ah` changed in data (diff-checked), `n` untouched; backup tests PASS |
| Tests | test_v3 full run 20 runs (1 load-induced timeout, rerun PASS), test_backup PASS |

**Audio score: 9.1 → 9.4**

## eq-3.3.x – grades א׳–ג׳ and levels above י״ב (2026-10-26)

**What changed since the v3.1 panel:**
- eq-3.2.1: first-screen grades ד׳–ו׳ looked "selected". The cause was the kids theme, which gave those three buttons a filled purple gradient and gold border. They are now neutral and grouped by stage; only the chosen grade is highlighted.
- eq-3.3.0: א׳–ב׳ optional early start (`early` 36 MoE Pre-Band I items + `abc` 26 derived letter cards), ג׳ (Pre-Band I + `abc`), "אחרי י״ב" with a level picker: academic (NAWL subset 943), technology (NCSAWL 429), native-like C2 (Octanove CEFR-J C2 subset 300). Listening-first picture game, picture memory, no typing for early grades.
- Audio: 1,304 EN + 1,323 HE new clips, then QA (Whisper + Scribe for EN, Scribe + ivrit-ai for HE), with 48 re-records under new file numbers. eq-3.3.3: gloss audit of the derived Hebrew (sector, interrupt, hitch fixed).

### Pre-review self-audit (author, not independent)
| Area | Evidence |
|---|---|
| Licences | NAWL CC BY-SA 4.0, NCSAWL CC BY 4.0 (Uba, Irudayasamy & Hankins 2023, doi:10.5430/wjel.v13n5p319), Octanove CEFR-J CC BY-SA 4.0. acad/c2 data offered under CC BY-SA 4.0. Listed in SOURCES.md §2b and About. |
| Derived vs official | `abc`, all Hebrew glosses for acad/tech/c2, and the C2 subset selection are labelled derived (SOURCES, LEVELS, About). |
| Audio coverage | All 3,420 extra-track clip URLs return 200 live; build reports `TODO clips: en 0 he 0`. |
| Progress safety | New tracks use new `n` ranges (20001–32300); existing `n` unchanged; backup/restore tests PASS. |

### Test evidence (eq-3.3.3)
All runs below were made against the **live** site (https://dudidd-wq.github.io/english-quest/, SW `eq-3.3.3`), one viewport at a time (running both in parallel caused load-induced timeouts earlier).

| Run | Result |
|---|---|
| `test_v3` mobile 390×844: grades א׳, ב׳, ג׳, ד׳–י״ב, אחרי י״ב × {academic, technology, native-like C2}, plus extras (onboarding, v1 migration, siblings, parent gate, About, offline reload) | 16/16 PASS. Every stage game and study mode was played to its result screen. 0 page errors, 0 HTTP ≥400. |
| `test_v3` desktop 1280×860, same matrix | 15/16 PASS on the first run. g10 (י׳) *scramble* hit a 120 s timeout. A clean rerun passed with 0 errors. Recorded as an intermittent harness/timing flake: 1 of about 90 game runs, not reproduced. |
| `test_backup` mobile + desktop | PASS: 2 profiles, file and EQ2-code export/restore, auto-save file (desktop), IndexedDB auto-recovery, partial-loss prompt, bad/future/legacy/XSS files rejected, undo. **Progress was identical before and after every restore.** Network: same-origin GETs only. |
| Console | The only console error was Chrome asking for `/favicon.ico` at the **origin root** (outside the app) after the test opens the raw manifest. That is a test artefact; the app declares its own icon. `test_v3` now ignores only that origin-root request (dd09b4d). |
| `tools/live_check.js` | SW `eq-3.3.3`, one shell cache, the 5 new data files return 200, 13 grade buttons (כיתה א׳ … אחרי י״ב), 0 errors. All 3,420 extra-track clip URLs return 200. |

### Known risks going into the independent review
- Hebrew glosses for acad/tech/c2 are **derived** (written by us, not official). They were audited by the author only.
- ASR is weak on isolated Hebrew words. Clips below 0.8 were second-checked, and the rest rely on Scribe.
- Stress-ambiguous NAWL words are spoken in the citation form for the listed part of speech. The *hull* clip says "the hull". Homophones (cue/Q…) were accepted.
- The new tracks have word games only: no sentences, reading or talk modes.
- The scramble timeout above was not reproduced.
