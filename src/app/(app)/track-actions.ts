"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FIELDS, isDayField } from "@/lib/fields";
import { MUSHAF_PAGES } from "@/lib/stats";
import { todayISO } from "@/lib/dates";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const FAIL: ActionResult = { ok: false, error: "Сақталмады. Қайта көріңіз." };

/** A real calendar day, not in the future (user's time zone). */
function validDate(date: string) {
  if (!ISO_DATE.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCMonth() === m - 1 && date <= todayISO();
}

/** Sets (or clears, with null) one mark for one day. Field and value are checked against FIELDS. */
export async function setDayStatus(date: string, field: string, value: string | null): Promise<ActionResult> {
  if (!validDate(date) || !isDayField(field)) return FAIL;
  if (value !== null && !FIELDS[field].options.some((o) => o.value === value)) return FAIL;

  const supabase = await createClient();
  const { error } = await supabase.from("days").upsert({ date, [field]: value }, { onConflict: "user_id,date" });
  if (error) return FAIL;
  refresh();
  return { ok: true };
}

export async function addKhatm(date: string, pages: number, fromPage?: number | null): Promise<ActionResult> {
  if (!validDate(date) || !Number.isInteger(pages) || pages < 1 || pages > MUSHAF_PAGES) return FAIL;
  const from = fromPage && Number.isInteger(fromPage) && fromPage >= 1 && fromPage <= MUSHAF_PAGES ? fromPage : null;
  const to = from ? Math.min(MUSHAF_PAGES, from + pages - 1) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("khatm_log").insert({ date, pages, from_page: from, to_page: to });
  if (error) return FAIL;
  refresh();
  return { ok: true };
}

export async function addHifz(date: string, surah: string, repetitions: number): Promise<ActionResult> {
  const name = surah.trim();
  if (!validDate(date) || !name || name.length > 60) return FAIL;
  if (!Number.isInteger(repetitions) || repetitions < 0 || repetitions > 100) return FAIL;

  const supabase = await createClient();
  const { error } = await supabase.from("hifz_log").insert({ date, surah: name, repetitions });
  if (error) return FAIL;
  refresh();
  return { ok: true };
}

/** Removes a log entry the user added by mistake. RLS limits it to their own rows. */
export async function deleteLogEntry(table: "khatm_log" | "hifz_log", id: number): Promise<ActionResult> {
  if ((table !== "khatm_log" && table !== "hifz_log") || !Number.isInteger(id)) return FAIL;
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return FAIL;
  refresh();
  return { ok: true };
}

export type DaySnapshot = {
  values: Partial<Record<string, string | null>>;
  khatmPages: number;
  nextPage: number | null;
  hifzToday: { surah: string; repetitions: number }[];
  currentSurah: string | null;
};

/** Everything the quick-entry dialog shows for one day. RLS scopes every query to the user. */
export async function getDaySnapshot(date: string): Promise<DaySnapshot | null> {
  if (!validDate(date)) return null;
  const supabase = await createClient();
  const [day, khatm, lastPage, hifz, lastHifz] = await Promise.all([
    supabase.from("days").select(Object.keys(FIELDS).join(", ")).eq("date", date).maybeSingle(),
    supabase.from("khatm_log").select("pages").eq("date", date),
    supabase.from("khatm_log").select("to_page").not("to_page", "is", null).order("date", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("hifz_log").select("surah, repetitions").eq("date", date),
    supabase.from("hifz_log").select("surah").order("id", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (day.error || khatm.error || hifz.error) return null;
  const to = lastPage.data?.to_page ?? null;
  return {
    values: (day.data ?? {}) as Partial<Record<string, string | null>>,
    khatmPages: (khatm.data ?? []).reduce((s, e) => s + e.pages, 0),
    nextPage: to ? (to >= MUSHAF_PAGES ? 1 : to + 1) : null,
    hifzToday: hifz.data ?? [],
    currentSurah: lastHifz.data?.surah ?? null,
  };
}

const NOTE_MAX = 2000;

/** Saves the note for a day; empty text deletes it. */
export async function saveNote(date: string, text: string): Promise<ActionResult> {
  if (!validDate(date) || typeof text !== "string") return FAIL;
  const body = text.trim();
  if (body.length > NOTE_MAX) return { ok: false, error: `Жазба ${NOTE_MAX} таңбадан аспасын.` };
  const supabase = await createClient();
  const { error } = body
    ? await supabase.from("notes").upsert({ date, text: body }, { onConflict: "user_id,date" })
    : await supabase.from("notes").delete().eq("date", date);
  if (error) return FAIL;
  refresh();
  return { ok: true };
}
