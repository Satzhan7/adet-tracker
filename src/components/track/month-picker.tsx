"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MONTHS } from "@/lib/dates";

/** «‹ Қараша 2026 ›» with a popover of years and months; future months are disabled. `keep` is carried along (e.g. "&analysis=1"). */
export function MonthPicker({
  year,
  month,
  firstYear,
  today,
  keep = "",
}: {
  year: number;
  month: number;
  firstYear: number;
  today: string;
  keep?: string;
}) {
  const href = (y: number, m: number) => `/month?y=${y}&m=${m}${keep}`;
  const [open, setOpen] = useState(false);
  const [pickYear, setPickYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);
  const ty = Number(today.slice(0, 4));
  const tm = Number(today.slice(5, 7));
  const prev = month === 1 ? [year - 1, 12] : [year, month - 1];
  const next = month === 12 ? [year + 1, 1] : [year, month + 1];
  const hasNext = next[0] < ty || (next[0] === ty && next[1] <= tm);
  const hasPrev = prev[0] >= firstYear;
  const years = Array.from({ length: ty - firstYear + 1 }, (_, i) => firstYear + i);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="month-picker">
      {hasPrev ? (
        <Link href={href(prev[0], prev[1])} className="date-step month-step" aria-label="Алдыңғы ай">
          ‹
        </Link>
      ) : (
        <span className="date-step month-step" aria-hidden="true" />
      )}
      <button
        type="button"
        className="btn-seg month-current"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setPickYear(year);
          setOpen((o) => !o);
        }}
      >
        {MONTHS[month - 1]} {year}
      </button>
      {hasNext ? (
        <Link href={href(next[0], next[1])} className="date-step month-step" aria-label="Келесі ай">
          ›
        </Link>
      ) : (
        <span className="date-step month-step" aria-hidden="true" />
      )}
      {open && (
        <div className="month-pop" role="dialog" aria-label="Айды таңдау">
          <span className="tile-label">Жыл</span>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button key={y} type="button" className="btn-seg" aria-pressed={y === pickYear} onClick={() => setPickYear(y)}>
                {y}
              </button>
            ))}
          </div>
          <span className="tile-label">Ай</span>
          <div className="month-pop-grid">
            {MONTHS.map((name, i) => {
              const future = pickYear > ty || (pickYear === ty && i + 1 > tm);
              const current = pickYear === year && i + 1 === month;
              return future ? (
                <span key={name} className="btn-seg month-pop-btn" aria-disabled="true">
                  {name}
                </span>
              ) : (
                <Link
                  key={name}
                  href={href(pickYear, i + 1)}
                  className="btn-seg tab-link month-pop-btn"
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
