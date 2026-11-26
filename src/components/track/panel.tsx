"use client";

import { useId, useState } from "react";

export type Span = "s4" | "s5" | "s7" | "s8" | "s12";

/**
 * Canvas v2 section: orange header over a light body, placed on the 12-column grid.
 * On phones (≤720px) the header gets a collapse button; `phoneShut` starts it collapsed there.
 */
export function Panel({
  title,
  span = "s12",
  phoneShut = false,
  children,
}: {
  title: React.ReactNode;
  span?: Span;
  phoneShut?: boolean;
  children: React.ReactNode;
}) {
  const [shut, setShut] = useState(phoneShut);
  const id = useId();
  return (
    <section className={`panel ${span}`} aria-labelledby={`${id}-t`}>
      <h2 className="panel-head">
        <span id={`${id}-t`}>{title}</span>
        <button
          type="button"
          className="panel-toggle"
          onClick={() => setShut((s) => !s)}
          aria-expanded={!shut}
          aria-controls={`${id}-b`}
          aria-label={shut ? "Ашу" : "Жабу"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={shut ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
          </svg>
        </button>
      </h2>
      <div id={`${id}-b`} className={shut ? "panel-pad shut" : "panel-pad"}>
        {children}
      </div>
    </section>
  );
}
