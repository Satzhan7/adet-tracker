"use client";

import { useState } from "react";
import { dayLabel, lastDays, parts } from "@/lib/dates";
import { FIELDS, TONE_STYLE, optionFor, type DayField, type Tone } from "@/lib/fields";
import { useMarks } from "./day-editor";

export type LegendItem = { label: string; tone: Tone | "none" };

/** Row labels that would not fit the fixed label column. */
const SHORT_NAMES: Partial<Record<DayField, string>> = { wird_taha: "Тоһа", wird_amana: "Әмәнәр расул" };

const PERIODS = [
  [7, "7 күн"],
  [10, "10 күн"],
  [14, "2 апта"],
  [30, "1 ай"],
] as const;

/**
 * Last-N-days grid with 7/10/14/30 chips. Every cell is a button that opens the
 * day editor for that day and field, so past days can be marked or corrected here.
 */
export function DayGrid({ fields, legend, initial = 14 }: { fields: DayField[]; legend: LegendItem[]; initial?: 7 | 10 | 14 | 30 }) {
  const { today } = useMarks();
  const [per, setPer] = useState<number>(initial);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Кезеңді таңдау" className="flex flex-wrap gap-1.5">
        {PERIODS.map(([n, label]) => (
          <button key={n} type="button" className="btn-seg" aria-pressed={per === n} onClick={() => setPer(n)}>
            {label}
          </button>
        ))}
      </div>
      <GridTable dates={lastDays(today, per)} fields={fields} />
      <Legend items={legend} />
    </div>
  );
}

/**
 * Fields × dates table. Cells open the day editor; future dates render as empty, disabled cells.
 * `head` can replace the plain day number (the month view puts a note button there).
 */
export function GridTable({
  dates,
  fields,
  head,
}: {
  dates: string[];
  fields: DayField[];
  head?: (date: string) => React.ReactNode;
}) {
  const { today, marks, edit } = useMarks();
  const n = dates.length;
  // Every row is its own grid, so the label column must be a fixed width or rows with long
  // names shift their cells (SPEC: label column 132px in sections).
  const cols = `var(--grid-label-w) repeat(${n}, minmax(${n > 14 ? 24 : 30}px, 1fr))`;
  const gap = n > 14 ? 3 : 4;

  return (
    <div className="overflow-x-auto">
      <div className="grid-table" style={{ minWidth: n > 14 ? Math.max(900, 132 + n * 27) : 560 }}>
        <div className="grid-head" style={{ gridTemplateColumns: cols, gap }}>
          <span />
          {dates.map((d) =>
            head ? (
              <span key={d}>{head(d)}</span>
            ) : (
              <span key={d} className={d === today ? "font-extrabold" : undefined}>
                {parts(d).d}
              </span>
            ),
          )}
        </div>
        {fields.map((f) => (
          <div key={f} className="grid-row" style={{ gridTemplateColumns: cols, gap }}>
            <span className="grid-name" title={FIELDS[f].name}>
              {SHORT_NAMES[f] ?? FIELDS[f].name}
            </span>
            {dates.map((date) => {
              if (date > today) return <span key={date} className="grid-cell grid-cell-future" aria-hidden="true" />;
              const o = optionFor(f, marks[date]?.[f]);
              const s = TONE_STYLE[o?.tone ?? "none"];
              return (
                <button
                  key={date}
                  type="button"
                  className="grid-cell"
                  aria-haspopup="dialog"
                  aria-label={`${FIELDS[f].name}, ${dayLabel(date, today)}: ${o ? o.label.toLowerCase() : "белгіленбеген"}. Өзгерту үшін бас`}
                  title={`${dayLabel(date, today)}: ${o ? o.label.toLowerCase() : "белгіленбеген"}`}
                  style={{ background: s.bg, color: s.ink, border: o ? undefined : "1px solid #c4c8cf" }}
                  onClick={() => edit(date, f)}
                >
                  {s.mark}
                </button>
              );
            })}
          </div>
        ))}
      </div>
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
