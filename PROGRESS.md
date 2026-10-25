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
  - [ ] Full Playwright rerun (all grades × mobile/desktop) → REVIEW.md → push both repos → verify live
Grade map (Curriculum 2020 Table 4/5): 4=PreBand I+B1C1, 5=B1C1/B1C2, 6=B1C2, 7=B2C1, 8=B2C1/B2C2, 9=B2C2, 10–12: 3pts=Band II, 4pts=B3C1, 5pts=B3C1+B3C2
