"use client";

import { dayLabel, MONTHS_SHORT } from "@/lib/dates";
import { FIELDS, TONE_STYLE, optionFor, type DayField } from "@/lib/fields";
import { useMarks } from "./day-editor";

/** 12 months × 31 days for one field; every real day is a button that opens the day editor. */
export function YearCalendar({ year, field }: { year: string; field: DayField }) {
  const { today, marks, edit } = useMarks();
  const y = Number(year);
  return (
    <div className="overflow-x-auto">
      <table className="year-cal">
        <thead>
          <tr>
            <th scope="col" />
            {Array.from({ length: 31 }, (_, i) => (
              <th key={i} scope="col">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MONTHS_SHORT.map((label, m) => {
            const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
            return (
              <tr key={label}>
                <th scope="row">{label}</th>
                {Array.from({ length: 31 }, (_, i) => {
                  const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                  if (i >= len || date > today) return <td key={i} />;
                  const o = optionFor(field, marks[date]?.[field]);
                  const s = TONE_STYLE[o?.tone ?? "none"];
                  return (
                    <td key={i}>
                      <button
                        type="button"
                        className="cal-cell"
                        style={{ background: s.bg, color: s.ink, border: o ? undefined : "1px solid #d3d7de" }}
                        aria-label={`${FIELDS[field].name}, ${dayLabel(date, today)}: ${o ? o.label.toLowerCase() : "белгіленбеген"}. Өзгерту үшін бас`}
                        title={`${dayLabel(date, today)}: ${o ? o.label.toLowerCase() : "белгіленбеген"}`}
                        onClick={() => edit(date, field)}
                      >
                        {s.mark}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
