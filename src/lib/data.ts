import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { FIELDS, type DayRow } from "@/lib/fields";

const DAY_COLUMNS = ["date", ...Object.keys(FIELDS)].join(", ");

/** PostgREST caps a response at 1000 rows by default; read in pages so long histories are never cut off. */
const PAGE = 1000;
type Page = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
async function readAll<T>(query: (from: number, to: number) => Page, what: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(`${what}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

export type KhatmEntry = { id: number; date: string; pages: number; from_page: number | null; to_page: number | null };
export type HifzEntry = { id: number; date: string | null; surah: string; repetitions: number };

/**
 * All of the user's day rows (one per day; a few thousand at most), oldest first. RLS scopes them to the user.
 * Cached per request: the nav badge and the page share one query.
 */
export const loadDays = cache(async function loadDays(): Promise<{ today: string; days: DayRow[] }> {
  const supabase = await createClient();
  const days = await readAll<DayRow>(
    (from, to) => supabase.from("days").select(DAY_COLUMNS).order("date").range(from, to),
    "days",
  );
  return { today: todayISO(), days };
});

export const loadQuranLogs = cache(async function loadQuranLogs(): Promise<{ khatm: KhatmEntry[]; hifz: HifzEntry[] }> {
  const supabase = await createClient();
  const [khatm, hifz] = await Promise.all([
    readAll<KhatmEntry>(
      (from, to) => supabase.from("khatm_log").select("id, date, pages, from_page, to_page").order("date").order("id").range(from, to),
      "khatm_log",
    ),
    readAll<HifzEntry>((from, to) => supabase.from("hifz_log").select("id, date, surah, repetitions").order("id").range(from, to), "hifz_log"),
  ]);
  return { khatm, hifz };
});
