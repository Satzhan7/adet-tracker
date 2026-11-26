/**
 * Import planning, kept pure so it can be tested and previewed before anything is written.
 * parseRows: sheet cells → validated days (+ errors with the sheet row number).
 * planImport: parsed days + what is already stored → counts for the preview and the exact writes.
 */
import { COLUMNS, columnFor, normaliseValue, parseDate, type ColumnKey } from "./sheet-format";
import { FIELDS, type DayField, type DayRow } from "./fields";
import { MUSHAF_PAGES } from "./stats";

export type Khatm = { pages: number; from_page: number | null; to_page: number | null };
export type Hifz = { surah: string; repetitions: number };
export type ParsedDay = { row: number; date: string; values: Partial<Record<DayField, string>>; note?: string; khatm?: Khatm; hifz?: Hifz };
export type RowError = { row: number; reason: string };
export type Parsed = { days: ParsedDay[]; errors: RowError[]; ignoredColumns: string[]; missingDateColumn: boolean };

const DAY_FIELDS = Object.keys(FIELDS) as DayField[];
const intIn = (v: unknown, min: number, max: number) => {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).trim());
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

/** `rows[0]` is the header row; sheet row numbers start at 1, so data row i is row i + 1. */
export function parseRows(rows: unknown[][], today: string): Parsed {
  const header = rows[0] ?? [];
  const keys: (ColumnKey | undefined)[] = header.map(columnFor);
  const ignoredColumns = header.filter((h, i) => h !== null && h !== undefined && String(h).trim() && !keys[i]).map(String);
  const at = (cells: unknown[], key: ColumnKey) => {
    const i = keys.indexOf(key);
    return i < 0 ? undefined : cells[i];
  };
  const errors: RowError[] = [];
  const days: ParsedDay[] = [];
  const seen = new Map<string, number>();
  if (!keys.includes("date")) return { days, errors, ignoredColumns, missingDateColumn: true };

  rows.slice(1).forEach((cells, i) => {
    const row = i + 2;
    const blank = cells.every((c) => c === null || c === undefined || String(c).trim() === "");
    if (blank) return;
    const date = parseDate(at(cells, "date"));
    if (!date) return errors.push({ row, reason: `Күн танылмады: «${String(at(cells, "date") ?? "")}»` });
    if (date > today) return errors.push({ row, reason: `${date} — болашақ күн` });
    if (seen.has(date)) return errors.push({ row, reason: `${date} күні ${seen.get(date)}-жолда бар` });

    const day: ParsedDay = { row, date, values: {} };
    const problems: string[] = [];
    for (const f of DAY_FIELDS) {
      const raw = at(cells, f);
      const v = normaliseValue(f, raw);
      if (v === undefined) problems.push(`${FIELDS[f].name}: «${String(raw).trim()}» тізімде жоқ`);
      else if (v) day.values[f] = v;
    }

    const note = at(cells, "note");
    if (note !== null && note !== undefined && String(note).trim()) day.note = String(note).trim().slice(0, 2000);

    const from = intIn(at(cells, "khatm_from"), 1, MUSHAF_PAGES);
    const to = intIn(at(cells, "khatm_to"), 1, MUSHAF_PAGES);
    const pages = intIn(at(cells, "khatm_pages"), 1, MUSHAF_PAGES);
    if (from === undefined || to === undefined || pages === undefined) problems.push("Хатм: бет 1–604 аралығындағы бүтін сан болсын");
    else if (from !== null && to !== null) {
      if (to < from) problems.push(`Хатм: соңы (${to}) басынан (${from}) кіші`);
      else if (pages !== null && pages !== to - from + 1) problems.push(`Хатм: бет саны ${pages}, ал ${from}–${to} = ${to - from + 1}`);
      else day.khatm = { pages: to - from + 1, from_page: from, to_page: to };
    } else if (pages !== null) {
      const end = from !== null ? from + pages - 1 : null;
      if (end !== null && end > MUSHAF_PAGES) problems.push(`Хатм: ${from}-беттен ${pages} бет 604-тен асады`);
      else day.khatm = { pages, from_page: from, to_page: end };
    }

    const surahRaw = at(cells, "hifz_surah");
    const surah = surahRaw === null || surahRaw === undefined ? "" : String(surahRaw).trim();
    const reps = intIn(at(cells, "hifz_reps"), 0, 100);
    if (reps === undefined) problems.push("Хифз: рет 0–100 аралығындағы бүтін сан болсын");
    else if (surah && reps === null) problems.push("Хифз: неше рет екені жазылмаған");
    else if (!surah && reps !== null) problems.push("Хифз: сүре жазылмаған");
    else if (surah) day.hifz = { surah: surah.slice(0, 60), repetitions: reps! };

    if (problems.length) return errors.push({ row, reason: problems.join("; ") });
    seen.set(date, row);
    days.push(day);
  });
  return { days, errors, ignoredColumns, missingDateColumn: false };
}

