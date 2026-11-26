import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Panel } from "@/components/track/panel";
import { ImportPanel } from "@/components/track/import-panel";
import { ExportPanel } from "@/components/track/export-panel";
import { loadDays, loadImports, loadMonthStats, loadNotes } from "@/lib/data";
import { MONTHS } from "@/lib/dates";
import { COLUMNS } from "@/lib/sheet-format";
import { FIELDS, type DayField } from "@/lib/fields";

export const metadata: Metadata = { title: "Есептер — Әдет трекер" };

const FORMAT_HINTS: Record<string, string> = {
  date: "ЖЖЖЖ-АА-КК немесе КК.АА.ЖЖЖЖ",
  hifz_surah: "Сүре атауы",
  hifz_reps: "0–100",
  khatm_from: "1–604",
  khatm_to: "1–604",
  khatm_pages: "Басы мен соңы болса — өзі есептеледі",
  note: "Еркін мәтін, 2000 таңбаға дейін",
};

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <>
      <PageHeader title="Есептер" subtitle="Деректерді файлмен жүктеу және сақтап алу" />
      <Suspense fallback={<p className="text-sm">Жүктелуде…</p>}>
        <ReportsBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReportsBody({ searchParams }: Pick<PageProps<"/reports">, "searchParams">) {
  const sp = await searchParams;
  const [{ today, days }, notes, stats, imports] = await Promise.all([loadDays(), loadNotes(), loadMonthStats(), loadImports()]);
  const dates = new Set([...days.map((d) => d.date), ...notes.map((n) => n.date)]);
  const years = [...new Set([...dates].map((d) => d.slice(0, 4)))].sort();
  const counts: Record<string, number> = { all: dates.size };
  for (const y of years) counts[y] = [...dates].filter((d) => d.startsWith(y)).length;
  const year = typeof sp.year === "string" && years.includes(sp.year) ? sp.year : (years.at(-1) ?? today.slice(0, 4));
  const yearStats = stats.filter((s) => s.month.startsWith(year));
  const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

  return (
    <div className="g12">
      <Panel title="Деректерді жүктеу — импорт" span="s7">
        <ImportPanel today={today} />
      </Panel>
      <Panel title="Деректерді алу — экспорт" span="s5">
        <ExportPanel years={years} counts={counts} today={today} />
      </Panel>

      <Panel title={`Жылдық қорытынды — ${year}`} span="s12" phoneShut>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Жыл">
            {years.map((y) => (
              <Link key={y} href={`/reports?year=${y}`} className="btn-seg tab-link" aria-current={y === year ? "page" : undefined}>
                {y}
              </Link>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Ай</th>
                  <th scope="col">Парыз уақытында</th>
                  <th scope="col">Қаза — өтелді</th>
                  <th scope="col">Таңғы зікір</th>
                  <th scope="col">Кешкі зікір</th>
                  <th scope="col">Креатин</th>
                  <th scope="col">Ораза</th>
                </tr>
              </thead>
              <tbody>
                {yearStats.map((s) => (
                  <tr key={s.month}>
                    <th scope="row">
                      <Link href={`/month?y=${s.month.slice(0, 4)}&m=${Number(s.month.slice(5))}`}>{MONTHS[Number(s.month.slice(5)) - 1]}</Link>
                    </th>
                    <td>{pct(s.fard_on_time_pct)}</td>
                    <td>{s.fard_missed} — {s.fard_made_up}</td>
                    <td>{pct(s.dhikr_morning_pct)}</td>
                    <td>{pct(s.dhikr_evening_pct)}</td>
                    <td>{pct(s.creatine_pct)}</td>
                    <td>{s.fasted || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <Panel title="Файл форматы — «Күнделік» парағы" span="s7" phoneShut>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Баған</th>
                <th scope="col">Не жазылады</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((c) => (
                <tr key={c.key}>
                  <th scope="row">{c.header}</th>
                  <td>
                    {c.key in FIELDS
                      ? FIELDS[c.key as DayField].options.map((o) => o.value).join(" — ")
                      : FORMAT_HINTS[c.key]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Импорт тарихы" span="s5" phoneShut>
        {imports.length === 0 ? (
          <p className="m-0 text-[15px]">Әлі импорт болған жоқ.</p>
        ) : (
          <ul className="entry-list">
            {imports.map((i) => (
              <li key={i.id}>
                <span className="flex min-w-0 flex-col py-2">
                  <strong className="truncate">{i.file_name}</strong>
                  <small>
                    {new Date(i.created_at).toLocaleString("kk-KZ", { timeZone: "Asia/Almaty", dateStyle: "medium", timeStyle: "short" })} — {i.rows_ok} жол
                    {i.rows_err ? ` — ${i.rows_err} қате` : ""}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
