# eq-3.7.0 live test evidence

Run against https://dudidd-wq.github.io/english-quest/ (SW eq-3.7.0), tools/test_v3.js unless noted. Times are Asia/Jerusalem.

| when | chunk | runs | fails | result |
|---|---|---|---|---|
| 2026-10-26 13:30 | mobile grades 1–3 | 4 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 13:31 | desktop grades 1–3 | 4 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 13:37 | mobile grades 4–7 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 13:42 | desktop grades 4–7 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 13:50 | mobile grades 8–12 | 6 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 13:58 | desktop grades 8–12 | 6 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 14:02 | mobile post 12 | 4 | 1 | ERRORS 3 / EXIT 1 |
| 2026-10-26 14:08 | desktop post 12 | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 14:15 | mobile post 12 (rerun after transient Pages 503) | 5 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 14:27 | live_check.js (SW eq-3.7.0, caches eq-shell-eq-3.7.0 + eq-audio-v2, all data/*.json 200) | 1 | 0 | PASS |
| 2026-10-26 14:27 | test_backup.js (export/import, reminder) | 2 | 0 | PASS |
| 2026-10-26 14:27 | test_upgrade.js (3.6 → 3.7 upgrade keeps progress, no stale eq-audio-* cache) | 1 | 0 | PASS |
| 2026-10-26 14:27 | test_remap.js | 1 | 0 | PASS |
| 2026-10-26 14:27 | test_r3.js | 1 | 0 | PASS |
| 2026-10-26 14:27 | test_a11y.js (axe WCAG 2.1 A/AA, 8 profiles) | 8 | 0 | SERIOUS 0 (one console 404 = https://dudidd-wq.github.io/favicon.ico, see below) |
| 2026-10-26 14:27 | test_404.js | 5 | 0 | 0 HTTP≥400 |

Note on the one console 404: it is Chrome's automatic favicon request for the ORIGIN ROOT (dudidd-wq.github.io/favicon.ico, outside this repo) that fires when a harness first opens /english-quest/manifest.webmanifest directly (a non-HTML page has no <link rel=icon>) to wipe storage. Reproduced in isolation with /tmp/fav.js; the app pages themselves request icons/icon-192.png (200). This explains the reviewer's "one-off 404 after profile creation".
Audio spot check: audio/en/50402, en/62010, en/55017, he/50872 → 200.
