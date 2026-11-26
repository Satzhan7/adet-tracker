import { describe, expect, it } from "vitest";
import { addDays, dayLabel, lastDays, prevMonthKey, todayISO } from "./dates";
import type { DayRow } from "./fields";
import {
  bestWorstMonth,
  fardOnTime,
  fmtPct,
  khatmProgress,
  lastDateWith,
  longestStreak,
  qaza,
  remainingQaza,
  share,
} from "./stats";

const day = (date: string, v: Partial<DayRow> = {}): DayRow => ({ date, ...v });

describe("fardOnTime (rule 1)", () => {
  it("counts мешітте as on time and ignores blanks", () => {
    const rows = [
      day("2026-11-01", { tan: "уақытында", besin: "мешітте", asr: "қаза", sham: null }),
      day("2026-11-02", { tan: "өтелді" }),
    ];
    expect(fardOnTime(rows)).toMatchObject({ n: 2, d: 4, pct: 50 });
  });

  it("SPEC check: Nov 2026 with Таң 13, Бесін 2, Құптан 19 missed → 86 / 120 = 71.67%", () => {
    const rows = Array.from({ length: 24 }, (_, i) =>
      day(addDays("2026-11-01", i), {
        tan: i < 11 ? "уақытында" : "қаза",
        besin: i < 22 ? "уақытында" : "қаза",
        asr: "уақытында",
        sham: "уақытында",
        quptan: i < 5 ? "уақытында" : "қаза",
      }),
    );
    const r = fardOnTime(rows);
    expect([r.n, r.d]).toEqual([86, 120]);
    expect(fmtPct(r)).toBe("71.67%");
  });

  it("returns null pct when nothing is marked (rule 6)", () => {
    expect(fardOnTime([day("2026-11-01")]).pct).toBeNull();
    expect(fmtPct(fardOnTime([]))).toBe("—");
  });
});

describe("qaza (rules 2–3)", () => {
  const rows = [
    day("2026-11-01", { tan: "қаза", quptan: "қаза", utir: "қаза" }),
    day("2026-11-02", { tan: "қаза", quptan: "өтелді" }),
    day("2026-11-03", { tan: "өтелді" }),
  ];
  it("missed = қаза + өтелді", () => {
    expect(qaza(rows, "tan")).toEqual({ missed: 3, madeUp: 1, owed: 1 });
  });
  it("remaining = Σ(қаза − өтелді) over fard + witr", () => {
    // tan 2−1, quptan 1−1, utir 1−0
    expect(remainingQaza(rows)).toBe(2);
  });
});

describe("share (rules 4–6)", () => {
  it("ішінара is not done but is still a marked day", () => {
    const rows = [
      day("2026-11-01", { dhikr_morning: "орындалды" }),
      day("2026-11-02", { dhikr_morning: "ішінара" }),
      day("2026-11-03", { dhikr_morning: "жоқ" }),
      day("2026-11-04"),
    ];
    expect(share(rows, "dhikr_morning", "орындалды")).toMatchObject({ n: 1, d: 3 });
  });
});

describe("longestStreak (rule 7)", () => {
  it("blank day, missing day or another value breaks the run", () => {
    const rows = [
      day("2026-06-01", { dhikr_morning: "орындалды" }),
      day("2026-06-02", { dhikr_morning: "орындалды" }),
      day("2026-06-03", { dhikr_morning: "ішінара" }),
      day("2026-06-04", { dhikr_morning: "орындалды" }),
      day("2026-06-05", { dhikr_morning: "орындалды" }),
      day("2026-06-06", { dhikr_morning: "орындалды" }),
      // 06-07 missing
      day("2026-06-08", { dhikr_morning: "орындалды" }),
    ];
    expect(longestStreak(rows, "dhikr_morning", "орындалды")).toEqual({ length: 3, end: "2026-06-06" });
  });
  it("crosses month boundaries", () => {
    const rows = ["2026-06-29", "2026-06-30", "2026-07-01"].map((d) => day(d, { dhikr_morning: "орындалды" }));
    expect(longestStreak(rows, "dhikr_morning", "орындалды")).toEqual({ length: 3, end: "2026-07-01" });
  });
  it("is zero with no hits", () => {
    expect(longestStreak([], "dhikr_morning", "орындалды")).toEqual({ length: 0, end: null });
  });
});

