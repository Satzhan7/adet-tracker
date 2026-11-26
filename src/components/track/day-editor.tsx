"use client";

import { createContext, use, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { setDayStatus } from "@/app/(app)/track-actions";
import { addDays, dayLabel } from "@/lib/dates";
import { FIELDS, TONE_DOT, optionFor, type DayField } from "@/lib/fields";

export type DayValues = Partial<Record<DayField, string | null>>;
type Marks = Record<string, DayValues>;

type Ctx = {
  today: string;
  selected: string;
  select: (date: string) => void;
  marks: Marks;
  edit: (date: string, field: DayField) => void;
};

const DayEditorContext = createContext<Ctx | null>(null);

function useDayEditor() {
  const ctx = use(DayEditorContext);
  if (!ctx) throw new Error("DayEditor components must sit inside <DayEditor>");
  return ctx;
}

/**
 * Owns the marks shown on a section page and the one dialog that changes them.
 * Both the day picker and the grid open it, for any day up to today; saves are optimistic.
 */
export function DayEditor({ today, marks: initial, children }: { today: string; marks: Marks; children: React.ReactNode }) {
  const [marks, setOptimistic] = useOptimistic(initial, (s, p: { date: string; field: DayField; value: string | null }) => ({
    ...s,
    [p.date]: { ...s[p.date], [p.field]: p.value },
  }));
  const [selected, setSelected] = useState(today);
  const [target, setTarget] = useState<{ date: string; field: DayField } | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (target && !d.open) d.showModal();
    if (!target && d.open) d.close();
  }, [target]);

  function edit(date: string, field: DayField) {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setError(undefined);
    setTarget({ date, field });
  }

  function choose(value: string | null) {
    if (!target) return;
    const { date, field } = target;
    setTarget(null);
    startTransition(async () => {
      setOptimistic({ date, field, value });
      const res = await setDayStatus(date, field, value);
      if (!res.ok) setError(`${dayLabel(date)}, ${FIELDS[field].name}: ${res.error}`);
    });
  }

  const current = target ? marks[target.date]?.[target.field] : null;
  const def = target ? FIELDS[target.field] : null;

  return (
    <DayEditorContext value={{ today, selected, select: setSelected, marks, edit }}>
      {error && (
        <p role="alert" className="save-error">
          ✕ {error}
        </p>
      )}
      {children}
      <dialog
        ref={dialogRef}
        className="pick-dialog"
        aria-label={def ? `${def.name}, ${dayLabel(target!.date)}` : undefined}
        onClose={() => {
          setTarget(null);
          triggerRef.current?.focus();
        }}
        onClick={(e) => e.target === e.currentTarget && setTarget(null)}
      >
        {def && target && (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex flex-col">
                <span className="text-[17px] font-extrabold text-[#1b253b]">{def.name}</span>
                <span className="text-[13px] text-[#4d4d4d]">
                  {target.date === today ? "Бүгін, " : ""}
                  {dayLabel(target.date)}
                </span>
              </span>
              <button type="button" className="pick-close" onClick={() => setTarget(null)} aria-label="Жабу">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {def.options.map((o) => {
              const on = current === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  className="pick-option"
                  aria-pressed={on}
                  style={on ? { borderColor: TONE_DOT[o.tone] } : undefined}
                  onClick={() => choose(o.value)}
                >
                  <span aria-hidden="true" className="pick-dot" style={{ background: TONE_DOT[o.tone] }} />
                  {o.label}
                </button>
              );
            })}
            {current && (
              <button type="button" className="pick-clear" onClick={() => choose(null)}>
                Белгіні алып тастау
              </button>
            )}
          </div>
        )}
      </dialog>
    </DayEditorContext>
  );
}

/** Date switcher (‹ today › and a calendar) plus one circle per field for the selected day. */
export function DayPicker({ fields }: { fields: DayField[] }) {
  const { today, selected, select, marks, edit } = useDayEditor();
  const values = marks[selected] ?? {};
  const markedCount = fields.filter((f) => values[f]).length;
  const isToday = selected === today;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="date-switch" role="group" aria-label="Күнді таңдау">
        <button type="button" className="date-step" onClick={() => select(addDays(selected, -1))} aria-label="Алдыңғы күн">
          ‹
        </button>
        <label className="date-field">
          <span className="sr-only">Күн</span>
          <input
            type="date"
            value={selected}
            max={today}
            onChange={(e) => e.target.value && select(e.target.value > today ? today : e.target.value)}
          />
        </label>
        <button
          type="button"
          className="date-step"
          onClick={() => select(addDays(selected, 1))}
          disabled={isToday}
          aria-label="Келесі күн"
        >
          ›
        </button>
        {!isToday && (
          <button type="button" className="btn-seg" onClick={() => select(today)}>
            Бүгін
          </button>
        )}
      </div>
      <span className="text-[13px] font-bold text-[var(--tile-value)]">
        {isToday ? "Бүгін, " : ""}
        {dayLabel(selected)}
      </span>
      <div className="today-grid">
        {fields.map((f) => {
          const o = optionFor(f, values[f]);
          return (
            <button
              key={f}
              type="button"
              className="today-item"
              aria-haspopup="dialog"
              aria-label={`${FIELDS[f].name}, ${dayLabel(selected)}: ${o ? o.label : "белгіленбеген"}. Таңдау үшін бас`}
              onClick={() => edit(selected, f)}
            >
              <span aria-hidden="true" className="today-dot" style={o ? { background: TONE_DOT[o.tone], borderStyle: "none" } : undefined} />
              <span className="today-name">{FIELDS[f].name}</span>
              <span className="today-status">{o ? o.label : "белгіленбеген"}</span>
            </button>
          );
        })}
      </div>
      <span className="text-[13px] text-[var(--panel-ink)]">
        {markedCount} / {fields.length} белгіленді — өзгерту үшін шеңберді немесе кестедегі ұяшықты бас
      </span>
    </div>
  );
}

/** Reads marks from the editor so grid cells change the moment a value is picked. */
export function useMarks() {
  return useDayEditor();
}
