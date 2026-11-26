import { describe, expect, it } from "vitest";
import type { DayRow } from "./fields";
import { hifzByDate, khatmByDate, parseRows, planImport, toRows, type Existing } from "./import";
import { COLUMNS, normaliseValue, parseDate } from "./sheet-format";

const TODAY = "2026-11-27";
const H = COLUMNS.map((c) => c.header);
const row = (o: Record<string, unknown>) => H.map((h) => o[h] ?? null);
const empty = (): Existing => ({ days: new Map(), notes: new Map(), khatm: new Map(), hifz: new Map() });

describe("sheet format", () => {
  it("reads dates in every form the sheets use", () => {
    expect(parseDate(new Date(Date.UTC(2026, 10, 27)))).toBe("2026-11-27");
    expect(parseDate(new Date(Date.UTC(2026, 10, 26, 19)))).toBe("2026-11-27"); // local midnight UTC+5
    expect(parseDate(46353)).toBe("2026-11-27"); // Excel serial
    expect(parseDate("2026-11-27")).toBe("2026-11-27");
    expect(parseDate("2026-11-27 00:00:00")).toBe("2026-11-27");
    expect(parseDate("27.11.2026")).toBe("2026-11-27");
    expect(parseDate("31.02.2026")).toBeNull();
    expect(parseDate("кеше")).toBeNull();
  });
  it("normalises case, spaces and known aliases; rejects unknown values", () => {
    expect(normaliseValue("tan", "  Уақытында ")).toBe("уақытында");
    expect(normaliseValue("utir", "мешітте")).toBe("уақытында");
    expect(normaliseValue("creatine", "5 мг")).toBe("5 г");
    expect(normaliseValue("creatine", "пропуск")).toBe("өткізілді");
    expect(normaliseValue("tan", "")).toBeNull();
    expect(normaliseValue("tan", "ұмыттым")).toBeUndefined();
  });
});

