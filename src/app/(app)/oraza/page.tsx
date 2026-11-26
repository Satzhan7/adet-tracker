import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { DayEditor, DayPicker } from "@/components/track/day-editor";
import { Legend } from "@/components/track/day-grid";
import { YearCalendar } from "@/components/track/year-calendar";
import { KpiGrid, TrendChart, type Kpi } from "@/components/track/blocks";
import { loadDays } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { lastDateWith } from "@/lib/stats";
import { latestYearWith, marksFor, yearMonths } from "@/lib/views";

export const metadata: Metadata = { title: "Ораза · Әдет трекер" };

export default function OrazaPage({ searchParams }: PageProps<"/oraza">) {
  return (
    <Suspense fallback={<PageHeader title="Ораза" subtitle="Жүктелуде…" />}>
      <OrazaBody searchParams={searchParams} />
    </Suspense>
  );
}

async function OrazaBody({ searchParams }: Pick<PageProps<"/oraza">, "searchParams">) {
  const { year: raw } = await searchParams;
  const { today, days } = await loadDays();
  const withData = [...new Set(days.filter((d) => d.oraza).map((d) => d.date.slice(0, 4)))];
  const years = [...new Set([...withData, today.slice(0, 4)])].sort();
  const year = typeof raw === "string" && years.includes(raw) ? raw : latestYearWith(days, today, (r) => !!r.oraza);
  const rows = days.filter((d) => d.date.startsWith(year));

  const count = (v: string) => rows.filter((r) => r.oraza === v).length;
  const fasted = count("ұстадым");
  const qaza = count("қаза болды");
  const madeUp = count("қаза өтедім");
  const last = lastDateWith(days, "oraza", "ұстадым");
  const allQaza = days.filter((r) => r.oraza === "қаза болды").length;
  const allMade = days.filter((r) => r.oraza === "қаза өтедім").length;

  const kpis: Kpi[] = [
    { title: `${year} · ұсталған күн`, value: String(fasted), sub: "Рамазан және нәпіл ораза", tone: fasted ? "good" : "mute" },
    { title: "Рамазан қазасы", value: String(qaza), sub: `${madeUp} күн өтелді`, tone: qaza > madeUp ? "bad" : qaza ? "good" : "mute" },
    {
      title: "Өтелмеген ораза (барлығы)",
      value: String(Math.max(0, allQaza - allMade)),
      sub: `${allQaza} қаза · ${allMade} өтелді`,
      tone: allQaza > allMade ? "bad" : "good",
    },
    { title: "Соңғы ұсталған күн", value: last ? dayLabel(last, today) : "—", sub: "Ораза", tone: last ? "plain" : "mute" },
  ];

  const months = yearMonths(days, year === today.slice(0, 4) ? today : `${year}-12-31`);

  return (
    <>
      <PageHeader
        title="Ораза"
        subtitle="Ұсталған күндер, Рамазан қазасы және өтелуі"
        actions={years.map((y) => (
          <Link key={y} href={`/oraza?year=${y}`} className="btn-seg tab-link" aria-current={y === year ? "page" : undefined}>
            {y}
          </Link>
        ))}
      />
      <DayEditor today={today} marks={marksFor(days, ["oraza"])}>
        <div className="g12">
          <Panel title="Белгілеу" span="s5">
            <DayPicker fields={["oraza"]} />
          </Panel>
          <Panel title={`Ораза, ${year}`} span="s7">
            <KpiGrid items={kpis} />
          </Panel>
          <Panel title={`Жылдық күнтізбе · ${year}`} span="s12">
            <div className="flex flex-col gap-3">
              <YearCalendar year={year} field="oraza" />
              <Legend
                items={[
                  { label: "Ұстадым", tone: "good" },
                  { label: "Қаза өтедім", tone: "made_up" },
                  { label: "Қаза болды", tone: "bad" },
                  { label: "Ұстамадым", tone: "neutral" },
                  { label: "Белгіленбеген", tone: "none" },
                ]}
              />
            </div>
          </Panel>
          <Panel title={`Айына ұсталған күн · ${year}`} span="s12" phoneShut>
            <TrendChart
              labels={months.map((m) => m.label)}
              max={Math.max(10, ...months.map((m) => m.rows.filter((r) => r.oraza === "ұстадым").length))}
              series={[
                { name: "Ұстадым", unit: "күн", color: "#197d19", values: months.map((m) => m.rows.filter((r) => r.oraza === "ұстадым").length) },
                { name: "Қаза өтедім", unit: "күн", color: "#0e9aa7", values: months.map((m) => m.rows.filter((r) => r.oraza === "қаза өтедім").length) },
              ]}
            />
          </Panel>
        </div>
      </DayEditor>
    </>
  );
}
