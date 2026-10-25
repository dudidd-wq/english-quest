# English Quest – מסע מילים באנגלית

משחק־לומדה בעברית (RTL) ללימוד אוצר מילים באנגלית **לכיתות ד׳–י״ב**, לפי הרשימות הלקסיקליות של משרד החינוך (Pre-Band I, Band I, Band II, Band III) ותוכנית הלימודים Curriculum 2020. פירוט המיפוי והמקורות: [SOURCES.md](SOURCES.md).

**שחקו כאן:** https://dudidd-wq.github.io/english-quest/

## מה יש בפנים
- מפת עולמות, שלבים, XP, מטבעות, רצף ימים, הישגים וחנות דמויות (רק אווטארים לא־אנושיים)
- משחקונים: הכרת מילים, התאמה מהירה, **בליץ** (רפלקסים), האזנה, בלגן אותיות, השלמת משפט, זיכרון, קרב בוס + חזרה (SRS)
- מטא: משימות קצרות, איי־סיפור, אתגר יומי, יריב־צל מקומי, הילות ותארים בחנות
- הגייה מוקלטת לכל מילה בכל הכיתות (אנגלית + עברית, ElevenLabs Matilda / Tomer)
- PWA לנייד שעובד אופליין (מעטפת + נתונים; הקלטות נשמרות לפי רשימה)
- שמירה מקומית בלבד – בלי שרת, בלי חשבון ובלי מפתחות API. גיבוי לקובץ או לקוד, שמירה אוטומטית לקובץ (במחשב), עותק ב־IndexedDB ושחזור אוטומטי

## מקורות
- [Lexical Band II – Junior High (xlsx)](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand2.xlsx)
- Revised English Curriculum 2020, Table 4: **Core I ≈ כיתה ז׳**, **Core II ≈ כיתה ט׳**
- הקלטות מתוך הפרויקט [band2-study](https://github.com/dudidd-wq/band2-study) (ElevenLabs Matilda / Tomer)

## הרצה מקומית
```bash
python3 -m http.server 8765
# פתחו http://127.0.0.1:8765/
```

בדיקות Playwright: `node tools/test_v3.js` (כל הכיתות) ו־`node tools/test_backup.js` (גיבוי ושחזור). דורש Chrome + playwright-core.

## רישיון גופן
Rubik – ראו `fonts/LICENSE-Rubik.txt`.
