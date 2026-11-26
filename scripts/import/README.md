# One-off import: `2026 Quran.xlsx`

The old Google Sheets workbook is colour-coded: in every grid **row = day of month, column = month**;
green = done, orange = partial, red = not done. Sheet names do not match their content:

| Sheet | Content | Target |
| --- | --- | --- |
| Жеке хатм 2025 / 2026 | Pages read per day (`Сүре 137-140-бет`) | `khatm_log` |
| уирд 2026 | Таңғы (A–K) / Кешкі (N–X) зікір, Jan–Nov 2026 | `days.dhikr_morning/evening` |
| уирд 2025 | Таңғы зікір, Кешкі зікір, Тоһа + Әмәнәр (one column), Sep–Dec 2025 | `days.dhikr_*`, `days.wird_taha/amana` |
| Хифз 2025 / 2026 | `Сүре N-рет` per day | `hifz_log` |
| Руза хатм | Ramadan khatm, no month label | skipped (owner decision) |

```bash
python3 -I scripts/import/quran_xlsx.py "2026 Quran.xlsx" quran.json   # parse + list skipped cells
python3 -I scripts/import/quran_sql.py quran.json import.sql            # one transaction
supabase db query --linked -f import.sql                                 # run from the linked repo root
```

The SQL refuses to run twice (aborts if `khatm_log`/`hifz_log` already have rows), fills `days` only where a
field is still empty (marks made in the app win), and logs the run in `imports`.

Imported 2026-11-26: 423 zikir days, 100 wird days, 540 khatm readings, 31 hifz entries; 3 cells skipped
(orange partial-ayah khatm 2025-02-05; red hifz 2026-01-24/25). Checks against SPEC/canvas: khatm 2026 = 459 pages,
position 595/604, Jan 124 pages; wird 2025 = 94/100; Nov 2025 = 26/30 (4 partial); evening zikir best streak 26 → 27 Jan 2026.

# One-off import: `Жәннәт бақшасы 2025/2026`, `Креатин_Протеин`, `2024 Quran`

```bash
# put the four files in one folder as jb2025.xlsx, jb2026.xlsx, kp.xlsx, quran2024.xlsx
python3 -I scripts/import/namaz_health_xlsx.py <folder> rest.json
python3 -I scripts/import/namaz_health_sql.py rest.json rest.sql
supabase db query --linked -f rest.sql
```

| Source | Content | Target |
| --- | --- | --- |
| Жәннәт бақшасы — month sheets | Column per prayer (header in row 1), row = day. Green уақытында / оқылды, red қаза / оқылмады, orange өтелді, cyan мешітте | `days.tan … quptan, tungi, duha, utir` |
| ″ «Құптан+Үтір» (2025 Jan–Aug) or «Құптан» | Witr follows Құптан; exceptions from the sheet notes: 2026-09-13 қаза, 2026-03-25 өтелді, Apr/May 2026 witr made up | `days.utir` |
| ″ «Ораза» | Green ұстадым, cyan қаза болды, blue қаза өтедім, yellow → ұстамадым; red (no fast) left empty | `days.oraza` |
| Креатин_Протеин | Green 5 г, cyan 6 капсула, yellow 3 капсула, red өткізілді; protein only Dec 2025 | `days.creatine`, `days.protein` |
| 2024 Quran «Жеке хатм» | Pages per day, 2024 | `khatm_log` |
| Not imported | «Қаңтар ТН» (copy of January's tahajjud column), «76 days» (reading plan), «QQ хатм» (group para assignments), «Истихара» column | — |

Imported 2026-11-26: 693 days with namaz, 332 creatine days, 103 oraza days, 318 khatm readings (2024).
Checks: Nov 2026 (1–24) on-time 86/120 = 71.67%; qaza 34 (Таң 13, Құптан 19, Бесін 2), 4 made up; mosque 6, 13, 20 Nov;
Oct 2026 76.13%; Oraza 2026 35 days, 4 qaza all made up. Every month's qaza counts also match the summary notes in the sheets.
