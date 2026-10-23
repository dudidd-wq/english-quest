# English Quest – מסע מילים באנגלית

משחק־לומדה בעברית (RTL) ללימוד אוצר מילים באנגלית לפי **רשימת משרד החינוך Lexical Band II** לכיתות ז׳ ו־ט׳.

**שחקו כאן:** https://dudidd-wq.github.io/english-quest/

## מה יש בפנים
- מפת עולמות, שלבים, XP, מטבעות, רצף ימים, הישגים וחנות דמויות (רק אווטארים לא־אנושיים)
- משחקונים: הכרת מילים, התאמה מהירה, **בליץ** (רפלקסים), האזנה, בלגן אותיות, השלמת משפט, זיכרון, קרב בוס + חזרה (SRS)
- מטא: משימות קצרות, איי־סיפור, אתגר יומי, יריב־צל מקומי, הילות ותארים בחנות
- הגייה מוקלטת לכל מילה (אנגלית + עברית) עם נפילה ל־speechSynthesis
- PWA לנייד עם עבודה חלקית אופליין (מעטפת + אודיו שנשמע נשמר במטמון)
- שמירה מקומית בלבד (`localStorage`) – בלי חשבון ובלי מפתחות API

## מקורות
- [Lexical Band II – Junior High (xlsx)](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand2.xlsx)
- Revised English Curriculum 2020, Table 4: **Core I ≈ כיתה ז׳**, **Core II ≈ כיתה ט׳**
- הקלטות מתוך הפרויקט [band2-study](https://github.com/dudidd-wq/band2-study) (ElevenLabs Matilda / Tomer)

## הרצה מקומית
```bash
python3 -m http.server 8765
# פתחו http://127.0.0.1:8765/
```

בדיקות Playwright: `node tools/play.js` (דורש Chrome + playwright-core).

## רישיון גופן
Rubik – ראו `fonts/LICENSE-Rubik.txt`.
