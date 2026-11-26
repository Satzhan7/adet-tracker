import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { DayEditor } from "@/components/track/day-editor";
import { DayGrid } from "@/components/track/day-grid";
import { BestWorst, ExtraList, KpiGrid, TrendChart, type Kpi } from "@/components/track/blocks";
import { loadDays, loadQuranLogs, type HifzEntry, type KhatmEntry } from "@/lib/data";
import { addDays, dayLabel, monthKey, parts, prevMonthKey } from "@/lib/dates";
import { FARD_FIELDS, FIELDS, type DayField, type DayRow } from "@/lib/fields";
import { currentPage, hifzPath } from "@/lib/quran";
import { bestWorstMonth, CREATINE_DONE, fardOnTime, fmtPct, khatmProgress, MUSHAF_PAGES, qaza, share } from "@/lib/stats";
import { marksFor, monthHeading, monthLabel, rowsInMonth, yearMonths } from "@/lib/views";

export const metadata: Metadata = { title: "Басты бет · Әдет трекер" };

const GRID_FIELDS: DayField[] = ["tungi", "tan", "duha", "besin", "asr", "sham", "quptan", "dhikr_morning", "dhikr_evening", "creatine"];
const tone = (p: number | null, good: number, bad: number): Kpi["tone"] =>
  p === null ? "mute" : p >= good ? "good" : p < bad ? "bad" : "plain";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<PageHeader title="Басты бет" subtitle="Жүктелуде…" />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { view } = await searchParams;
  const isYear = view === "year";
  const [{ today, days }, quran] = await Promise.all([loadDays(), loadQuranLogs()]);
  const year = today.slice(0, 4);
  const lastMarked = [...days].reverse().find((d) => FARD_FIELDS.some((f) => d[f]))?.date;

  return (
    <>
      <PageHeader
        title="Басты бет"
        subtitle={lastMarked ? `Соңғы белгі: ${dayLabel(lastMarked, today)}` : "Әлі белгі жоқ"}
        actions={
          <>
            <Link href="/" className="btn-seg tab-link" aria-current={!isYear ? "page" : undefined}>
              {monthLabel(monthKey(today))}
            </Link>
            <Link href="/?view=year" className="btn-seg tab-link" aria-current={isYear ? "page" : undefined}>
              {year} жыл
            </Link>
          </>
        }
      />
      <DayEditor today={today} marks={marksFor(days, GRID_FIELDS)}>
        <div className="g12">
          {isYear ? <YearView today={today} days={days} /> : <MonthView today={today} days={days} />}
          <PrayerBreakdown today={today} days={days} />
          <QuranSummary khatm={quran.khatm} hifz={quran.hifz} />
        </div>
      </DayEditor>
    </>
  );
}

function MonthView({ today, days }: { today: string; days: DayRow[] }) {
  const month = rowsInMonth(days, today);
  const prevKey = prevMonthKey(today);
  const prev = fardOnTime(days.filter((d) => monthKey(d.date) === prevKey));
  const onTime = fardOnTime(month);

  const q = [...FARD_FIELDS, "utir" as const].map((f) => ({ f, ...qaza(month, f) }));
  const fardMissed = q.filter((x) => x.f !== "utir").reduce((s, x) => s + x.missed, 0);
  const fardMade = q.filter((x) => x.f !== "utir").reduce((s, x) => s + x.madeUp, 0);
  const byPrayer = q.filter((x) => x.missed).sort((a, b) => b.missed - a.missed);

  // Jumu'ah: Fridays so far this month (today only once Бесін is marked), and how many have Бесін «мешітте».
  const idx = new Map(month.map((r) => [r.date, r]));
  const fridays: string[] = [];
  for (let d = `${today.slice(0, 7)}-01`; d <= today; d = addDays(d, 1))
    if (new Date(`${d}T12:00:00Z`).getUTCDay() === 5 && (d < today || idx.get(d)?.besin)) fridays.push(d);
  const jumuah = fridays.filter((d) => idx.get(d)?.besin === "мешітте");
  let nextFriday = idx.get(today)?.besin ? addDays(today, 1) : today;
  while (new Date(`${nextFriday}T12:00:00Z`).getUTCDay() !== 5) nextFriday = addDays(nextFriday, 1);

  const zm = share(month, "dhikr_morning", "орындалды");
  const ze = share(month, "dhikr_evening", "орындалды");
  const tungi = share(month, "tungi", "оқылды");
  const duha = share(month, "duha", "оқылды");
  const cr = share(month, "creatine", CREATINE_DONE);
  const doses = CREATINE_DONE.map((v) => ({ v, n: month.filter((r) => r.creatine === v).length })).filter((x) => x.n);

  const kpis: Kpi[] = [
    {
      title: "Парыз намаз уақытында",
      value: fmtPct(onTime),
      sub: `${onTime.n} / ${onTime.d} намаз${prev.pct !== null ? ` · ${monthLabel(prevKey).toLowerCase()} ${fmtPct(prev)}` : ""}`,
      tone: tone(onTime.pct, 90, 80),
    },
    {
      title: "Қаза намаз",
      value: `${fardMissed} · ${fardMade} өтелді`,
      compact: true,
      sub: byPrayer.length ? byPrayer.map((x) => `${FIELDS[x.f].name} ${x.missed}`).join(", ") : "Қаза жоқ",
      tone: fardMissed ? "bad" : "good",
    },
    {
      title: "Жұма намазы",
      value: `${jumuah.length} / ${fridays.length}`,
      sub: `${jumuah.length ? jumuah.map((d) => parts(d).d).join(", ") + " · " : ""}келесісі ${dayLabel(nextFriday)}`,
      tone: fridays.length && jumuah.length === fridays.length ? "good" : "plain",
    },
    {
      title: "Зікір · таң / кеш",
      value: `${fmtPct(zm)} / ${fmtPct(ze)}`,
      compact: true,
      sub: `${zm.n} / ${zm.d} және ${ze.n} / ${ze.d} күн`,
      tone: tone(zm.pct, 80, 50),
    },
    { title: "Түнгі / духа", value: `${tungi.n} / ${duha.n}`, compact: true, sub: `${tungi.d} және ${duha.d} белгіленген күннен`, tone: tungi.d ? "plain" : "mute" },
    {
      title: "Креатин",
      value: fmtPct(cr),
      sub: `${cr.n} / ${cr.d} күн${doses.length ? ": " + doses.map((x) => `${x.n} күн ${x.v}`).join(", ") : ""}`,
      tone: tone(cr.pct, 80, 50),
    },
  ];

  return (
    <>
      <Panel title={monthHeading(today)} span="s12">
        <KpiGrid items={kpis} />
      </Panel>
      <Panel title="Соңғы күндер" span="s12" phoneShut>
        <div className="flex flex-col gap-3">
          <DayGrid
            fields={GRID_FIELDS}
            initial={10}
            legend={[
              { label: "Уақытында / орындалды", tone: "good" },
              { label: "Мешітте / жұма", tone: "mosque" },
              { label: "Өтелді", tone: "made_up" },
              { label: "Ішінара / 3 капсула", tone: "partial" },
              { label: "Қаза / жоқ", tone: "bad" },
              { label: "Белгіленбеген", tone: "none" },
            ]}
          />
          <Link href="/month" className="btn btn-secondary self-start text-sm font-medium" style={{ borderRadius: 6 }}>
            Толық айды көру →
          </Link>
        </div>
      </Panel>
    </>
  );
}

