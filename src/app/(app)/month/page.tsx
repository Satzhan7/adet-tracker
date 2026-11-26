import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { DayEditor } from "@/components/track/day-editor";
import { MonthBoard } from "@/components/track/month-board";
import { MonthPicker } from "@/components/track/month-picker";
import { BestWorst, ExtraList, KpiGrid, type BestWorstItem, type Kpi } from "@/components/track/blocks";
import { loadDays, loadMonthStats, loadNotes, type MonthStat } from "@/lib/data";
import { MONTHS, monthKey, prevMonthKey } from "@/lib/dates";
import { FARD_FIELDS, FIELDS, type DayField, type DayRow } from "@/lib/fields";
import { fardOnTime, fmtPct } from "@/lib/stats";
import { marksFor } from "@/lib/views";

export const metadata: Metadata = { title: "Ай кестесі — Әдет трекер" };

const MONTH_FIELDS: DayField[] = [
  "tungi", "tan", "duha", "besin", "asr", "sham", "quptan", "utir",
  "dhikr_morning", "dhikr_evening", "wird_taha", "wird_amana", "creatine", "protein", "oraza",
];
/** SPEC rule 8: only months with at least this many marked fard days are compared. */
const MIN_DAYS = 10;

export default function MonthPage({ searchParams }: PageProps<"/month">) {
  return (
    <Suspense fallback={<PageHeader title="Ай кестесі" subtitle="Жүктелуде…" />}>
      <MonthBody searchParams={searchParams} />
    </Suspense>
  );
}

async function MonthBody({ searchParams }: Pick<PageProps<"/month">, "searchParams">) {
  const sp = await searchParams;
  const [{ today, days }, notes, stats] = await Promise.all([loadDays(), loadNotes(), loadMonthStats()]);

  // Month from ?y=&m=, clamped to [first month with data, current month].
  const firstYear = Number((days[0]?.date ?? today).slice(0, 4));
  const ty = Number(today.slice(0, 4));
  const tm = Number(today.slice(5, 7));
  let y = Number(sp.y) || ty;
  let m = Number(sp.m) || tm;
  if (y > ty || (y === ty && m > tm)) [y, m] = [ty, tm];
  if (y < firstYear || m < 1 || m > 12) [y, m] = [ty, tm];
  const key = `${y}-${String(m).padStart(2, "0")}`;
  const analysis = sp.analysis === "1";

  const len = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dates = Array.from({ length: len }, (_, i) => `${key}-${String(i + 1).padStart(2, "0")}`);
  const rows = days.filter((d) => monthKey(d.date) === key);
  const markedDays = rows.filter((r) => MONTH_FIELDS.some((f) => r[f])).map((r) => Number(r.date.slice(8)));
  const subtitle = markedDays.length
    ? `Деректер: ${Math.min(...markedDays)}–${Math.max(...markedDays)} ${MONTHS[m - 1].toLowerCase()} — ${markedDays.length} күн белгіленген`
    : "Бұл айда әлі белгі жоқ";
  const monthNotes = Object.fromEntries(notes.filter((n) => n.date.startsWith(key)).map((n) => [n.date, n.text]));
  const base = `/month?y=${y}&m=${m}`;

  return (
    <>
      <PageHeader
        title={`Ай кестесі — ${MONTHS[m - 1]} ${y}`}
        subtitle={subtitle}
        actions={
          <>
            <Link href={analysis ? base : `${base}&analysis=1`} className="btn-seg tab-link" aria-current={analysis ? "page" : undefined}>
              Талдау
            </Link>
            <MonthPicker year={y} month={m} firstYear={firstYear} today={today} keep={analysis ? "&analysis=1" : ""} />
          </>
        }
      />
      <DayEditor today={today} marks={marksFor(days, MONTH_FIELDS)}>
        <div className="g12">
          {analysis && <Analysis monthKeyValue={key} stats={stats} rows={rows} />}
          <MonthBoard key={key} dates={dates} fields={MONTH_FIELDS} notes={monthNotes} title={`${MONTHS[m - 1]} — барлық күндер`} />
          <BestWorstPanel year={String(y)} stats={stats} />
        </div>
      </DayEditor>
    </>
  );
}

