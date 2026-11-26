import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { DayEditor, DayPicker } from "@/components/track/day-editor";
import { DayGrid } from "@/components/track/day-grid";
import { BestWorst, ExtraList, KpiGrid, TrendChart, type BestWorstItem, type Kpi } from "@/components/track/blocks";
import { loadDays } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import type { DayField } from "@/lib/fields";
import { bestWorstMonth, CREATINE_DONE, fmtPct, lastDateWith, longestStreak, share } from "@/lib/stats";
import { latestYearWith, marksFor, monthHeading, monthLabel, rowsInMonth, yearMonths } from "@/lib/views";

export const metadata: Metadata = { title: "Денсаулық — Әдет трекер" };

const FIELDS_HEALTH: DayField[] = ["creatine", "protein"];
const MEASURES = [
  { field: "creatine" as const, name: "Креатин", done: CREATINE_DONE, color: "#197d19" },
  { field: "protein" as const, name: "Протеин", done: ["іштім"], color: "#2563eb" },
];

export default function HealthPage() {
  return (
    <>
      <PageHeader title="Денсаулық" subtitle="Креатин және протеин" />
      <Suspense fallback={<p className="text-sm">Жүктелуде…</p>}>
        <HealthBody />
      </Suspense>
    </>
  );
}

async function HealthBody() {
  const { today, days } = await loadDays();
  const month = rowsInMonth(days, today);
  const year = latestYearWith(days, today, (r) => !!(r.creatine || r.protein));

  const kpis: Kpi[] = [];
  for (const m of MEASURES) {
    const r = share(month, m.field, m.done);
    kpis.push({
      title: `${m.name} — осы ай`,
      value: fmtPct(r),
      sub: `${r.n} / ${r.d} күн`,
      tone: r.pct === null ? "mute" : r.pct >= 80 ? "good" : r.pct < 50 ? "bad" : "plain",
    });
  }
  const streak = longestStreak(days, "creatine", CREATINE_DONE);
  const skipped = lastDateWith(days, "creatine", "өткізілді");
  kpis.push(
    {
      title: "Креатин — ең ұзақ серия",
      value: `${streak.length} күн`,
      sub: streak.end ? `${dayLabel(streak.end, today)} аяқталды` : "Әлі серия жоқ",
      tone: streak.length ? "good" : "mute",
    },
    { title: "Соңғы өткізілген күн", value: skipped ? dayLabel(skipped, today) : "—", sub: "Креатин", tone: skipped ? "plain" : "mute" },
  );

  const doses = CREATINE_DONE.map((v) => ({ a: v, b: `${month.filter((r) => r.creatine === v).length} күн` }));
  const months = yearMonths(days, year === today.slice(0, 4) ? today : `${year}-12-31`);
  const yearRows = days.filter((d) => d.date.startsWith(year));
  const bw: BestWorstItem[] = MEASURES.map((m) => {
    const r = bestWorstMonth(yearRows, (rows) => share(rows, m.field, m.done), (row) => !!row[m.field]);
    return r
      ? { name: m.name, best: `${monthLabel(r.best.key)} — ${fmtPct(r.best.r)}`, worst: `${monthLabel(r.worst.key)} — ${fmtPct(r.worst.r)}` }
      : { name: m.name, empty: "Кемі 10 белгіленген күні бар ай әлі жоқ." };
  });

  return (
    <DayEditor today={today} marks={marksFor(days, FIELDS_HEALTH)}>
      <div className="g12">
        <Panel title="Белгілеу" span="s5">
          <DayPicker fields={FIELDS_HEALTH} />
        </Panel>
        <Panel title={monthHeading(today)} span="s7">
          <div className="flex flex-col gap-3">
            <KpiGrid items={kpis} />
            <ExtraList title="Креатин дозасы — осы ай" items={doses} />
          </div>
        </Panel>
        <Panel title="Соңғы күндер" span="s12" phoneShut>
          <DayGrid
            fields={FIELDS_HEALTH}
            legend={[
              { label: "5 г / 6 капсула / іштім", tone: "good" },
              { label: "3 капсула", tone: "partial" },
              { label: "Өткізілді / жоқ", tone: "bad" },
              { label: "Белгіленбеген", tone: "none" },
            ]}
          />
        </Panel>
        <Panel title={`Денсаулық, ${year} — орындалған күндер %`} span="s8" phoneShut>
          <TrendChart
            labels={months.map((m) => m.label)}
            max={100}
            series={MEASURES.map((m) => ({ name: m.name, unit: "%", color: m.color, values: months.map((x) => share(x.rows, m.field, m.done).pct) }))}
          />
        </Panel>
        <Panel title="Ең жақсы және ең нашар ай" span="s4" phoneShut>
          <BestWorst items={bw} note={`${year} жыл. Үш доза да (5 г, 6 капсула, 3 капсула) толық саналады.`} />
        </Panel>
      </div>
    </DayEditor>
  );
}
