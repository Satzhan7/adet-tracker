/** Shapes `days` rows into what the section pages render. Pure, so it is unit-tested with stats. */
import { dayLabel, lastDays, MONTHS_SHORT, monthKey, monthName, parts } from "./dates";
import { FIELDS, optionFor, type DayField, type DayRow } from "./fields";
import { byMonth, type Ratio } from "./stats";

export function indexByDate(days: DayRow[]) {
  return new Map(days.map((d) => [d.date, d]));
}

/** Last 30 days ending today, one row per field. */
export function gridFor(days: DayRow[], today: string, fields: DayField[]) {
  const dates = lastDays(today, 30);
  const idx = indexByDate(days);
  return {
    dayNumbers: dates.map((d) => String(parts(d).d)),
    rows: fields.map((f) => ({
      name: FIELDS[f].name,
      cells: dates.map((date) => {
        const o = optionFor(f, idx.get(date)?.[f]);
        return { tone: o?.tone ?? null, tip: `${dayLabel(date)}: ${o ? o.label.toLowerCase() : "белгіленбеген"}` };
      }),
    })),
  };
}

/** Rows of the current calendar year, grouped by month Jan..current. */
export function yearMonths(days: DayRow[], today: string) {
  const year = today.slice(0, 4);
  const months = byMonth(days.filter((d) => d.date.startsWith(year)));
  const count = parts(today).m;
  return Array.from({ length: count }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return { key, label: MONTHS_SHORT[i], rows: months.get(key) ?? [] };
  });
}

/** Percentage per month, null where nothing was marked. */
export function monthlyPct(days: DayRow[], today: string, measure: (rows: DayRow[]) => Ratio) {
  const months = yearMonths(days, today);
  return { labels: months.map((m) => m.label), values: months.map((m) => measure(m.rows).pct) };
}

export function rowsInMonth(days: DayRow[], today: string) {
  const key = monthKey(today);
  return days.filter((d) => monthKey(d.date) === key);
}

/** "Қараша · 1–24 күн" for the current month (up to today). */
export function monthHeading(today: string) {
  return `${monthName(monthKey(today))} · 1–${parts(today).d} күн`;
}

export function monthLabel(key: string) {
  return monthName(key);
}
