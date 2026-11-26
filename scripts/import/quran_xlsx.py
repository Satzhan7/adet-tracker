"""Parse '2026 Quran.xlsx' (colour-coded grids: row = day, column = month) into rows for days / khatm_log / hifz_log."""
import sys, json, re, calendar, openpyxl
from collections import defaultdict

GREEN, ORANGE, RED = "FF00FF00", "FFFF9900", "FFFF0000"
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
fill = lambda c: c.fill.fgColor.rgb if c.fill and c.fill.fill_type == "solid" else None
problems = []

def grid(ws, year, first_col, months):
    """Yield (iso_date, cell) for each real calendar day in a month-per-column block."""
    for i, month in enumerate(months):
        col = first_col + i
        for day in range(1, calendar.monthrange(year, month)[1] + 1):
            yield f"{year}-{month:02d}-{day:02d}", ws.cell(row=day, column=col)

STATUS = {GREEN: "орындалды", ORANGE: "ішінара", RED: "жоқ"}
WIRD = {GREEN: "оқыдым", ORANGE: "ішінара", RED: "жоқ"}
days = defaultdict(dict)

def colour_block(ws, year, first_col, months, field, mapping):
    for date, c in grid(ws, year, first_col, months):
        f = fill(c)
        if f in mapping:
            days[date][field] = mapping[f]
        elif f not in (None, "00000000", "FFFFFFFF"):
            problems.append(f"{ws.title} {c.coordinate} {date}: unknown colour {f}")

# Zikir 2026 (sheet 'уирд 2026'): A..K = morning Jan..Nov, N..X = evening Jan..Nov
z26 = wb["уирд 2026"]
colour_block(z26, 2026, 1, range(1, 12), "dhikr_morning", STATUS)
colour_block(z26, 2026, 14, range(1, 12), "dhikr_evening", STATUS)
# 2025 (sheet 'уирд 2025'): A..D morning, F..I evening, K..N Тоһа+Әмәнәр, Sep..Dec
w25 = wb["уирд 2025"]
colour_block(w25, 2025, 1, range(9, 13), "dhikr_morning", STATUS)
colour_block(w25, 2025, 6, range(9, 13), "dhikr_evening", STATUS)
colour_block(w25, 2025, 11, range(9, 13), "wird_taha", WIRD)
colour_block(w25, 2025, 11, range(9, 13), "wird_amana", WIRD)

# Khatm: "Сүре 137-140-бет", "483-бет", "Сүре/Сүре 261-264-бет"; orange "ayat" cells are partial pages -> skipped
PAGES = re.compile(r"(\d+)\s*(?:[-–—]\s*(\d+))?\s*[-–—]?\s*бет")
khatm = []
def khatm_sheet(name, year, months):
    ws = wb[name]
    for date, c in grid(ws, year, 1, months):
        f, v = fill(c), c.value
        # Any fill except red/orange with page text is a reading (dark green, yellow = new khatm start).
        if isinstance(v, str) and f not in (RED, ORANGE):
            found = PAGES.findall(v)
            if not found:
                problems.append(f"{name} {c.coordinate} {date}: no page range in {v!r}"); continue
            # "Әнфәл 181-бет 35-аят-182-бет" or "... (521-522-бет)": span of every page number mentioned
            nums = [int(x) for pair in found for x in pair if x]
            a, b = min(nums), max(nums)
            if b < a or b > 604:
                problems.append(f"{name} {c.coordinate} {date}: bad range {v!r}"); continue
            khatm.append({"date": date, "pages": b - a + 1, "from_page": a, "to_page": b, "src": v})
        elif f == GREEN and v is None:
            problems.append(f"{name} {c.coordinate} {date}: green but empty")
        elif isinstance(v, str):
            problems.append(f"{name} {c.coordinate} {date}: skipped {v!r} (colour {f})")
khatm_sheet("Жеке хатм 2025", 2025, range(1, 13))
khatm_sheet("Жеке хатм 2026", 2026, range(1, 12))

# Hifz: "Назиғат 5-рет"; only green days count (red text = planned, not done)
HIFZ = re.compile(r"^\s*(.+?)\s+(\d+)\s*-?\s*рет")
hifz = []
def hifz_sheet(name, year, first_col, months):
    ws = wb[name]
    for date, c in grid(ws, year, first_col, months):
        f, v = fill(c), c.value
        if isinstance(v, str):
            m = HIFZ.match(v)
            if not m:
                problems.append(f"{name} {c.coordinate}: unparsed {v!r}"); continue
            if f == GREEN:
                hifz.append({"date": date, "surah": m.group(1), "repetitions": int(m.group(2))})
            else:
                problems.append(f"{name} {c.coordinate} {date}: {v!r} not green ({f}) -> skipped")
hifz_sheet("Хифз 2025", 2025, 1, [12])
hifz_sheet("Хифз 2026", 2026, 1, range(1, 12))

out = {"days": [{"date": d, **v} for d, v in sorted(days.items())], "khatm": khatm, "hifz": hifz, "problems": problems}
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(f"days={len(out['days'])} khatm={len(khatm)} hifz={len(hifz)} problems={len(problems)}")
for p in problems: print("  -", p)