function Analysis({ monthKeyValue, stats, rows }: { monthKeyValue: string; stats: MonthStat[]; rows: DayRow[] }) {
  const s = stats.find((x) => x.month === monthKeyValue);
  const prev = stats.find((x) => x.month === prevMonthKey(`${monthKeyValue}-01`));
  const name = MONTHS[Number(monthKeyValue.slice(5)) - 1];
  if (!s) {
    return (
      <Panel title={`${name} талдауы`} span="s12">
        <p className="m-0 text-[15px]">Бұл айда талдауға дерек жоқ.</p>
      </Panel>
    );
  }
  const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);
  const diff = prev?.fard_on_time_pct != null && s.fard_on_time_pct != null ? s.fard_on_time_pct - prev.fard_on_time_pct : null;
  const kpis: Kpi[] = [
    {
      title: "Парыз уақытында",
      value: pct(s.fard_on_time_pct),
      sub: `${s.fard_on_time} / ${s.fard_marked}${diff !== null ? ` — алдыңғы айдан ${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(2)} п.` : ""}`,
      tone: s.fard_on_time_pct === null ? "mute" : s.fard_on_time_pct >= 90 ? "good" : s.fard_on_time_pct < 80 ? "bad" : "plain",
    },
    { title: "Қаза намаз", value: `${s.fard_missed} — ${s.fard_made_up} өтелді`, sub: `Үтір: ${s.witr_missed} — ${s.witr_made_up} өтелді`, tone: s.fard_missed ? "bad" : "good", compact: true },
    { title: "Зікір — таң / кеш", value: `${pct(s.dhikr_morning_pct)} / ${pct(s.dhikr_evening_pct)}`, sub: `${s.dhikr_morning_done} / ${s.dhikr_morning_marked} және ${s.dhikr_evening_done} / ${s.dhikr_evening_marked} күн`, compact: true },
    { title: "Креатин", value: pct(s.creatine_pct), sub: `${s.creatine_done} / ${s.creatine_marked} күн`, tone: s.creatine_marked ? "plain" : "mute" },
    { title: "Ораза", value: `${s.fasted} күн`, sub: s.fast_qaza ? `Қаза ${s.fast_qaza} — ${s.fast_made_up} өтелді` : "Қаза жоқ", tone: s.fasted ? "good" : "mute" },
  ];
  const bars = FARD_FIELDS.map((f) => ({ name: FIELDS[f].name, r: fardOnTime(rows, [f]) }));
  return (
    <>
      <Panel title={`${name} талдауы`} span="s8">
        <KpiGrid items={kpis} />
      </Panel>
      <Panel title="Намаз бойынша, уақытында" span="s4">
        <div className="flex flex-col gap-2.5">
          {bars.map((b) => (
            <div key={b.name} className="pct-bar">
              <span className="pct-bar-name">{b.name}</span>
              <span className="pct-bar-track" aria-hidden="true">
                <span className="pct-bar-fill" style={{ width: `${b.r.pct ?? 0}%` }} />
              </span>
              <span className="pct-bar-value">{fmtPct(b.r)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function BestWorstPanel({ year, stats }: { year: string; stats: MonthStat[] }) {
  const inYear = stats.filter((s) => s.month.startsWith(year));
  const measures: { name: string; pct: (s: MonthStat) => number | null; days: (s: MonthStat) => number }[] = [
    { name: "Парыз уақытында", pct: (s) => s.fard_on_time_pct, days: (s) => s.fard_days_marked },
    { name: "Таңғы зікір", pct: (s) => s.dhikr_morning_pct, days: (s) => s.dhikr_morning_marked },
    { name: "Креатин", pct: (s) => s.creatine_pct, days: (s) => s.creatine_marked },
  ];
  const items: BestWorstItem[] = measures.map((ms) => {
    const ok = inYear.filter((s) => ms.days(s) >= MIN_DAYS && ms.pct(s) !== null);
    if (!ok.length) return { name: ms.name, empty: `Кемі ${MIN_DAYS} белгіленген күні бар ай әлі жоқ.` };
    const sorted = [...ok].sort((a, b) => ms.pct(a)! - ms.pct(b)! || a.month.localeCompare(b.month));
    const label = (s: MonthStat) => `${MONTHS[Number(s.month.slice(5)) - 1]} — ${fmtPct(ms.pct(s))}`;
    return { name: ms.name, best: label(sorted.at(-1)!), worst: label(sorted[0]) };
  });
  const year12 = inYear.map((s) => ({ a: MONTHS[Number(s.month.slice(5)) - 1], b: s.fard_on_time_pct === null ? "—" : `${s.fard_on_time_pct.toFixed(2)}%` }));
  return (
    <>
      <Panel title={`Ең жақсы және ең нашар ай — ${year}`} span="s7" phoneShut>
        <BestWorst items={items} note={`${year} жыл. Тек кемі ${MIN_DAYS} күні белгіленген айлар салыстырылады.`} />
      </Panel>
      <Panel title={`Парыз уақытында — ${year}`} span="s5" phoneShut>
        <ExtraList title="Ай бойынша" items={year12} />
      </Panel>
    </>
  );
}
