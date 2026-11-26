"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { setDayStatus } from "@/app/(app)/track-actions";
import { FIELDS, TONE_DOT, optionFor, type DayField } from "@/lib/fields";

/**
 * "Бүгін" block: one circle per mark; tapping opens a dialog with the allowed values.
 * Saves straight to `days` and shows the choice immediately (optimistic), rolling back on error.
 */
export function TodayPicker({
  date,
  fields,
  values,
}: {
  date: string;
  fields: DayField[];
  values: Partial<Record<DayField, string | null>>;
}) {
  const [current, setOptimistic] = useOptimistic(values, (s, p: { field: DayField; value: string | null }) => ({
    ...s,
    [p.field]: p.value,
  }));
  const [open, setOpen] = useState<DayField | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function choose(field: DayField, value: string | null) {
    setOpen(null);
    setError(undefined);
    startTransition(async () => {
      setOptimistic({ field, value });
      const res = await setDayStatus(date, field, value);
      if (!res.ok) setError(res.error);
    });
  }

  const markedCount = fields.filter((f) => current[f]).length;
  const def = open ? FIELDS[open] : null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="today-grid">
        {fields.map((f) => {
          const o = optionFor(f, current[f]);
          return (
            <button
              key={f}
              type="button"
              className="today-item"
              aria-haspopup="dialog"
              aria-label={`${FIELDS[f].name}: ${o ? o.label : "белгіленбеген"}. Таңдау үшін бас`}
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setOpen(f);
              }}
            >
              <span aria-hidden="true" className="today-dot" style={o ? { background: TONE_DOT[o.tone], borderStyle: "none" } : undefined} />
              <span className="today-name">{FIELDS[f].name}</span>
              <span className="today-status">{o ? o.label : "белгіленбеген"}</span>
            </button>
          );
        })}
      </div>
      <span className="text-[13px] text-[var(--panel-ink)]">
        {markedCount} / {fields.length} белгіленді · белгілеу үшін шеңберді бас
      </span>
      {error && (
        <span role="alert" className="text-[13px] font-semibold text-[#be0a0a]">
          ✕ {error}
        </span>
      )}

      <dialog
        ref={dialogRef}
        className="pick-dialog"
        aria-label={def?.name}
        onClose={() => {
          setOpen(null);
          triggerRef.current?.focus();
        }}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
      >
        {def && open && (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[17px] font-extrabold text-[#1b253b]">{def.name}</span>
              <button type="button" className="pick-close" onClick={() => setOpen(null)} aria-label="Жабу">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {def.options.map((o) => {
              const on = current[open] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  className="pick-option"
                  aria-pressed={on}
                  style={on ? { borderColor: TONE_DOT[o.tone] } : undefined}
                  onClick={() => choose(open, o.value)}
                >
                  <span aria-hidden="true" className="pick-dot" style={{ background: TONE_DOT[o.tone] }} />
                  {o.label}
                </button>
              );
            })}
            {current[open] && (
              <button type="button" className="pick-clear" onClick={() => choose(open, null)}>
                Белгіні алып тастау
              </button>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
