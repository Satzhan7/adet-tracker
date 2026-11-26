import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadDays, loadMonthStats, loadNotes, loadQuranLogs } from "@/lib/data";
import { addDays } from "@/lib/dates";
import { toCsv } from "@/lib/csv";
import { hifzByDate, khatmByDate, toRows } from "@/lib/import";
import { buildWorkbook } from "@/lib/workbook";

/**
 * GET /reports/export?format=xlsx|csv&year=2026|all[&template=1]
 * xlsx/csv of the «Күнделік» sheet; template=1 gives the year's dates with empty cells.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = request.nextUrl.searchParams;
  const format = sp.get("format") === "csv" ? "csv" : "xlsx";
  const template = sp.get("template") === "1";
  const yearParam = sp.get("year") ?? "all";
  const year = /^\d{4}$/.test(yearParam) ? yearParam : "all";

  const [{ today, days }, notes, quran, stats] = await Promise.all([loadDays(), loadNotes(), loadQuranLogs(), loadMonthStats()]);
  const dayMap = new Map(days.map((d) => [d.date, d]));
  const noteMap = new Map(notes.map((n) => [n.date, n.text]));
  const khatm = khatmByDate(quran.khatm);
  const hifz = hifzByDate(quran.hifz);

  let dates: string[];
  if (template) {
    const y = year === "all" ? today.slice(0, 4) : year;
    dates = [];
    for (let d = `${y}-01-01`; d <= `${y}-12-31`; d = addDays(d, 1)) dates.push(d);
  } else {
    const all = new Set([...dayMap.keys(), ...noteMap.keys(), ...khatm.keys(), ...hifz.keys()]);
    dates = [...all].filter((d) => year === "all" || d.startsWith(year)).sort();
  }
  const rows = template
    ? toRows(dates, new Map(), new Map(), new Map(), new Map())
    : toRows(dates, dayMap, noteMap, khatm, hifz);

  const name = template ? `adet-tracker-shablon-${year === "all" ? today.slice(0, 4) : year}` : `adet-tracker-${year}-${today}`;
  const body =
    format === "csv"
      ? toCsv(rows)
      : new Uint8Array(await buildWorkbook(rows, template ? [] : stats));
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
