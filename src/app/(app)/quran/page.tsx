import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { TodayPicker } from "@/components/track/today-picker";
import { DayGrid } from "@/components/track/day-grid";
import { BestWorst, EmptyNote, ExtraList, KpiGrid, TrendChart, type Kpi } from "@/components/track/blocks";
import { DeleteEntry, HifzForm, KhatmForm } from "@/components/track/quran-forms";
import { loadDays, loadQuranLogs, type HifzEntry, type KhatmEntry } from "@/lib/data";
import { dayLabel, monthKey, prevMonthKey, startOfYear } from "@/lib/dates";
import type { DayRow } from "@/lib/fields";
import { currentPage, hifzPath, isWirdMarked, pagesBetween, wirdDays } from "@/lib/quran";
import { bestWorstMonth, fmtPct, khatmProgress, MUSHAF_PAGES, ratio } from "@/lib/stats";
import { gridFor, indexByDate, monthLabel, rowsInMonth, yearMonths } from "@/lib/views";

export const metadata: Metadata = { title: "Құран · Әдет трекер" };

const TABS = [
  { key: "hatm", label: "Хатм" },
  { key: "hifz", label: "Хифз" },
  { key: "wird", label: "Уирд" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function QuranPage({ searchParams }: PageProps<"/quran">) {
  return (
    <Suspense fallback={<PageHeader title="Құран" subtitle="Жүктелуде…" />}>
      <QuranBody searchParams={searchParams} />
    </Suspense>
  );
}

async function QuranBody({ searchParams }: Pick<PageProps<"/quran">, "searchParams">) {
  const { tab: raw } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === raw) ? (raw as Tab) : "hatm";
  const [{ today, days }, logs] = await Promise.all([loadDays(), loadQuranLogs()]);

  const subtitles: Record<Tab, string> = {
    hatm: "Жеке хатм: оқылған беттер",
    hifz: "Хифз: жатталып жатқан сүрелер",
    wird: "Тоһа (таңда) және Әмәнәр расул (шамнан кейін)",
  };

  return (
    <>
      <PageHeader
        title="Құран"
        subtitle={subtitles[tab]}
        actions={TABS.map((t) => (
          <Link key={t.key} href={`/quran?tab=${t.key}`} className="btn-seg tab-link" aria-current={t.key === tab ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      />
      {tab === "hatm" && <Hatm today={today} log={logs.khatm} />}
      {tab === "hifz" && <Hifz today={today} log={logs.hifz} />}
      {tab === "wird" && <Wird today={today} days={days} />}
    </>
  );
}

function Hatm({ today, log }: { today: string; log: KhatmEntry[] }) {
  const total = log.reduce((s, e) => s + e.pages, 0);
  const progress = khatmProgress(total);
  const yearStart = startOfYear(today);
  const yearPages = pagesBetween(log, yearStart, today);
  const yearDays = new Set(log.filter((e) => e.date >= yearStart).map((e) => e.date)).size;
  const months = yearMonths([], today).map((m) => ({ ...m, pages: pagesBetween(log, `${m.key}-01`, `${m.key}-31`) }));
  const activeMonths = months.filter((m) => m.pages > 0);
  const last = log.at(-1);
  const pos = currentPage(log);
  const todays = log.filter((e) => e.date === today);

  const kpis: Kpi[] = [
    {
      title: "Жеке хатм",
      value: `${progress.n} / ${MUSHAF_PAGES}`,
      sub: `${fmtPct(progress)} · ${MUSHAF_PAGES - progress.n} бет қалды`,
      tone: total ? "good" : "mute",
    },
    { title: `${today.slice(0, 4)} жылы оқылды`, value: `${yearPages} бет`, sub: `${yearDays} күн оқылған`, tone: yearPages ? "plain" : "mute" },
    {
      title: "Айына орташа",
      value: activeMonths.length ? `${(yearPages / months.length).toFixed(2)} бет` : "—",
      sub: `${monthLabel(months[0].key)}–${monthLabel(months.at(-1)!.key).toLowerCase()}, ${months.length} ай`,
    },
    {
      title: "Соңғы оқу",
      value: last ? dayLabel(last.date) : "—",
      sub: last ? `${last.pages} бет` : "Әлі жазба жоқ",
      tone: !last ? "mute" : last.date === today ? "good" : "plain",
    },
  ];

  const max = Math.max(10, ...months.map((m) => m.pages));
  const bw = activeMonths.length
    ? [...months].sort((a, b) => a.pages - b.pages || a.key.localeCompare(b.key))
    : null;

  return (
    <div className="g12">
      <Panel title={`Бүгін · ${dayLabel(today)}`} span="s5">
        <div className="flex flex-col gap-3">
          <KhatmForm date={today} nextPage={pos ? Math.min(MUSHAF_PAGES, pos + 1) : null} />
          {todays.length > 0 && (
            <ul className="entry-list">
              {todays.map((e) => (
                <li key={e.id}>
                  <span>
                    {e.pages} бет{e.from_page ? ` · ${e.from_page}–${e.to_page}` : ""}
                  </span>
                  <DeleteEntry table="khatm_log" id={e.id} label={`${e.pages} бет`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
      <Panel title="Жеке хатм" span="s7">
        <div className="flex flex-col gap-3">
          <KpiGrid items={kpis} />
          <ExtraList title="Хатм жолы" items={pos ? [{ a: "Қазір", b: `${pos}-бет` }, { a: "Хатмға дейін", b: `${MUSHAF_PAGES - pos} бет` }] : []} />
        </div>
      </Panel>
      <Panel title={`Хатм, ${today.slice(0, 4)} · айына оқылған бет`} span="s8" phoneShut>
        <TrendChart
          labels={months.map((m) => m.label)}
          max={max}
          series={[{ name: "Оқылған бет", unit: "бет", color: "#197d19", values: months.map((m) => m.pages) }]}
        />
      </Panel>
      <Panel title="Ең жақсы және ең нашар ай" span="s4" phoneShut>
        <BestWorst
          items={[
            bw
              ? { name: "Хатм: айына бет", best: `${monthLabel(bw.at(-1)!.key)} · ${bw.at(-1)!.pages} бет`, worst: `${monthLabel(bw[0].key)} · ${bw[0].pages} бет` }
              : { name: "Хатм: айына бет", empty: "Бұл жылы әлі жазба жоқ." },
          ]}
          note={`${today.slice(0, 4)} жыл, ${monthLabel(months[0].key).toLowerCase()}–${monthLabel(monthKey(today)).toLowerCase()}.`}
        />
      </Panel>
    </div>
  );
}

function Hifz({ today, log }: { today: string; log: HifzEntry[] }) {
  const path = hifzPath(log);
  const current = path.at(-1) ?? null;
  const done = path.slice(0, -1);
  const full = ratio(log.filter((e) => e.repetitions >= 5).length, log.length);
  const recent = log.slice(-6).reverse();

  const kpis: Kpi[] = [
    { title: "Қазіргі сүре", value: current?.surah ?? "—", sub: current ? `${current.days} күн жатталуда` : "Әлі жазба жоқ", tone: current ? "plain" : "mute" },
    {
      title: "Жатталған",
      value: `${done.length} сүре`,
      sub: done.length ? done.map((p) => p.surah).join(", ") : "—",
      tone: done.length ? "good" : "mute",
    },
    { title: "Жазылған күн", value: String(log.length), sub: "Барлық хифз жазбасы", tone: log.length ? "plain" : "mute" },
    { title: "Толық 5 рет", value: `${full.n} / ${full.d}`, sub: `${fmtPct(full)} күн`, tone: full.pct === null ? "mute" : full.pct >= 80 ? "good" : "plain" },
  ];
  const fastest = [...done].sort((a, b) => a.days - b.days);

  return (
    <div className="g12">
      <Panel title={`Бүгін · ${dayLabel(today)}`} span="s5">
        <div className="flex flex-col gap-3">
          <HifzForm date={today} currentSurah={current?.surah ?? null} />
          {recent.length > 0 && (
            <ul className="entry-list" aria-label="Соңғы жазбалар">
              {recent.map((e) => (
                <li key={e.id}>
                  <span>
                    {e.date ? dayLabel(e.date) : "күні жоқ"} · {e.surah}, {e.repetitions} рет
                  </span>
                  <DeleteEntry table="hifz_log" id={e.id} label={`${e.surah}, ${e.repetitions} рет`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
      <Panel title="Хифз" span="s7">
        <div className="flex flex-col gap-3">
          <KpiGrid items={kpis} />
          <ExtraList
            title="Хифз жолы"
            items={path.map((p, i) => ({ a: p.surah, b: `${p.days} күн${i === path.length - 1 ? " · қазір" : ""}` }))}
          />
        </div>
      </Panel>
      <Panel title="Хифз · әр сүреге кеткен күн" span="s8" phoneShut>
        {path.length ? (
          <TrendChart
            labels={path.map((p) => p.surah)}
            max={Math.max(5, ...path.map((p) => p.days))}
            series={[{ name: "Күн саны", unit: "күн", color: "#7843e9", values: path.map((p) => p.days) }]}
          />
        ) : (
          <EmptyNote>Алғашқы жазбаны «Бүгін» блогынан қосыңыз.</EmptyNote>
        )}
      </Panel>
      <Panel title="Ең жылдам және ең ұзақ сүре" span="s4" phoneShut>
        <BestWorst
          items={[
            fastest.length
              ? { name: "Сүреге кеткен күн", best: `${fastest[0].surah} · ${fastest[0].days} күн`, worst: `${fastest.at(-1)!.surah} · ${fastest.at(-1)!.days} күн` }
              : { name: "Сүреге кеткен күн", empty: "Жатталып біткен сүре әлі жоқ." },
          ]}
          note="Қазіргі сүре әлі аяқталмағандықтан саналмайды."
        />
      </Panel>
    </div>
  );
}

function Wird({ today, days }: { today: string; days: DayRow[] }) {
  const todayRow = indexByDate(days).get(today) ?? {};
  const month = wirdDays(rowsInMonth(days, today));
  const prevKey = prevMonthKey(today);
  const prev = wirdDays(days.filter((d) => monthKey(d.date) === prevKey));
  const all = wirdDays(days);
  const months = yearMonths(days, today);
  const grid = gridFor(days, today, ["wird_taha", "wird_amana"]);
  const bw = bestWorstMonth(days.filter((d) => d.date.startsWith(today.slice(0, 4))), wirdDays, isWirdMarked);
  const tone = (p: number | null): Kpi["tone"] => (p === null ? "mute" : p >= 90 ? "good" : p < 60 ? "bad" : "plain");

  const kpis: Kpi[] = [
    { title: `${monthLabel(monthKey(today))}`, value: fmtPct(month), sub: `${month.n} / ${month.d} күн · ${month.partial} күн ішінара`, tone: tone(month.pct) },
    { title: `${monthLabel(prevKey)}`, value: fmtPct(prev), sub: `${prev.n} / ${prev.d} күн`, tone: tone(prev.pct) },
    { title: "Барлығы", value: fmtPct(all), sub: `${all.n} / ${all.d} белгіленген күн`, tone: tone(all.pct) },
  ];

  return (
    <div className="g12">
      <Panel title={`Бүгін · ${dayLabel(today)}`} span="s5">
        <TodayPicker date={today} fields={["wird_taha", "wird_amana"]} values={todayRow} />
      </Panel>
      <Panel title="Құран уирды" span="s7">
        <div className="flex flex-col gap-3">
          <KpiGrid items={kpis} />
          <ExtraList title="Қашан оқылады" items={[{ a: "Тоһа сүресі", b: "таңда" }, { a: "Әмәнәр расул", b: "шамнан кейін" }]} />
        </div>
      </Panel>
      <Panel title="Соңғы күндер" span="s12" phoneShut>
        <DayGrid
          dayNumbers={grid.dayNumbers}
          rows={grid.rows}
          legend={[
            { label: "Оқыдым", tone: "good" },
            { label: "Ішінара", tone: "partial" },
            { label: "Жоқ", tone: "bad" },
            { label: "Белгіленбеген", tone: "none" },
          ]}
        />
      </Panel>
      <Panel title={`Уирд, ${today.slice(0, 4)} · орындалған күндер %`} span="s8" phoneShut>
        <TrendChart
          labels={months.map((m) => m.label)}
          max={100}
          series={[{ name: "Орындалған күн", unit: "%", color: "#ff6a00", values: months.map((m) => wirdDays(m.rows).pct) }]}
        />
      </Panel>
      <Panel title="Ең жақсы және ең нашар ай" span="s4" phoneShut>
        <BestWorst
          items={[
            bw
              ? { name: "Уирд", best: `${monthLabel(bw.best.key)} · ${fmtPct(bw.best.r)}`, worst: `${monthLabel(bw.worst.key)} · ${fmtPct(bw.worst.r)}` }
              : { name: "Уирд", empty: "Кемі 10 белгіленген күні бар ай әлі жоқ." },
          ]}
          note="Күн орындалды деп саналады, егер белгіленген екі уирд те «оқыдым» болса."
        />
      </Panel>
    </div>
  );
}
