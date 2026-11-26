# One-off import: `2026 Quran.xlsx`

The old Google Sheets workbook is colour-coded: in every grid **row = day of month, column = month**;
green = done, orange = partial, red = not done. Sheet names do not match their content:

| Sheet | Content | Target |
| --- | --- | --- |
| Жеке хатм 2025 / 2026 | Pages read per day (`Сүре 137-140-бет`) | `khatm_log` |
| уирд 2026 | Таңғы (A–K) / Кешкі (N–X) зікір, Jan–Nov 2026 | `days.dhikr_morning/evening` |
| уирд 2025 | Таңғы зікір, Кешкі зікір, Тоһа + Әмәнәр (one column), Sep–Dec 2025 | `days.dhikr_*`, `days.wird_taha/amana` |
| Хифз 2025 / 2026 | `Сүре N-рет` per day | `hifz_log` |
| Руза хатм | Ramadan khatm, no month label | not imported |

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
