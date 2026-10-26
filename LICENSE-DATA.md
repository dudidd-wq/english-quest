# Data licences

This file covers the **word data** in `data/*.json` and the audio clips in `audio/`. The app code is separate.

## Official tracks (pre1, b1c1, b1c2, g7, g9, b3c1, b3c2)
These come from the Israel Ministry of Education Lexical Bands word lists (see `SOURCES.md` §1 for the exact files). The word lists belong to the Ministry. We use them for non-commercial teaching and credit the source. We do not redistribute them under a different licence. The Hebrew glosses, emoji, sentences, stage split and audio were added for this app.

## Derived tracks (post-12 and early)
| Track | Based on | Licence of the source | Licence of our derived file |
|---|---|---|---|
| `acad` | NAWL 1.2 – New Academic Word List (Browne, Culligan & Phillips) | CC BY-SA 4.0 | **CC BY-SA 4.0** (share-alike) |
| `c1`, `c2` | Octanove Vocabulary Profile `olp-en-cefrj` (Octanove Labs) | CC BY-SA 4.0 | **CC BY-SA 4.0** (share-alike) |
| `tech` | NCSAWL – Uba, Irudayasamy & Hankins (2023), doi:10.5430/wjel.v13n5p319 | CC BY 4.0 | **CC BY 4.0** |
| `early`, `abc` | A subset of the MoE Pre-Band I list, plus letter cards written for this app | as above (MoE) | as for the official tracks |

For the derived tracks, "derived file" means `data/<track>.json` together with its inputs in `tools/src/extra/`. Each file holds the source headwords plus material we wrote: the Hebrew glosses, emoji, stage split, sentences and the matching `audio/` clips.

**What we changed:** we chose a subset of each list, added Hebrew translations, re-ordered the words into stages and recorded audio (ElevenLabs TTS). The NCSAWL items we did not use are listed in `SOURCES.md`.

**Attribution when reusing:** name the original list and its authors and link its licence. Also name "English Quest (dudidd-wq/english-quest)" and state that you changed the material. The use of these lists does not imply endorsement by their authors.

Licence texts: CC BY 4.0 <https://creativecommons.org/licenses/by/4.0/> · CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0/>
