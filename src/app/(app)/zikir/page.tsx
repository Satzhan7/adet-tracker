import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { TodayPicker } from "@/components/track/today-picker";
import { DayGrid } from "@/components/track/day-grid";
import { BestWorst, KpiGrid, TrendChart, type BestWorstItem, type Kpi } from "@/components/track/blocks";
import { loadDays } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { FIELDS, type DayField } from "@/lib/fields";
import { bestWorstMonth, fmtPct, lastDateWith, longestStreak, share } from "@/lib/stats";
import { gridFor, indexByDate, monthHeading, monthLabel, monthlyPct, rowsInMonth } from "@/lib/views";

export const metadata: Metadata = { title: "Зікір · Әдет трекер" };

const ZIKIR: { field: DayField; short: string; color: string }[] = [
  { field: "dhikr_morning", short: "таң", color: "#ff6a00" },
  { field: "dhikr_evening", short: "кеш", color: "#2563eb" },
];
const DONE = "орындалды";

export default function ZikirPage() {
  return (
    <>
      <PageHeader title="Зікір" subtitle="Таңғы және кешкі зікір" />
      <Suspense fallback={<p className="text-sm">Жүктелуде…</p>}>
        <ZikirBody />
      </Suspense>
    </>
  );
}

async function ZikirBody() {
  const { today, days } = await loadDays();
  const todayRow = indexByDate(days).get(today) ?? {};
  const month = rowsInMonth(days, today);
  const year = today.slice(0, 4);

  const kpis: Kpi[] = [];
  for (const z of ZIKIR) {
    const r = share(month, z.field, DONE);
    kpis.push({
      title: FIELDS[z.field].name,
      value: fmtPct(r),
      sub: `${r.n} / ${r.d} күн`,
      tone: r.pct === null ? "mute" : r.pct >= 80 ? "good" : r.pct < 50 ? "bad" : "plain",
    });
  }
  for (const z of ZIKIR) {
    const last = lastDateWith(days, z.field, DONE);
    kpis.push({
      title: `Соңғы · ${z.short}`,
      value: last ? dayLabel(last) : "—",
      sub: "Соңғы орындалған күн",
      tone: !last ? "mute" : last === today ? "good" : "plain",
    });
  }
  for (const z of ZIKIR) {
    const s = longestStreak(days, z.field, DONE);
    kpis.push({
      title: `Ең ұзақ серия · ${z.short}`,
      value: `${s.length} күн`,
      sub: s.end ? `${dayLabel(s.end)} аяқталды` : "Әлі серия жоқ",
      tone: s.length ? "good" : "mute",
    });
  }

  const grid = gridFor(
    days,
    today,
    ZIKIR.map((z) => z.field),
  );
  const series = ZIKIR.map((z) => {
    const t = monthlyPct(days, today, (r) => share(r, z.field, DONE));
    return { name: FIELDS[z.field].name, unit: "%", color: z.color, values: t.values, labels: t.labels };
  });

  const yearRows = days.filter((d) => d.date.startsWith(year));
  const bw: BestWorstItem[] = ZIKIR.map((z) => {
    const r = bestWorstMonth(yearRows, (rows) => share(rows, z.field, DONE), (row) => !!row[z.field]);
    return r
      ? {
          name: FIELDS[z.field].name,
          best: `${monthLabel(r.best.key)} · ${fmtPct(r.best.r)}`,
          worst: `${monthLabel(r.worst.key)} · ${fmtPct(r.worst.r)}`,
        }
      : { name: FIELDS[z.field].name, empty: "Кемі 10 белгіленген күні бар ай әлі жоқ." };
  });

  return (
    <div className="g12">
      <Panel title={`Бүгін · ${dayLabel(today)}`} span="s5">
        <TodayPicker date={today} fields={ZIKIR.map((z) => z.field)} values={todayRow} />
      </Panel>

      <Panel title={monthHeading(today)} span="s7">
        <KpiGrid items={kpis} />
      </Panel>

      <Panel title="Соңғы күндер" span="s12" phoneShut>
        <DayGrid
          dayNumbers={grid.dayNumbers}
          rows={grid.rows}
          legend={[
            { label: "Орындалды", tone: "good" },
            { label: "Ішінара", tone: "partial" },
            { label: "Орындалмады", tone: "bad" },
            { label: "Белгіленбеген", tone: "none" },
          ]}
        />
      </Panel>

      <Panel title={`Зікір, ${year} · орындалған күндер %`} span="s8" phoneShut>
        <TrendChart labels={series[0].labels} max={100} series={series} />
      </Panel>

      <Panel title="Ең жақсы және ең нашар ай" span="s4" phoneShut>
        <BestWorst items={bw} note={`${year} жыл. Ішінара орындалды деп саналмайды.`} />
      </Panel>
    </div>
  );
}
