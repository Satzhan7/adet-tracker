"use client";

import { dayLabel, MONTHS_SHORT } from "@/lib/dates";
import { FIELDS, TONE_STYLE, optionFor, type DayField } from "@/lib/fields";
import { useMarks } from "./day-editor";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * 12 months × 31 day slots for one field. Every slot is the same square whatever its state
 * (marked, unmarked, future, or a day the month does not have), so marking never moves anything.
 * Real past days are buttons that open the day editor.
 */
export function YearCalendar({ year, field }: { year: string; field: DayField }) {
  const { today, marks, edit } = useMarks();
  const y = Number(year);
  return (
    <div className="overflow-x-auto">
      <div className="year-cal" role="grid" aria-label={`${FIELDS[field].name} — ${year}`}>
        <div className="year-cal-row" role="row">
          <span className="year-cal-month" role="columnheader" />
          {DAYS.map((d) => (
            <span key={d} className="year-cal-day" role="columnheader">
              {d}
            </span>
          ))}
        </div>
        {MONTHS_SHORT.map((label, m) => {
          const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
          return (
            <div key={label} className="year-cal-row" role="row">
              <span className="year-cal-month" role="rowheader">
                {label}
              </span>
              {DAYS.map((d) => {
                if (d > len) return <span key={d} className="cal-slot is-none" aria-hidden="true" />;
                const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                if (date > today) return <span key={d} className="cal-slot is-future" aria-hidden="true" />;
                const o = optionFor(field, marks[date]?.[field]);
                const s = TONE_STYLE[o?.tone ?? "none"];
                const text = `${dayLabel(date, today)}: ${o ? o.label.toLowerCase() : "белгіленбеген"}`;
                return (
                  <button
                    key={d}
                    type="button"
                    role="gridcell"
                    className={o ? "cal-slot cal-cell" : "cal-slot cal-cell is-empty"}
                    style={o ? { background: s.bg, color: s.ink } : undefined}
                    aria-label={`${FIELDS[field].name}, ${text}. Өзгерту үшін бас`}
                    title={text}
                    onClick={() => edit(date, field)}
                  >
                    {s.mark}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
