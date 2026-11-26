"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadDays, loadNotes, loadQuranLogs } from "@/lib/data";
import { parseCsv } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { hifzByDate, khatmByDate, parseRows, planImport, type Mode, type Plan, type RowError } from "@/lib/import";
import { readWorkbook } from "@/lib/workbook";

const MAX_BYTES = 4 * 1024 * 1024; // under Vercel's 4.5 MB request limit
const BATCH = 500;

export type Preview = {
  ok: true;
  fileName: string;
  rows: number;
  range: [string, string] | null;
  plan: Pick<Plan, "newDays" | "changedDays" | "unchangedDays" | "keptValues"> & {
    dayWrites: number;
    noteWrites: number;
    khatmWrites: number;
    hifzWrites: number;
  };
  errors: RowError[];
  errorCount: number;
  ignoredColumns: string[];
};
type Failure = { ok: false; error: string };

async function readFile(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Файл таңдалмады." } as const;
  if (file.size > MAX_BYTES) return { error: "Файл 4 МБ-тан үлкен." } as const;
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".csv")) return { file, rows: parseCsv(await file.text()) } as const;
    if (name.endsWith(".xlsx")) return { file, rows: await readWorkbook(await file.arrayBuffer()) } as const;
  } catch {
    return { error: "Файлды оқу мүмкін болмады. Шаблонмен салыстырып көріңіз." } as const;
  }
  return { error: "Тек .xlsx немесе .csv файл." } as const;
}

async function prepare(form: FormData) {
  const read = await readFile(form);
  if ("error" in read) return { error: read.error } as const;
  const mode: Mode = form.get("mode") === "replace" ? "replace" : "fill";
  const parsed = parseRows(read.rows as unknown[][], todayISO());
  if (parsed.missingDateColumn) return { error: "«Күні» бағаны табылмады. Бірінші жол — бағандар атауы болуы керек." } as const;
  const [{ days }, notes, quran] = await Promise.all([loadDays(), loadNotes(), loadQuranLogs()]);
  const plan = planImport(
    parsed.days,
    {
      days: new Map(days.map((d) => [d.date, d])),
      notes: new Map(notes.map((n) => [n.date, n.text])),
      khatm: khatmByDate(quran.khatm),
      hifz: hifzByDate(quran.hifz),
    },
    mode,
  );
  return { file: read.file, parsed, plan, mode } as const;
}

/** Reads the file and reports what an import would change. Writes nothing. */
export async function previewImport(form: FormData): Promise<Preview | Failure> {
  const p = await prepare(form);
  if ("error" in p) return { ok: false, error: p.error! };
  const dates = p.parsed.days.map((d) => d.date).sort();
  return {
    ok: true,
    fileName: p.file.name,
    rows: p.parsed.days.length + p.parsed.errors.length,
    range: dates.length ? [dates[0], dates.at(-1)!] : null,
    plan: {
      newDays: p.plan.newDays,
      changedDays: p.plan.changedDays,
      unchangedDays: p.plan.unchangedDays,
      keptValues: p.plan.keptValues,
      dayWrites: p.plan.dayWrites.length,
      noteWrites: p.plan.noteWrites.length,
      khatmWrites: p.plan.khatmWrites.length,
      hifzWrites: p.plan.hifzWrites.length,
    },
    errors: p.parsed.errors.slice(0, 50),
    errorCount: p.parsed.errors.length,
    ignoredColumns: p.parsed.ignoredColumns,
  };
}

export type Applied = { ok: true; days: number; notes: number; khatm: number; hifz: number; skippedRows: number };

/** Re-reads the file (nothing is trusted from the preview) and writes the plan. Rows with errors are skipped. */
export async function applyImport(form: FormData): Promise<Applied | Failure> {
  const p = await prepare(form);
  if ("error" in p) return { ok: false, error: p.error! };
  const supabase = await createClient();
  const fail = (what: string) => ({ ok: false as const, error: `${what} сақталмады. Бөлігі жазылған болуы мүмкін — алдын ала көруді қайта ашыңыз.` });

  // Upserting rows with different column sets in one call would write NULL into the
  // columns a row does not mention, so group by identical column sets.
  const groups = new Map<string, { date: string }[]>();
  for (const w of p.plan.dayWrites) {
    const key = Object.keys(w.values).sort().join(",");
    groups.set(key, [...(groups.get(key) ?? []), { date: w.date, ...w.values }]);
  }
  for (const rows of groups.values())
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from("days").upsert(rows.slice(i, i + BATCH), { onConflict: "user_id,date" });
      if (error) return fail("Күндер");
    }

  for (let i = 0; i < p.plan.noteWrites.length; i += BATCH) {
    const { error } = await supabase.from("notes").upsert(p.plan.noteWrites.slice(i, i + BATCH), { onConflict: "user_id,date" });
    if (error) return fail("Жазбалар");
  }

  // «replace» swaps a day's khatm / hifz entries; in «fill» those days had none.
  const swap = async (table: "khatm_log" | "hifz_log", rows: ({ date: string } & Record<string, unknown>)[]) => {
    if (!rows.length) return true;
    if (p.mode === "replace") {
      const { error } = await supabase.from(table).delete().in("date", rows.map((r) => r.date));
      if (error) return false;
    }
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from(table).insert(rows.slice(i, i + BATCH));
      if (error) return false;
    }
    return true;
  };
  if (!(await swap("khatm_log", p.plan.khatmWrites.map((w) => ({ date: w.date, ...w.entry }))))) return fail("Хатм");
  if (!(await swap("hifz_log", p.plan.hifzWrites.map((w) => ({ date: w.date, ...w.entry }))))) return fail("Хифз");

  await supabase.from("imports").insert({
    file_name: p.file.name.slice(0, 200),
    rows_ok: p.parsed.days.length,
    rows_err: p.parsed.errors.length,
    errors: p.parsed.errors.slice(0, 200),
  });
  refresh();
  return {
    ok: true,
    days: p.plan.dayWrites.length,
    notes: p.plan.noteWrites.length,
    khatm: p.plan.khatmWrites.length,
    hifz: p.plan.hifzWrites.length,
    skippedRows: p.parsed.errors.length,
  };
}
