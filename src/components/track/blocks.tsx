/** Presentational blocks shared by the section pages (server-renderable). */

export type KpiTone = "good" | "bad" | "mute" | "plain";
export type Kpi = { title: string; value: string; sub?: string; tone?: KpiTone };

export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="kpis">
      {items.map((k) => (
        <div key={k.title} className="tile tile-bar">
          <span className="tile-label">{k.title}</span>
          <span className={`tile-value tone-${k.tone ?? "plain"}`}>{k.value}</span>
          {k.sub && <span className="tile-note">{k.sub}</span>}
        </div>
      ))}
    </div>
  );
}

export function ExtraList({ title, items }: { title: string; items: { a: string; b: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="extra">
      <span className="tile-label">{title}</span>
      {items.map((x) => (
        <div key={x.a} className="extra-row">
          <span>{x.a}</span>
          <span className="font-bold whitespace-nowrap">{x.b}</span>
        </div>
      ))}
    </div>
  );
}

export type Series = { name: string; color: string; unit: "%" | string; values: (number | null)[] };

export function fmtValue(s: Series, v: number | null) {
  if (v === null) return "—";
  return s.unit === "%" ? `${v.toFixed(2)}%` : `${v} ${s.unit}`;
}

/** Monthly bars (canvas trend): one column per label, one bar per series, 200px tall at `max`. */
export function TrendChart({ labels, series, max }: { labels: string[]; series: Series[]; max: number }) {
  const single = series.length === 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="trend-box">
        <div
          className="trend-grid"
          style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`, minWidth: labels.length > 6 ? 560 : 280 }}
        >
          {labels.map((label, i) => (
            <div key={label + i} className="trend-col">
              <div className="trend-bars">
                {series.map((s) => {
                  const v = s.values[i];
                  const h = v === null ? 0 : Math.max(2, Math.round((200 * v) / (max || 1)));
                  return (
                    <div
                      key={s.name}
                      title={`${label} · ${s.name}: ${fmtValue(s, v)}`}
                      className="trend-bar"
                      style={{ height: h, background: s.color, width: single ? "60%" : "40%" }}
                    />
                  );
                })}
              </div>
              <span className="trend-val">{single ? fmtValue(series[0], series[0].values[i]) : ""}</span>
              <span className="trend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-[13px] text-[var(--panel-ink)]">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="legend-swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export type BestWorstItem = { name: string; best: string; worst: string } | { name: string; empty: string };

export function BestWorst({ items, note }: { items: BestWorstItem[]; note?: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((bw) => (
        <div key={bw.name} className="extra">
          <span className="tile-label">{bw.name}</span>
          {"empty" in bw ? (
            <span className="text-sm">{bw.empty}</span>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#197d19]">Ең жақсы</span>
                <span className="text-lg font-extrabold whitespace-nowrap text-[#197d19]">{bw.best}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#be0a0a]">Ең нашар</span>
                <span className="text-lg font-extrabold whitespace-nowrap text-[#be0a0a]">{bw.worst}</span>
              </div>
            </div>
          )}
        </div>
      ))}
      {note && <span className="text-[13px]">{note}</span>}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[15px] leading-normal">{children}</p>;
}
