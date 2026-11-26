import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { DayEditor, DayPicker } from "@/components/track/day-editor";
import { DayGrid } from "@/components/track/day-grid";
import { BestWorst, KpiGrid, TrendChart, type BestWorstItem, type Kpi } from "@/components/track/blocks";
import { loadDays } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { FIELDS, type DayField } from "@/lib/fields";
import { bestWorstMonth, fmtPct, lastDateWith, longestStreak, share } from "@/lib/stats";
import { marksFor, monthHeading, monthLabel, monthlyPct, rowsInMonth } from "@/lib/views";

export const metadata: Metadata = { title: "Зікір · Әдет трекер" };

const ZIKIR: { field: DayField; short: string; color: string }[] = [
  { field: "dhikr_morning", short: "таң", color: "#ff6a00" },
  { field: "dhikr_evening", short: "кеш", color: "#2563eb" },
];
const FIELDS_ZIKIR = ZIKIR.map((z) => z.field);
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
    <DayEditor today={today} marks={marksFor(days, FIELDS_ZIKIR)}>
      <div className="g12">
        <Panel title="Белгілеу" span="s5">
          <DayPicker fields={FIELDS_ZIKIR} />
        </Panel>

        <Panel title={monthHeading(today)} span="s7">
          <KpiGrid items={kpis} />
        </Panel>

        <Panel title="Соңғы күндер" span="s12" phoneShut>
          <DayGrid
            fields={FIELDS_ZIKIR}
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
    </DayEditor>
  );
}
