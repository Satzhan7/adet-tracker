"use client";

import { useState } from "react";

/** Period + format chips and a download link to /reports/export. */
export function ExportPanel({ years, counts, today }: { years: string[]; counts: Record<string, number>; today: string }) {
  const [year, setYear] = useState(years.at(-1) ?? "all");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const name = `adet-tracker-${year}-${today}.${format}`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="tile-label">Кезең</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Кезең">
          {[...years, "all"].map((y) => (
            <button key={y} type="button" className="btn-seg" aria-pressed={year === y} onClick={() => setYear(y)}>
              {y === "all" ? "Барлығы" : y}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="tile-label">Формат</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Формат">
          <button type="button" className="btn-seg" aria-pressed={format === "xlsx"} onClick={() => setFormat("xlsx")}>
            Excel (.xlsx)
          </button>
          <button type="button" className="btn-seg" aria-pressed={format === "csv"} onClick={() => setFormat("csv")}>
            CSV
          </button>
        </div>
        <span className="text-[13px] text-[var(--panel-ink)]">
          {format === "xlsx"
            ? "Шаблон форматы: «Күнделік» (ашылмалы тізімдермен), «Ай қорытындысы», «Тізімдер». Қайта импорттауға болады."
            : "«Күнделік» бағандары, UTF-8. Excel, Google Sheets ашады; қайта импорттауға болады."}
        </span>
      </div>
      <a className="btn btn-primary self-start" href={`/reports/export?format=${format}&year=${year}`} download={name}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
        </svg>
        Жүктеп алу
      </a>
      <span className="text-[13px] text-[var(--panel-ink)]">
        {name} — {counts[year] ?? 0} күн
      </span>
    </div>
  );
}
