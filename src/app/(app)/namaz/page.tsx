import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { TodayPicker } from "@/components/track/today-picker";
import { DayGrid } from "@/components/track/day-grid";
import { BestWorst, ExtraList, KpiGrid, TrendChart, type Kpi } from "@/components/track/blocks";
import { loadDays } from "@/lib/data";
import { dayLabel, MONTHS, parts } from "@/lib/dates";
import { FARD_FIELDS, FIELDS, type DayField } from "@/lib/fields";
import { bestWorstMonth, fardOnTime, fmtPct, qaza, remainingQaza, share } from "@/lib/stats";
import { gridFor, indexByDate, monthHeading, monthLabel, monthlyPct, rowsInMonth } from "@/lib/views";

export const metadata: Metadata = { title: "Намаз · Әдет трекер" };

const TODAY_FIELDS: DayField[] = [...FARD_FIELDS, "utir", "tungi", "duha"];
const GRID_FIELDS: DayField[] = ["tungi", "tan", "duha", "besin", "asr", "sham", "quptan", "utir"];

export default function NamazPage() {
  return (
    <>
      <PageHeader title="Намаз" subtitle="Парыз, үтір және нәпіл намаздар" actions={<MonthLink />} />
      <Suspense fallback={<p className="text-sm">Жүктелуде…</p>}>
        <NamazBody />
      </Suspense>
    </>
  );
}

function MonthLink() {
  return (
    <Link href="/month" className="btn btn-secondary text-sm font-medium" style={{ borderRadius: 6 }}>
      Ай кестесі →
    </Link>
  );
}

async function NamazBody() {
  const { today, days } = await loadDays();
  const todayRow = indexByDate(days).get(today) ?? {};
  const month = rowsInMonth(days, today);

  const onTime = fardOnTime(month);
  const fardQaza = FARD_FIELDS.map((f) => ({ f, ...qaza(month, f) }));
  const missed = fardQaza.reduce((s, q) => s + q.missed, 0);
  const madeUp = fardQaza.reduce((s, q) => s + q.madeUp, 0);
  const mosqueDays = month.filter((r) => FARD_FIELDS.some((f) => r[f] === "мешітте")).map((r) => r.date);
  const tungi = share(month, "tungi", "оқылды");
  const duha = share(month, "duha", "оқылды");
  const weakest = FARD_FIELDS.map((f) => ({ f, r: fardOnTime(month, [f]) }))
    .filter((x) => x.r.pct !== null)
    .sort((a, b) => a.r.pct! - b.r.pct!)[0];

  const kpis: Kpi[] = [
    {
      title: "Парыз уақытында",
      value: fmtPct(onTime),
      sub: onTime.d ? `${onTime.n} / ${onTime.d} намаз` : "Бұл айда белгі жоқ",
      tone: onTime.pct === null ? "mute" : onTime.pct >= 90 ? "good" : onTime.pct < 80 ? "bad" : "plain",
    },
    { title: "Қаза намаз", value: String(missed), sub: `Оның ішінде өтелді: ${madeUp}`, tone: missed ? "bad" : "plain" },
    {
      title: "Мешітте / жұма",
      value: String(mosqueDays.length),
      sub: mosqueDays.length
        ? `${mosqueDays.map((d) => parts(d).d).join(", ")} ${MONTHS[parts(today).m - 1].toLowerCase()}`
        : "—",
    },
    { title: "Түнгі намаз", value: `${tungi.n} / ${tungi.d}`, sub: fmtPct(tungi), tone: tungi.d ? "plain" : "mute" },
    { title: "Духа", value: `${duha.n} / ${duha.d}`, sub: fmtPct(duha), tone: duha.d ? "plain" : "mute" },
    weakest
      ? { title: "Ең әлсіз намаз", value: FIELDS[weakest.f].name, sub: `${fmtPct(weakest.r)} уақытында`, tone: "bad" }
      : { title: "Ең әлсіз намаз", value: "—", sub: "Дерек жоқ", tone: "mute" },
  ];

  const qazaList = [...fardQaza, { f: "utir" as const, ...qaza(month, "utir") }]
    .filter((q) => q.missed > 0)
    .sort((a, b) => b.missed - a.missed)
    .map((q) => ({ a: FIELDS[q.f].name, b: `${q.missed} қаза · ${q.madeUp} өтелді` }));

  const grid = gridFor(days, today, GRID_FIELDS);
  const trend = monthlyPct(days, today, (r) => fardOnTime(r));
  const year = today.slice(0, 4);
  const bw = bestWorstMonth(days.filter((d) => d.date.startsWith(year)), (r) => fardOnTime(r), (r) => FARD_FIELDS.some((f) => r[f]));
  const owed = remainingQaza(days);

  return (
    <div className="g12">
      <Panel title={`Бүгін · ${dayLabel(today)}`} span="s5">
        <TodayPicker date={today} fields={TODAY_FIELDS} values={todayRow} />
      </Panel>

      <Panel title={monthHeading(today)} span="s7">
        <div className="flex flex-col gap-3">
          <KpiGrid items={kpis} />
          <ExtraList title={`${monthLabel(today.slice(0, 7))} қаза есебі`} items={qazaList} />
          <ExtraList title="Барлық уақыт" items={[{ a: "Өтелмеген қаза (парыз + үтір)", b: String(owed) }]} />
        </div>
      </Panel>

      <Panel title="Соңғы күндер" span="s12" phoneShut>
        <DayGrid
          dayNumbers={grid.dayNumbers}
          rows={grid.rows}
          legend={[
            { label: "Уақытында / оқылды", tone: "good" },
            { label: "Мешітте / жұма", tone: "mosque" },
            { label: "Қаза өтелді", tone: "made_up" },
            { label: "Қаза / оқылмады", tone: "bad" },
            { label: "Белгіленбеген", tone: "none" },
          ]}
        />
      </Panel>

      <Panel title={`Парыз намаз уақытында, ${year} · %`} span="s8" phoneShut>
        <TrendChart labels={trend.labels} max={100} series={[{ name: "Парыз уақытында", unit: "%", color: "#2563eb", values: trend.values }]} />
      </Panel>

      <Panel title="Ең жақсы және ең нашар ай" span="s4" phoneShut>
        <BestWorst
          items={[
            bw
              ? {
                  name: "Парыз уақытында",
                  best: `${monthLabel(bw.best.key)} · ${fmtPct(bw.best.r)}`,
                  worst: `${monthLabel(bw.worst.key)} · ${fmtPct(bw.worst.r)}`,
                }
              : { name: "Парыз уақытында", empty: "Кемі 10 белгіленген күні бар ай әлі жоқ." },
          ]}
          note={`${year} жыл. Тек кемі 10 күні белгіленген айлар салыстырылады.`}
        />
      </Panel>
    </div>
  );
}
