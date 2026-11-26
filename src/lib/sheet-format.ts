/**
 * The «Күнделік» sheet: one row per day, the same columns as Adet-tracker-shablon.xlsx
 * plus the two wird columns the app also stores. Used by export and import alike.
 */
import { FIELDS, type DayField } from "./fields";

export type Column =
  | { key: "date"; header: string; width: number }
  | { key: DayField; header: string; width: number }
  | { key: "hifz_surah" | "hifz_reps" | "khatm_from" | "khatm_to" | "khatm_pages" | "note"; header: string; width: number };

export const COLUMNS: Column[] = [
  { key: "date", header: "Күні", width: 12 },
  { key: "tan", header: "Таң", width: 11 },
  { key: "besin", header: "Бесін", width: 11 },
  { key: "asr", header: "Аср", width: 11 },
  { key: "sham", header: "Шам", width: 11 },
  { key: "quptan", header: "Құптан", width: 11 },
  { key: "utir", header: "Үтір", width: 11 },
  { key: "tungi", header: "Түнгі намаз", width: 12 },
  { key: "duha", header: "Духа", width: 10 },
  { key: "dhikr_morning", header: "Таңғы зікір", width: 12 },
  { key: "dhikr_evening", header: "Кешкі зікір", width: 12 },
  { key: "hifz_surah", header: "Хифз сүресі", width: 13 },
  { key: "hifz_reps", header: "Хифз, рет", width: 9 },
  { key: "khatm_from", header: "Хатм: басы, бет", width: 10 },
  { key: "khatm_to", header: "Хатм: соңы, бет", width: 10 },
  { key: "khatm_pages", header: "Хатм: бет саны", width: 10 },
  { key: "creatine", header: "Креатин", width: 11 },
  { key: "protein", header: "Протеин", width: 9 },
  { key: "oraza", header: "Ораза", width: 12 },
  { key: "note", header: "Жазба", width: 40 },
  { key: "wird_taha", header: "Уирд: Тоһа", width: 11 },
  { key: "wird_amana", header: "Уирд: Әмәнәр расул", width: 13 },
];

export type ColumnKey = Column["key"];

/** Header text → column, ignoring case, spaces and punctuation ("Хифз, рет" = "хифз рет"). */
const squash = (s: string) => s.toLocaleLowerCase("kk").replace(/[^\p{L}\p{N}]+/gu, "");
const HEADER_INDEX = new Map(COLUMNS.map((c) => [squash(c.header), c.key]));
// Older spellings seen in the source sheets.
for (const [alias, key] of [
  ["Күн", "date"],
  ["Дата", "date"],
  ["Хатм бет", "khatm_pages"],
  ["Тоһа", "wird_taha"],
  ["Әмәнәр расул", "wird_amana"],
] as const)
  HEADER_INDEX.set(squash(alias), key);

export function columnFor(header: unknown): ColumnKey | undefined {
  return typeof header === "string" ? HEADER_INDEX.get(squash(header)) : undefined;
}

/** Values people type that mean an allowed enum value. Keys are already lower-cased. */
const VALUE_ALIASES: Partial<Record<DayField, Record<string, string>>> = {
  utir: { мешітте: "уақытында", оқылды: "уақытында" },
  creatine: { "5 мг": "5 г", "5г": "5 г", "3 капсулы": "3 капсула", "6 капсулы": "6 капсула", пропуск: "өткізілді" },
};

/** Normalises a cell to the field's enum value, or returns null for empty and undefined for "not allowed". */
export function normaliseValue(field: DayField, raw: unknown): string | null | undefined {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().replace(/\s+/g, " ").toLocaleLowerCase("kk");
  if (!text) return null;
  const value = VALUE_ALIASES[field]?.[text] ?? text;
  return FIELDS[field].options.some((o) => o.value === value) ? value : undefined;
}

/** Excel day 25569 = 1970-01-01. */
const EXCEL_EPOCH_DAYS = 25569;

/** Reads a date cell (Date, Excel serial number, "2026-11-27", "27.11.2026") as YYYY-MM-DD, or null. */
export function parseDate(raw: unknown): string | null {
  const DAY = 86400000;
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    // Date-only cells are UTC midnight; round so a time-zone offset of up to ±12 h keeps the day.
    return new Date(Math.round(raw.getTime() / DAY) * DAY).toISOString().slice(0, 10);
  }
  if (typeof raw === "number" && raw > 20000 && raw < 80000) {
    return new Date(Math.round(raw - EXCEL_EPOCH_DAYS) * DAY).toISOString().slice(0, 10);
  }
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
  const dmy = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  const [y, m, d] = iso ? [+iso[1], +iso[2], +iso[3]] : dmy ? [+dmy[3], +dmy[2], +dmy[1]] : [0, 0, 0];
  if (!y) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  // Reject days that roll over (31.02 → 03.03).
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.toISOString().slice(0, 10);
}
