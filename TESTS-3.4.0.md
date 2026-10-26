# eq-3.4.0 live test evidence

Run against https://dudidd-wq.github.io/english-quest/ (SW eq-3.4.0), tools/test_v3.js unless noted. Times are Asia/Jerusalem.

| when | chunk | runs | fails | result |
|---|---|---|---|---|
| 2026-10-26 04:10 | mobile grades 1–3 + extras (migration, profiles, offline) | 4 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 04:23 | mobile grades 4–7 | 4 | 0 | ERRORS 0 / EXIT 0 |
| 2026-10-26 04:36 | mobile grades 8–12 (g11: page.goto 30 s timeout on live, rerun below) | 4 | 1 | ERRORS 1 / EXIT 1 |
| 2026-10-26 04:38 | mobile grade 11 rerun (transient network timeout) | 1 | 0 | ERRORS 0 / EXIT 0 |
