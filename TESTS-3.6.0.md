# eq-3.6.0 live test evidence

Run against https://dudidd-wq.github.io/english-quest/ (SW eq-3.6.0), tools/test_v3.js unless noted. Times are Asia/Jerusalem.

| when | chunk | runs | fails | result |
|---|---|---|---|---|
| 2026-10-26 10:39 | mobile grades 1–3 | 4 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 10:41 | desktop grades 1–3 | 4 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 10:46 | mobile grades 4–7 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 10:52 | desktop grades 4–7 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 11:00 | mobile grades 8–12 | 6 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 11:07 | desktop grades 8–12 | 6 | 0 | ERRORS 2 / EXIT 1 |
| 2026-10-26 11:13 | mobile post 12 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 11:18 | desktop post 12 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 10:3x | tools/live_check.js (SW eq-3.6.0, caches, data files 200) | – | 0 | EXIT 0 |
| 2026-10-26 10:3x | tools/test_backup.js (desktop export/import) | – | 0 | PASS |
| 2026-10-26 10:3x | tools/test_upgrade.js (3.5.0 → 3.6.0 upgrade, REFRESH purge) | – | 0 | PASS |
| 2026-10-26 11:30 | tools/test_remap.js (local) | – | 0 | PASS |
| 2026-10-26 11:05 | tools/test_r3.js (R2/R6/R7/R10 UI: g2 no banners, g3 no scramble/type, track themes, 📊 parents button) | – | 0 | PASS |
| 2026-10-26 11:05 | audio md5 live == repo (en 8057, en 1133, he 0893, he 11101) | – | 0 | same |
