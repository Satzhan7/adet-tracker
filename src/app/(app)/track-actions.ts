"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FIELDS, isDayField } from "@/lib/fields";
import { MUSHAF_PAGES } from "@/lib/stats";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const FAIL: ActionResult = { ok: false, error: "Сақталмады. Қайта көріңіз." };

/** Sets (or clears, with null) one mark for one day. Field and value are checked against FIELDS. */
export async function setDayStatus(date: string, field: string, value: string | null): Promise<ActionResult> {
  if (!ISO_DATE.test(date) || !isDayField(field)) return FAIL;
  if (value !== null && !FIELDS[field].options.some((o) => o.value === value)) return FAIL;

  const supabase = await createClient();
  const { error } = await supabase.from("days").upsert({ date, [field]: value }, { onConflict: "user_id,date" });
  if (error) return FAIL;
  refresh();
  return { ok: true };
}

export async function addKhatm(date: string, pages: number, fromPage?: number | null): Promise<ActionResult> {
  if (!ISO_DATE.test(date) || !Number.isInteger(pages) || pages < 1 || pages > MUSHAF_PAGES) return FAIL;
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
  if (!ISO_DATE.test(date) || !name || name.length > 60) return FAIL;
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
