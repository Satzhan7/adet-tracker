/** Quran-specific measures: wird days, khatm pages, hifz path. Pure. */
import type { DayRow } from "./fields";
import type { HifzEntry, KhatmEntry } from "./data";
import { ratio, type Ratio } from "./stats";

const WIRD = ["wird_taha", "wird_amana"] as const;

/** A wird day is marked if either part is marked; done when every marked part is "оқыдым". */
export function wirdDays(rows: DayRow[]): Ratio & { partial: number } {
  let n = 0;
  let d = 0;
  let partial = 0;
  for (const r of rows) {
    const vals = WIRD.map((f) => r[f]).filter(Boolean);
    if (vals.length === 0) continue;
    d++;
    if (vals.every((v) => v === "оқыдым")) n++;
    else if (vals.some((v) => v === "ішінара")) partial++;
  }
  return { ...ratio(n, d), partial };
}

export function isWirdMarked(r: DayRow) {
  return WIRD.some((f) => !!r[f]);
}

export function pagesBetween(log: KhatmEntry[], from: string, to: string) {
  return log.filter((e) => e.date >= from && e.date <= to).reduce((s, e) => s + e.pages, 0);
}

/** Where the reader is now: the latest logged to_page, else null. */
export function currentPage(log: KhatmEntry[]): number | null {
  for (let i = log.length - 1; i >= 0; i--) if (log[i].to_page) return log[i].to_page;
  return null;
}

/** Surahs in the order first started, with how many entries (days) each took. Last one is "current". */
export function hifzPath(log: HifzEntry[]) {
  const order: string[] = [];
  const days = new Map<string, number>();
  for (const e of log) {
    if (!days.has(e.surah)) order.push(e.surah);
    days.set(e.surah, (days.get(e.surah) ?? 0) + 1);
  }
  return order.map((surah) => ({ surah, days: days.get(surah)! }));
}