describe("bestWorstMonth (rule 8)", () => {
  const month = (prefix: string, onTime: number, total: number) =>
    Array.from({ length: total }, (_, i) =>
      day(`${prefix}-${String(i + 1).padStart(2, "0")}`, { tan: i < onTime ? "уақытында" : "қаза" }),
    );
  it("skips months with fewer than 10 marked days", () => {
    const rows = [...month("2026-01", 10, 10), ...month("2026-02", 5, 10), ...month("2026-03", 0, 9)];
    const bw = bestWorstMonth(rows, (r) => fardOnTime(r), (r) => !!r.tan)!;
    expect(bw.best.key).toBe("2026-01");
    expect(bw.worst.key).toBe("2026-02");
  });
  it("is null when no month qualifies", () => {
    expect(bestWorstMonth(month("2026-01", 3, 5), (r) => fardOnTime(r), (r) => !!r.tan)).toBeNull();
  });
});

describe("khatm (rule 9) and helpers", () => {
  it("595 / 604 → 98.51%", () => {
    expect(fmtPct(khatmProgress(595))).toBe("98.51%");
  });
  it("lastDateWith picks the latest matching day", () => {
    const rows = [day("2026-08-15", { dhikr_evening: "орындалды" }), day("2026-11-01", { dhikr_evening: "жоқ" })];
    expect(lastDateWith(rows, "dhikr_evening", "орындалды")).toBe("2026-08-15");
  });
  it("dates are in Asia/Almaty and label in Kazakh", () => {
    // 2026-11-26 20:30 UTC is already 27 Nov in Almaty (UTC+5)
    expect(todayISO(new Date("2026-11-26T20:30:00Z"))).toBe("2026-11-27");
    expect(dayLabel("2026-11-26")).toBe("26 қараша");
    expect(dayLabel("2025-12-24", "2026-11-26")).toBe("24 желтоқсан 2025");
    expect(dayLabel("2026-06-29", "2026-11-26")).toBe("29 маусым");
    expect(lastDays("2026-03-02", 3)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
    expect(prevMonthKey("2026-11-26")).toBe("2026-10");
    expect(prevMonthKey("2027-01-05")).toBe("2026-12");
  });
});

describe("quran measures", async () => {
  const { wirdDays, hifzPath, currentPage } = await import("./quran");
  it("wird day is done only when every marked part is оқыдым", () => {
    const rows = [
      day("2026-11-01", { wird_taha: "оқыдым", wird_amana: "оқыдым" }),
      day("2026-11-02", { wird_taha: "оқыдым", wird_amana: "ішінара" }),
      day("2026-11-03", { wird_taha: "оқыдым" }),
      day("2026-11-04"),
    ];
    expect(wirdDays(rows)).toMatchObject({ n: 2, d: 3, partial: 1 });
  });
  it("hifz path keeps first-seen order and counts days", () => {
    const log = ["Назиғат", "Назиғат", "Абәсә", "Тәкуир", "Тәкуир"].map((surah, id) => ({ id, date: null, surah, repetitions: 5 }));
    expect(hifzPath(log)).toEqual([
      { surah: "Назиғат", days: 2 },
      { surah: "Абәсә", days: 1 },
      { surah: "Тәкуир", days: 2 },
    ]);
  });
  it("current khatm page is the latest to_page", () => {
    const log = [
      { id: 1, date: "2026-01-01", pages: 5, from_page: 137, to_page: 141 },
      { id: 2, date: "2026-01-02", pages: 3, from_page: null, to_page: null },
    ];
    expect(currentPage(log)).toBe(141);
  });
});

describe("phase A helpers", async () => {
  const { CREATINE_DONE } = await import("./stats");
  const { latestYearWith, marksFor } = await import("./views");
  it("creatine streak counts any full dose (rule 5) and breaks on a skip", () => {
    const rows = [
      day("2026-03-01", { creatine: "5 г" }),
      day("2026-03-02", { creatine: "3 капсула" }),
      day("2026-03-03", { creatine: "6 капсула" }),
      day("2026-03-04", { creatine: "өткізілді" }),
      day("2026-03-05", { creatine: "5 г" }),
    ];
    expect(longestStreak(rows, "creatine", CREATINE_DONE)).toEqual({ length: 3, end: "2026-03-03" });
    expect(share(rows, "creatine", CREATINE_DONE)).toMatchObject({ n: 4, d: 5 });
  });
  it("latestYearWith falls back to the current year", () => {
    const rows = [day("2025-10-01", { wird_taha: "оқыдым" }), day("2026-02-01", { tan: "қаза" })];
    expect(latestYearWith(rows, "2026-11-27", (r) => !!r.wird_taha)).toBe("2025");
    expect(latestYearWith(rows, "2026-11-27", (r) => !!r.oraza)).toBe("2026");
  });
  it("marksFor keeps only marked fields and drops empty days", () => {
    const rows = [day("2026-11-01", { tan: "қаза", creatine: null }), day("2026-11-02", { asr: "уақытында" })];
    expect(marksFor(rows, ["tan", "creatine"])).toEqual({ "2026-11-01": { tan: "қаза" } });
  });
});
