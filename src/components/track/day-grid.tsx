"use client";

import { useState } from "react";
import { TONE_STYLE, type Tone } from "@/lib/fields";

export type GridCell = { tone: Tone | null; tip: string };
export type GridRow = { name: string; cells: GridCell[] };
export type LegendItem = { label: string; tone: Tone | "none" };

const PERIODS = [
  [7, "7 күн"],
  [10, "10 күн"],
  [14, "2 апта"],
  [30, "1 ай"],
] as const;

/**
 * Last-N-days grid with 7/10/14/30 chips. Server passes the last 30 days;
 * the chips only slice them, so switching needs no request.
 */
export function DayGrid({
  dayNumbers,
  rows,
  legend,
  initial = 14,
}: {
  dayNumbers: string[];
  rows: GridRow[];
  legend: LegendItem[];
  initial?: 7 | 10 | 14 | 30;
}) {
  const [per, setPer] = useState<number>(initial);
  const start = Math.max(0, dayNumbers.length - per);
  const cols = `minmax(96px, max-content) repeat(${per}, minmax(${per > 14 ? 22 : 30}px, 1fr))`;
  const gap = per > 14 ? 3 : 4;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Кезеңді таңдау" className="flex flex-wrap gap-1.5">
        {PERIODS.map(([n, label]) => (
          <button key={n} type="button" className="btn-seg" aria-pressed={per === n} onClick={() => setPer(n)}>
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="grid-table" style={{ minWidth: per > 14 ? 900 : 560 }}>
          <div className="grid-head" style={{ gridTemplateColumns: cols, gap }}>
            <span />
            {dayNumbers.slice(start).map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.name} className="grid-row" style={{ gridTemplateColumns: cols, gap }}>
              <span className="grid-name">{row.name}</span>
              {row.cells.slice(start).map((c, i) => {
                const s = TONE_STYLE[c.tone ?? "none"];
                return (
                  <span
                    key={i}
                    role="img"
                    aria-label={c.tip}
                    title={c.tip}
                    className="grid-cell"
                    style={{ background: s.bg, color: s.ink, border: c.tone ? undefined : "1px solid #c4c8cf" }}
                  >
                    {s.mark}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Legend items={legend} />
    </div>
  );
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-[13px] text-[var(--panel-ink)]">
      {items.map((l) => {
        const s = TONE_STYLE[l.tone];
        return (
          <span key={l.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="legend-swatch"
              style={{ background: s.bg, color: s.ink, border: l.tone === "none" ? "1px solid #8e8e93" : undefined }}
            >
              {s.mark}
            </span>
            {l.label}
          </span>
        );
      })}
    </div>
  );
}
