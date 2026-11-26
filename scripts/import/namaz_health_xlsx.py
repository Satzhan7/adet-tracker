"""Parse Жәннәт бақшасы 2025/2026 (namaz, ораза), Креатин_Протеин and 2024 Quran (personal khatm)."""
import sys, json, re, calendar, openpyxl
from collections import defaultdict

src = sys.argv[1]
GREEN, RED, ORANGE, CYAN, BLUE, YELLOW = "FF00FF00", "FFFF0000", "FFFF9900", "FF00FFFF", "FF4A86E8", "FFFFFF00"
MONTHS = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"]
fill = lambda c: c.fill.fgColor.rgb if c.fill and c.fill.fill_type == "solid" else None
days = defaultdict(dict)
problems, notes = [], []

def put(date, field, value, where):
    old = days[date].get(field)
    if old and old != value:
        problems.append(f"{where} {date} {field}: {old!r} vs {value!r}")
    days[date][field] = value

FARD = {GREEN: "уақытында", CYAN: "мешітте", RED: "қаза", ORANGE: "өтелді"}
WITR = {GREEN: "уақытында", CYAN: "уақытында", RED: "қаза", ORANGE: "өтелді"}
NAFL = {GREEN: "оқылды", CYAN: "оқылды", ORANGE: "оқылды", RED: "оқылмады"}
COLS = {"Түнгі намаз": "tungi", "Таң": "tan", "Духа": "duha", "Бесін": "besin", "Аср": "asr", "Шам": "sham",
        "Құптан": "quptan", "Құптан+Үтір": "quptan"}
# Witr notes written next to the grid (the 2025-09.. sheets have no separate Үтір column).
WITR_EXCEPTIONS = {"2026-09-13": "қаза",      # 'үтір оқылмады' beside Құптан (green)
                   "2026-03-25": "өтелді"}    # Құптан cell green with text 'үтір'; month note: 2 үтір өтелді

WITR_MADE_UP_MONTHS = {"2026-04", "2026-05"}

def namaz_book(path, year):
    wb = openpyxl.load_workbook(path, data_only=True)
    for m, name in enumerate(MONTHS, 1):
        if name not in wb.sheetnames: continue
        ws = wb[name]
        header = {c.column: str(c.value).strip() for c in ws[1] if c.value}
        for col, title in header.items():
            if title in ("Истихара", "Оқылды", "Оқылмады", "Қазасы өтелді", "Мешітте"): continue
            field = COLS.get(title)
            if not field:
                problems.append(f"{year} {name}: unknown column {title!r}"); continue
            for d in range(1, calendar.monthrange(year, m)[1] + 1):
                c = ws.cell(row=d, column=col); f = fill(c); date = f"{year}-{m:02d}-{d:02d}"
                if f in (None, "00000000", "FFFFFFFF"): continue
                mapping = NAFL if field in ("tungi", "duha") else FARD
                if f not in mapping:
                    problems.append(f"{year} {name} {c.coordinate}: colour {f} on {title}"); continue
                put(date, field, mapping[f], f"{year} {name}")
                if field == "quptan":
                    w = WITR_EXCEPTIONS.get(date, WITR[f])
                    # Month notes: 2026-04 '5 үтір өтелді', 2026-05 '3 үтір өтелді' although Құптан stayed қаза.
                    if date[:7] in WITR_MADE_UP_MONTHS and w == "қаза": w = "өтелді"
                    put(date, "utir", w, f"{year} {name}")
        # month summary notes like '13 Таң' / '2 өтелді' kept for the cross-check below
        for row in ws.iter_rows(min_row=30):
            txt = [str(c.value).strip() for c in row[:3] if c.value]
            if txt: notes.append((f"{year}-{m:02d}", " | ".join(txt)))

def oraza(path, year):
    ws = openpyxl.load_workbook(path, data_only=True)["Ораза"]
    M = {GREEN: "ұстадым", CYAN: "қаза болды", BLUE: "қаза өтедім", YELLOW: "ұстамадым"}  # red (no fast) left blank
    for m in range(1, 13):
        for d in range(1, calendar.monthrange(year, m)[1] + 1):
            c = ws.cell(row=d, column=m); f = fill(c)
            if f in M: put(f"{year}-{m:02d}-{d:02d}", "oraza", M[f], f"{year} Ораза")
            elif f not in (None, RED, "00000000", "FFFFFFFF"): problems.append(f"Ораза {year} {c.coordinate}: colour {f}")

def creatine(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    CR = {GREEN: "5 г", CYAN: "6 капсула", YELLOW: "3 капсула", RED: "өткізілді"}
    PR = {GREEN: "іштім", RED: "жоқ"}
    ws = wb["Креатин 2026"]
    for m in range(1, 13):
        for d in range(1, calendar.monthrange(2026, m)[1] + 1):
            c = ws.cell(row=d, column=m); f = fill(c)
            if f in CR: put(f"2026-{m:02d}-{d:02d}", "creatine", CR[f], "Креатин 2026")
            elif f not in (None, "00000000", "FFFFFFFF"): problems.append(f"Креатин 2026 {c.coordinate}: colour {f}")
    ws = wb["Желтоқсан 2025"]
    for d in range(1, 32):
        a, b = fill(ws.cell(row=d, column=1)), fill(ws.cell(row=d, column=2))
        if a in CR: put(f"2025-12-{d:02d}", "creatine", CR[a], "Креатин 2025")
        if b in PR: put(f"2025-12-{d:02d}", "protein", PR[b], "Протеин 2025")

PAGES = re.compile(r"(\d+)\s*(?:[-–—]\s*(\d+))?\s*[-–—]?\s*бет")
khatm = []
def khatm_2024(path):
    ws = openpyxl.load_workbook(path, data_only=True)["Жеке хатм"]
    for m in range(1, 13):
        for d in range(1, calendar.monthrange(2024, m)[1] + 1):
            c = ws.cell(row=d, column=m); f, v = fill(c), c.value; date = f"2024-{m:02d}-{d:02d}"
            if isinstance(v, str) and f not in (RED, ORANGE):
                nums = [int(x) for pair in PAGES.findall(v) for x in pair if x]
                if not nums: problems.append(f"хатм 2024 {c.coordinate}: no pages in {v!r}"); continue
                a, b = min(nums), max(nums)
                khatm.append({"date": date, "pages": b - a + 1, "from_page": a, "to_page": b})
            elif isinstance(v, str):
                problems.append(f"хатм 2024 {c.coordinate} {date}: skipped {v!r} ({f})")

namaz_book(f"{src}/jb2025.xlsx", 2025); namaz_book(f"{src}/jb2026.xlsx", 2026)
oraza(f"{src}/jb2025.xlsx", 2025); oraza(f"{src}/jb2026.xlsx", 2026)
creatine(f"{src}/kp.xlsx"); khatm_2024(f"{src}/quran2024.xlsx")
json.dump({"days": [{"date": k, **v} for k, v in sorted(days.items())], "khatm": khatm, "problems": problems, "notes": notes},
          open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(f"days={len(days)} khatm2024={len(khatm)} problems={len(problems)}")
for p in problems: print("  -", p)
