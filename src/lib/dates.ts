/** Dates are plain ISO strings (YYYY-MM-DD) in the user's time zone; no Date objects cross the server/client line. */

export const APP_TZ = "Asia/Almaty";

export const MONTHS = [
  "Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым",
  "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан",
];
export const MONTHS_SHORT = ["Қаң", "Ақп", "Нау", "Сәу", "Мам", "Мау", "Шіл", "Там", "Қыр", "Қаз", "Қар", "Жел"];

/** Today in APP_TZ. Call only after request-time data access (Cache Components). */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ }).format(now);
}

export function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** "26 қараша" */
export function dayLabel(iso: string) {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1].toLowerCase()}`;
}

export function addDays(iso: string, n: number): string {
  const { y, m, d } = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Inclusive list of ISO dates ending at `end`. */
export function lastDays(end: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
}

/** "2026-11" */
export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function monthName(key: string) {
  return MONTHS[Number(key.slice(5, 7)) - 1];
}

export function startOfMonth(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function startOfYear(iso: string) {
  return `${iso.slice(0, 4)}-01-01`;
}

/** "2026-10" for any date in November 2026; wraps the year in January. */
export function prevMonthKey(iso: string) {
  const { y, m } = parts(iso);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}