function YearView({ today, days }: { today: string; days: DayRow[] }) {
  const year = today.slice(0, 4);
  const months = yearMonths(days, today);
  const yearRows = days.filter((d) => d.date.startsWith(year));
  const series = [
    { name: "Парыз уақытында", color: "#2563eb", values: months.map((m) => fardOnTime(m.rows).pct) },
    { name: "Таңғы зікір", color: "#ff6a00", values: months.map((m) => share(m.rows, "dhikr_morning", "орындалды").pct) },
    { name: "Кешкі зікір", color: "#7843e9", values: months.map((m) => share(m.rows, "dhikr_evening", "орындалды").pct) },
    { name: "Креатин", color: "#197d19", values: months.map((m) => share(m.rows, "creatine", CREATINE_DONE).pct) },
  ].map((s) => ({ ...s, unit: "%" }));

  const bw = bestWorstMonth(yearRows, (r) => fardOnTime(r), (r) => FARD_FIELDS.some((f) => r[f]));
  const fasted = yearRows.filter((r) => r.oraza === "ұстадым").length;
  const fastQaza = yearRows.filter((r) => r.oraza === "қаза болды").length;
  const fastMade = yearRows.filter((r) => r.oraza === "қаза өтедім").length;

  return (
    <>
      <Panel title={`${year} жыл · ай сайынғы орындалу, %`} span="s8">
        <TrendChart labels={months.map((m) => m.label)} max={100} series={series} />
      </Panel>
      <Panel title="Жыл қорытындысы" span="s4">
        <div className="flex flex-col gap-3">
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
          />
          <ExtraList
            title="Ораза"
            items={[
              { a: "Ұсталған күн", b: String(fasted) },
              { a: "Рамазан қазасы", b: fastQaza ? `${fastQaza} · ${fastMade} өтелді` : "жоқ" },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}

function PrayerBreakdown({ today, days }: { today: string; days: DayRow[] }) {
  const month = rowsInMonth(days, today);
  const items = [
    ...FARD_FIELDS.map((f) => ({ a: FIELDS[f].name, r: fardOnTime(month, [f]) })),
    { a: FIELDS.tungi.name, r: share(month, "tungi", "оқылды") },
    { a: FIELDS.duha.name, r: share(month, "duha", "оқылды") },
  ].map((x) => ({ a: x.a, b: x.r.d ? `${fmtPct(x.r)} · ${x.r.n} / ${x.r.d}` : "—" }));
  return (
    <Panel title={`Намаз бойынша · ${monthLabel(monthKey(today)).toLowerCase()}`} span="s7" phoneShut>
      <ExtraList title="Уақытында оқылған күн / белгіленген күн" items={items} />
    </Panel>
  );
}

function QuranSummary({ khatm, hifz }: { khatm: KhatmEntry[]; hifz: HifzEntry[] }) {
  const pos = currentPage(khatm);
  const progress = khatmProgress(pos ?? 0);
  const path = hifzPath(hifz);
  const current = path.at(-1);
  const kpis: Kpi[] = [
    { title: "Жеке хатм", value: `${progress.n} / ${MUSHAF_PAGES}`, sub: `${fmtPct(progress)} · ${MUSHAF_PAGES - progress.n} бет қалды`, tone: pos ? "good" : "mute" },
    { title: "Хифз: қазіргі сүре", value: current?.surah ?? "—", sub: current ? `${current.days} күн` : "Әлі жазба жоқ", tone: current ? "plain" : "mute" },
  ];
  return (
    <Panel title="Құран" span="s5" phoneShut>
      <div className="flex flex-col gap-3">
        <KpiGrid items={kpis} />
        {path.length > 1 && (
          <ExtraList title="Хифз жолы" items={[{ a: path.map((p) => `${p.surah} ${p.days} к.`).join(" → "), b: "" }]} />
        )}
        <Link href="/quran" className="btn btn-secondary self-start text-sm font-medium" style={{ borderRadius: 6 }}>
          Құран бетіне өту →
        </Link>
      </div>
    </Panel>
  );
}