export type Existing = {
  days: Map<string, DayRow>;
  notes: Map<string, string>;
  khatm: Map<string, Khatm>; // per date: summed pages, min from, max to
  hifz: Map<string, Hifz>; // per date: first surah, summed repetitions
};
export type Mode = "fill" | "replace";
export type Plan = {
  newDays: number;
  changedDays: number;
  unchangedDays: number;
  keptValues: number; // values that differ but stay as stored («fill» mode)
  dayWrites: { date: string; values: Partial<Record<DayField, string>> }[];
  noteWrites: { date: string; text: string }[];
  khatmWrites: { date: string; entry: Khatm }[];
  hifzWrites: { date: string; entry: Hifz }[];
};

/**
 * «fill»: only empty fields are written; stored values win.
 * «replace»: every value in the file overwrites what is stored. Empty cells never clear data.
 * Khatm / hifz per day: «fill» adds only when the day has none; «replace» swaps the day's entries.
 */
export function planImport(days: ParsedDay[], existing: Existing, mode: Mode): Plan {
  const plan: Plan = { newDays: 0, changedDays: 0, unchangedDays: 0, keptValues: 0, dayWrites: [], noteWrites: [], khatmWrites: [], hifzWrites: [] };
  for (const d of days) {
    const stored = existing.days.get(d.date);
    const write: Partial<Record<DayField, string>> = {};
    for (const [f, v] of Object.entries(d.values) as [DayField, string][]) {
      const cur = stored?.[f] ?? null;
      if (cur === v) continue;
      if (cur && mode === "fill") plan.keptValues++;
      else write[f] = v;
    }
    let changed = Object.keys(write).length > 0;
    if (changed) plan.dayWrites.push({ date: d.date, values: write });

    const curNote = existing.notes.get(d.date);
    if (d.note && d.note !== curNote) {
      if (curNote && mode === "fill") plan.keptValues++;
      else {
        plan.noteWrites.push({ date: d.date, text: d.note });
        changed = true;
      }
    }
    const curK = existing.khatm.get(d.date);
    if (d.khatm && !sameKhatm(curK, d.khatm)) {
      if (curK && mode === "fill") plan.keptValues++;
      else {
        plan.khatmWrites.push({ date: d.date, entry: d.khatm });
        changed = true;
      }
    }
    const curH = existing.hifz.get(d.date);
    if (d.hifz && !(curH && curH.surah === d.hifz.surah && curH.repetitions === d.hifz.repetitions)) {
      if (curH && mode === "fill") plan.keptValues++;
      else {
        plan.hifzWrites.push({ date: d.date, entry: d.hifz });
        changed = true;
      }
    }

    const hadAnything = !!stored && DAY_FIELDS.some((f) => stored[f]) || existing.notes.has(d.date) || existing.khatm.has(d.date) || existing.hifz.has(d.date);
    if (!changed) plan.unchangedDays++;
    else if (hadAnything) plan.changedDays++;
    else plan.newDays++;
  }
  return plan;
}

function sameKhatm(a: Khatm | undefined, b: Khatm) {
  return !!a && a.pages === b.pages && a.from_page === b.from_page && a.to_page === b.to_page;
}

/** Collapses log entries to one per date, the way the sheet shows them. */
export function khatmByDate(entries: { date: string; pages: number; from_page: number | null; to_page: number | null }[]) {
  const out = new Map<string, Khatm>();
  for (const e of entries) {
    const cur = out.get(e.date);
    if (!cur) out.set(e.date, { pages: e.pages, from_page: e.from_page, to_page: e.to_page });
    else
      out.set(e.date, {
        pages: cur.pages + e.pages,
        from_page: cur.from_page === null || e.from_page === null ? (cur.from_page ?? e.from_page) : Math.min(cur.from_page, e.from_page),
        to_page: cur.to_page === null || e.to_page === null ? (cur.to_page ?? e.to_page) : Math.max(cur.to_page, e.to_page),
      });
  }
  return out;
}

export function hifzByDate(entries: { date: string | null; surah: string; repetitions: number }[]) {
  const out = new Map<string, Hifz>();
  for (const e of entries) {
    if (!e.date) continue;
    const cur = out.get(e.date);
    out.set(e.date, cur ? { surah: cur.surah, repetitions: cur.repetitions + e.repetitions } : { surah: e.surah, repetitions: e.repetitions });
  }
  return out;
}

/** Sheet rows (header + one row per date) from stored data, in COLUMNS order. */
export function toRows(
  dates: string[],
  days: Map<string, DayRow>,
  notes: Map<string, string>,
  khatm: Map<string, Khatm>,
  hifz: Map<string, Hifz>,
): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [COLUMNS.map((c) => c.header)];
  for (const date of dates) {
    const d = days.get(date);
    const k = khatm.get(date);
    const h = hifz.get(date);
    rows.push(
      COLUMNS.map((c) => {
        switch (c.key) {
          case "date": return date;
          case "note": return notes.get(date) ?? null;
          case "khatm_from": return k?.from_page ?? null;
          case "khatm_to": return k?.to_page ?? null;
          case "khatm_pages": return k?.pages ?? null;
          case "hifz_surah": return h?.surah ?? null;
          case "hifz_reps": return h?.repetitions ?? null;
          default: return d?.[c.key] ?? null;
        }
      }),
    );
  }
  return rows;
}
