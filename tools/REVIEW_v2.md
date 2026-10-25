# Independent review – English Quest v2 (2026-10-23)

**Reviewer stance:** skeptical game designer for ages 12–15 + QA. Goal was to kill “quiz with XP stickers” and make a mobile game teens actually open.

Playwright mobile 390×844 + desktop 1280×860: **0 page errors**. Offline map OK. Scramble-fail + boss-loss paths OK. New Blitz mode exercised.

| Category | Score | Notes |
|---|---|---|
| Fun / engagement (12–15) | **9.2** | Mission CTA (~2 min), Blitz lives+ghost, daily challenge, “עוד סיבוב / לבוס” hooks, streak banners. Still some MC modes, but core loop is session-shaped not worksheet-shaped. |
| Visual design / game HUD | **9.3** | Neon arcade (cyan/magenta), island story beats, mission hero, juicy pop/shake/floaty, punchy Web Audio. Not purple-edu anymore. |
| Hebrew RTL / UX clarity | **9.5** | Rubik RTL, big targets, onboard = track → nickname+avatar (<30s), parent gate intact. |
| Pedagogy / MoE | **9.0** | g7/g9 Core I/II, senses, Leitner SRS, audio EN+HE unchanged. |
| Mini-games | **9.1** | Match (timing), Blitz (reflexes), scramble, memory skill-based; boss HP+hearts+stinger; listen/fill still MC but faster timers in boss. |
| Meta (cosmetics / daily / rival) | **9.0** | Auras+titles shop, daily kinds, local ghost rival (בליץ/קומבו). Cosmetics change HUD glow — matters. |
| Audio / offline PWA | **9.0** | SW `eq-2.0.0`, shell+audio caches, offline map verified. |
| Mobile / a11y / safety | **9.0** | Shots clean; no API keys; non-human avatars; keyboard 1–4. |
| Polish / bugs | **9.0** | Boss “הבוס תוקף!” burst can overlap HP briefly; Blitz timer is thin — readable enough. |

**Overall: 9.2 / 10** — fun/engagement and design ≥9; all other categories ≥9.

### What would push fun to 9.5+
- Particle bursts on every correct (canvas), not only combo thresholds.
- Optional swipe-match or drag mode for variety.
- Stronger island parallax / path art (currently colored panels + nodes).

### Risks
- Returning players with `englishQuest.v1` get new fields via merge; cosmetics default empty — OK.
- Aggressive Blitz timers (~1.4–2.8s) may frustrate weaker readers; lives×3 softens it.
- GitHub Pages cache: SW bump required (done `eq-2.0.0`); hard refresh may still be needed once.
