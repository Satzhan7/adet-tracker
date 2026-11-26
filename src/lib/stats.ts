/**
 * SPEC «Есептеу ережелері», computed from `days` rows.
 * Only marked cells count (rule 6): a blank (null) never lowers a percentage.
 */
import { addDays, monthKey } from "./dates";
import { FARD_FIELDS, type DayField, type DayRow } from "./fields";

export type Ratio = { n: number; d: number; pct: number | null };

export function ratio(n: number, d: number): Ratio {
  return { n, d, pct: d === 0 ? null : (n / d) * 100 };
}

/** "71.67%" — two decimals (SPEC); "—" when nothing is marked. */
export function fmtPct(r: Ratio | number | null): string {
  const v = typeof r === "number" || r === null ? r : r.pct;
  return v === null ? "—" : `${v.toFixed(2)}%`;
}

export function count(rows: DayRow[], field: DayField, values: string | string[]): number {
  const set = new Set(Array.isArray(values) ? values : [values]);
  return rows.reduce((n, r) => (r[field] && set.has(r[field]!) ? n + 1 : n), 0);
}

export function marked(rows: DayRow[], field: DayField): number {
  return rows.reduce((n, r) => (r[field] ? n + 1 : n), 0);
}

/** Share of marked cells holding one of `values` (rules 4–6). */
export function share(rows: DayRow[], field: DayField, values: string | string[]): Ratio {
  return ratio(count(rows, field, values), marked(rows, field));
}

/** Rule 1: fard on time = (уақытында + мешітте) ÷ marked fard cells; мешітте counts as on time. */
export function fardOnTime(rows: DayRow[], fields: readonly DayField[] = FARD_FIELDS): Ratio {
  let n = 0;
  let d = 0;
  for (const r of rows)
    for (const f of fields) {
      const v = r[f];
      if (!v) continue;
      d++;
      if (v === "уақытында" || v === "мешітте") n++;
    }
  return ratio(n, d);
}

/** Rules 2–3 for one prayer: missed = қаза + өтелді; still owed = қаза − өтелді (never below 0). */
export function qaza(rows: DayRow[], field: DayField) {
  const open = count(rows, field, "қаза");
  const madeUp = count(rows, field, "өтелді");
  return { missed: open + madeUp, madeUp, owed: Math.max(0, open - madeUp) };
}

/** Rule 3: remaining qaza across the five fard prayers and witr. */
export function remainingQaza(rows: DayRow[]): number {
  return [...FARD_FIELDS, "utir" as const].reduce((sum, f) => sum + qaza(rows, f).owed, 0);
}

/** Rule 7: longest run of consecutive dates holding `value`; a blank, a missing day or another value breaks it. */
export function longestStreak(rows: DayRow[], field: DayField, value: string) {
  const hits = new Set(rows.filter((r) => r[field] === value).map((r) => r.date));
  let best = { length: 0, end: null as string | null };
  for (const date of [...hits].sort()) {
    if (hits.has(addDays(date, -1))) continue; // not a run start
    let len = 1;
    let end = date;
    while (hits.has(addDays(end, 1))) {
      end = addDays(end, 1);
      len++;
    }
    if (len > best.length) best = { length: len, end };
  }
  return best;
}

export function lastDateWith(rows: DayRow[], field: DayField, value: string): string | null {
  let last: string | null = null;
  for (const r of rows) if (r[field] === value && (!last || r.date > last)) last = r.date;
  return last;
}

export function byMonth(rows: DayRow[]): Map<string, DayRow[]> {
  const m = new Map<string, DayRow[]>();
  for (const r of rows) {
    const k = monthKey(r.date);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
}

/** Rule 8: best and worst month by `measure`, among months with at least `minDays` marked days. */
export function bestWorstMonth(
  rows: DayRow[],
  measure: (monthRows: DayRow[]) => Ratio,
  isMarked: (r: DayRow) => boolean,
  minDays = 10,
) {
  const eligible = [...byMonth(rows)]
    .map(([key, list]) => ({ key, days: list.filter(isMarked).length, r: measure(list) }))
    .filter((m) => m.days >= minDays && m.r.pct !== null);
  if (eligible.length === 0) return null;
  const sorted = [...eligible].sort((a, b) => a.r.pct! - b.r.pct! || a.key.localeCompare(b.key));
  return { best: sorted[sorted.length - 1], worst: sorted[0] };
}

/** Rule 9: khatm progress = pages read ÷ 604. */
export const MUSHAF_PAGES = 604;
export function khatmProgress(pages: number): Ratio {
  return ratio(Math.min(pages, MUSHAF_PAGES), MUSHAF_PAGES);
}
