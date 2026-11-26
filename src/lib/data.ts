import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { FIELDS, type DayRow } from "@/lib/fields";

const DAY_COLUMNS = ["date", ...Object.keys(FIELDS)].join(", ");

export type KhatmEntry = { id: number; date: string; pages: number; from_page: number | null; to_page: number | null };
export type HifzEntry = { id: number; date: string | null; surah: string; repetitions: number };

/** All of the user's day rows (one per day; a few thousand at most), oldest first. RLS scopes them to the user. */
export async function loadDays(): Promise<{ today: string; days: DayRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("days").select(DAY_COLUMNS).order("date");
  if (error) throw new Error(`days: ${error.message}`);
  return { today: todayISO(), days: (data ?? []) as unknown as DayRow[] };
}

export async function loadQuranLogs(): Promise<{ khatm: KhatmEntry[]; hifz: HifzEntry[] }> {
  const supabase = await createClient();
  const [k, h] = await Promise.all([
    supabase.from("khatm_log").select("id, date, pages, from_page, to_page").order("date").order("id"),
    supabase.from("hifz_log").select("id, date, surah, repetitions").order("id"),
  ]);
  if (k.error) throw new Error(`khatm_log: ${k.error.message}`);
  if (h.error) throw new Error(`hifz_log: ${h.error.message}`);
  return { khatm: k.data ?? [], hifz: h.data ?? [] };
}
