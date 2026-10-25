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
| Hebrew quality & age fit | English teacher | **9.1** | Niqqud added where ambiguous (עָלֶה, "leaf"). HE TTS sample similarity 0.95. One residual mispronunciation risk: להירקב ("to rot"). |
| Audio | QA | **9.1** | 100 % EN + HE coverage for all 7 lists (5,928 clips). EN Whisper median similarity 1.0. Residual: "mixed" heard as "next" by ASR (human ear: OK). Lazy per-clip caching, plus "download track for offline". |
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
  - Heteronyms reuse one clip per spelling (e.g. *live*, *read*, *lead*, *tear*, *close*, *wind*).
  - "mixed" and "להירקב" were flagged by ASR.
  - Hebrew QA was a random sample (80 clips), not every clip.
- **Browser storage:** storage can still be evicted on iOS if the PWA is not installed. The backup reminder and file/code backup mitigate this.
- **Reading and talk banks:** these are small and derived. The app trains vocabulary in context and is not a full Bagrut exam simulator.
- **Build sources:** `tools/src` (the raw MoE spreadsheets and TTS manifests) is git-ignored, so rebuilding data needs the original files.
