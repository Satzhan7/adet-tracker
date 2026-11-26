"use client";

import { useOptimistic, useState, useTransition } from "react";
import { saveNote } from "@/app/(app)/track-actions";
import { dayLabel, parts } from "@/lib/dates";
import type { DayField } from "@/lib/fields";
import { useMarks } from "./day-editor";
import { GridTable, Legend } from "./day-grid";
import { Panel } from "./panel";

const NOTE_MAX = 2000;

/**
 * Month table + day notes. Clicking a day number selects that day for the note editor;
 * a dot under the number means the day has a note.
 */
export function MonthBoard({
  dates,
  fields,
  notes: initial,
  title,
}: {
  dates: string[];
  fields: DayField[];
  notes: Record<string, string>;
  title: string;
}) {
  const { today } = useMarks();
  const [notes, setNotes] = useOptimistic(initial, (s, p: { date: string; text: string }) => {
    const next = { ...s };
    if (p.text) next[p.date] = p.text;
    else delete next[p.date];
    return next;
  });
  const firstPast = dates.filter((d) => d <= today);
  const [selected, setSelected] = useState(firstPast.includes(today) ? today : (firstPast.at(-1) ?? dates[0]));
  const [draft, setDraft] = useState(initial[selected] ?? "");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function pick(date: string) {
    setSelected(date);
    setDraft(notes[date] ?? "");
    setStatus(null);
  }

  function save(date: string, text: string) {
    setStatus(null);
    start(async () => {
      setNotes({ date, text: text.trim() });
      const res = await saveNote(date, text);
      setStatus(res.ok ? { ok: true, text: text.trim() ? "✓ Сақталды" : "✓ Жазба өшірілді" } : { ok: false, text: `✕ ${res.error}` });
      if (res.ok && date === selected && !text.trim()) setDraft("");
    });
  }

  const monthNotes = dates.filter((d) => notes[d]).map((d) => ({ date: d, text: notes[d] }));
  const changed = draft.trim() !== (notes[selected] ?? "");

  return (
    <>
      <Panel title={title} span="s12">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[13px] text-[var(--panel-ink)]">Жазба қосу үшін күннің санын бас. Нүкте — жазбасы бар күн.</p>
          <GridTable
            dates={dates}
            fields={fields}
            head={(d) =>
              d > today ? (
                <span className="day-head is-future">{parts(d).d}</span>
              ) : (
                <button
                  type="button"
                  className="day-head"
                  aria-pressed={d === selected}
                  aria-label={`${dayLabel(d, today)}${notes[d] ? ", жазбасы бар" : ""}. Жазбаны ашу`}
                  onClick={() => pick(d)}
                >
                  {parts(d).d}
                  {notes[d] && <span className="note-dot" aria-hidden="true" />}
                </button>
              )
            }
          />
          <Legend
            items={[
              { label: "Орындалды / уақытында", tone: "good" },
              { label: "Мешітте / жұма", tone: "mosque" },
              { label: "Қаза өтелді", tone: "made_up" },
              { label: "Ішінара / 3 капсула", tone: "partial" },
              { label: "Қаза / орындалмады", tone: "bad" },
              { label: "Ұстамадым", tone: "neutral" },
              { label: "Белгіленбеген", tone: "none" },
            ]}
          />
        </div>
      </Panel>

      <Panel title={`Күн жазбасы — ${dayLabel(selected, today)}`} span="s7">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save(selected, draft);
          }}
        >
          <label className="field-light">
            Сол күні не болды? Ойлар, түйгендерің, себептер
            <textarea
              className="note-input"
              rows={5}
              maxLength={NOTE_MAX}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setStatus(null);
              }}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary" disabled={pending || !changed}>
              {pending ? "Сақталуда…" : "Сақтау"}
            </button>
            <span className="text-[13px] text-[var(--panel-ink)]">
              {draft.length} / {NOTE_MAX}
            </span>
            {status && (
              <span role={status.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${status.ok ? "text-[#197d19]" : "text-[#be0a0a]"}`}>
                {status.text}
              </span>
            )}
          </div>
        </form>
      </Panel>

      <Panel title={`Айдың жазбалары — ${monthNotes.length}`} span="s5">
        {monthNotes.length === 0 ? (
          <p className="m-0 text-[15px]">Бұл айда әлі жазба жоқ.</p>
        ) : (
          <ul className="entry-list">
            {monthNotes.map((n) => (
              <li key={n.date}>
                <button type="button" className="note-row" onClick={() => pick(n.date)} aria-label={`${dayLabel(n.date, today)} жазбасын ашу`}>
                  <strong>{parts(n.date).d}</strong>
                  <span>{n.text}</span>
                </button>
                <button
                  type="button"
                  className="entry-delete"
                  aria-label={`${dayLabel(n.date, today)} жазбасын өшіру`}
                  title="Өшіру"
                  onClick={() => {
                    if (confirm(`${dayLabel(n.date, today)} жазбасын өшіру керек пе?`)) save(n.date, "");
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