describe("parseRows", () => {
  it("matches headers loosely and reads every column", () => {
    const rows = [
      ["КҮНІ", "таң", "Хифз сүресі", "хифз рет", "Хатм: басы, бет", "Хатм: соңы, бет", "Жазба", "Бөтен баған"],
      ["2026-11-20", "қаза", "Тәкуир", 5, 596, 597, "сапарда", "x"],
    ];
    const p = parseRows(rows, TODAY);
    expect(p.errors).toEqual([]);
    expect(p.ignoredColumns).toEqual(["Бөтен баған"]);
    expect(p.days[0]).toMatchObject({
      row: 2,
      date: "2026-11-20",
      values: { tan: "қаза" },
      note: "сапарда",
      hifz: { surah: "Тәкуир", repetitions: 5 },
      khatm: { pages: 2, from_page: 596, to_page: 597 },
    });
  });
  it("reports bad rows with their sheet row number and keeps the good ones", () => {
    const p = parseRows(
      [
        H,
        row({ Күні: "2026-11-01", Таң: "уақытында" }),
        row({ Күні: "2026-13-01", Таң: "уақытында" }),
        row({ Күні: "2026-12-01", Таң: "уақытында" }),
        row({ Күні: "2026-11-01", Аср: "қаза" }),
        row({ Күні: "2026-11-02", Шам: "кешіктім" }),
        row({ Күні: "2026-11-03", "Хатм: басы, бет": 10, "Хатм: соңы, бет": 12, "Хатм: бет саны": 5 }),
        row({ Күні: "2026-11-04", "Хифз сүресі": "Нәбә" }),
        [],
      ],
      TODAY,
    );
    expect(p.days.map((d) => d.date)).toEqual(["2026-11-01"]);
    expect(p.errors.map((e) => e.row)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(p.errors[1].reason).toContain("болашақ");
    expect(p.errors[2].reason).toContain("2-жолда бар");
  });
  it("needs a date column", () => {
    expect(parseRows([["Таң"], ["қаза"]], TODAY).missingDateColumn).toBe(true);
  });
});

describe("planImport", () => {
  const stored = (): Existing => {
    const e = empty();
    e.days.set("2026-11-01", { date: "2026-11-01", tan: "уақытында", asr: null } as DayRow);
    e.notes.set("2026-11-01", "ескі");
    e.khatm.set("2026-11-01", { pages: 1, from_page: 590, to_page: 590 });
    return e;
  };
  const parsed = parseRows(
    [H, row({ Күні: "2026-11-01", Таң: "қаза", Аср: "уақытында", Жазба: "жаңа", "Хатм: бет саны": 3 }), row({ Күні: "2026-11-02", Шам: "қаза" })],
    TODAY,
  ).days;

  it("fill: writes only empty fields, keeps stored values", () => {
    const p = planImport(parsed, stored(), "fill");
    expect(p.dayWrites).toEqual([
      { date: "2026-11-01", values: { asr: "уақытында" } },
      { date: "2026-11-02", values: { sham: "қаза" } },
    ]);
    expect(p.noteWrites).toEqual([]);
    expect(p.khatmWrites).toEqual([]);
    expect(p).toMatchObject({ newDays: 1, changedDays: 1, unchangedDays: 0, keptValues: 3 });
  });
  it("replace: file values overwrite, empty cells never clear", () => {
    const p = planImport(parsed, stored(), "replace");
    expect(p.dayWrites[0]).toEqual({ date: "2026-11-01", values: { tan: "қаза", asr: "уақытында" } });
    expect(p.noteWrites).toEqual([{ date: "2026-11-01", text: "жаңа" }]);
    expect(p.khatmWrites).toEqual([{ date: "2026-11-01", entry: { pages: 3, from_page: null, to_page: null } }]);
    expect(p.keptValues).toBe(0);
  });
});

describe("round trip (SPEC: export → import changes nothing)", () => {
  it("rows built from stored data plan zero writes in both modes", () => {
    const e = empty();
    e.days.set("2026-11-01", { date: "2026-11-01", tan: "мешітте", utir: "өтелді", creatine: "3 капсула", wird_taha: "ішінара" } as DayRow);
    e.days.set("2026-11-02", { date: "2026-11-02", oraza: "қаза өтедім" } as DayRow);
    e.notes.set("2026-11-02", "жазба, «тырнақша» және\nжаңа жол");
    e.khatm = khatmByDate([
      { date: "2026-11-01", pages: 2, from_page: 590, to_page: 591 },
      { date: "2026-11-01", pages: 1, from_page: 592, to_page: 592 },
    ]);
    e.hifz = hifzByDate([{ date: "2026-11-02", surah: "Тәкуир", repetitions: 5 }]);
    const rows = toRows(["2026-11-01", "2026-11-02", "2026-11-03"], e.days, e.notes, e.khatm, e.hifz);
    const parsed = parseRows(rows, TODAY);
    expect(parsed.errors).toEqual([]);
    for (const mode of ["fill", "replace"] as const) {
      const p = planImport(parsed.days, e, mode);
      expect([p.dayWrites, p.noteWrites, p.khatmWrites, p.hifzWrites]).toEqual([[], [], [], []]);
    }
  });
});

describe("csv", async () => {
  const { parseCsv, toCsv } = await import("./csv");
  it("round-trips quotes, commas, semicolons and new lines", () => {
    const rows = [["Күні", "Жазба"], ["2026-11-01", 'бір, екі; "үш"\nтөрт'], ["2026-11-02", null]];
    const text = toCsv(rows);
    expect(text.startsWith("﻿")).toBe(true);
    expect(parseCsv(text)).toEqual([["Күні", "Жазба"], ["2026-11-01", 'бір, екі; "үш"\nтөрт'], ["2026-11-02", ""]]);
  });
  it("reads semicolon-separated files from Excel", () => {
    expect(parseCsv("Күні;Таң\r\n27.11.2026;қаза\r\n")).toEqual([["Күні", "Таң"], ["27.11.2026", "қаза"]]);
  });
});
