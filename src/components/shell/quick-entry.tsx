"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addHifz, addKhatm, getDaySnapshot, setDayStatus, type DaySnapshot } from "@/app/(app)/track-actions";
import { addDays, dayLabel, todayISO } from "@/lib/dates";
import { FIELDS, TONE_DOT, type DayField } from "@/lib/fields";

const GROUPS: { title: string; fields: DayField[] }[] = [
  { title: "Намаз", fields: ["tan", "besin", "asr", "sham", "quptan", "utir", "tungi", "duha"] },
  { title: "Зікір", fields: ["dhikr_morning", "dhikr_evening"] },
  { title: "Құран — уирд", fields: ["wird_taha", "wird_amana"] },
  { title: "Денсаулық", fields: ["creatine", "protein"] },
  { title: "Ораза", fields: ["oraza"] },
];
const ALL = GROUPS.flatMap((g) => g.fields);
const SHORT: Partial<Record<DayField, string>> = { wird_taha: "Тоһа", wird_amana: "Әмәнәр расул" };

/**
 * «+»: mark a whole day from any page. One tap sets a value, tapping the
 * selected value again clears it. Khatm pages and a hifz entry can be logged too.
 */
export function QuickEntry({ variant }: { variant: "head" | "fab" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [snap, setSnap] = useState<DaySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(undefined);
    const s = await getDaySnapshot(d);
    setLoading(false);
    if (s) setSnap(s);
    else setError("Деректер жүктелмеді.");
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function openFor() {
    const t = todayISO();
    setToday(t);
    setDate(t);
    setSnap(null);
    setOpen(true);
    void load(t);
  }

  function goTo(d: string) {
    if (!d || d > today) return;
    setDate(d);
    setSnap(null);
    void load(d);
  }

  function set(field: DayField, value: string) {
    if (!snap) return;
    const prev = snap.values[field] ?? null;
    const next = prev === value ? null : value;
    setSnap({ ...snap, values: { ...snap.values, [field]: next } });
    startTransition(async () => {
      const res = await setDayStatus(date, field, next);
      if (!res.ok) {
        setError(`${FIELDS[field].name}: ${res.error}`);
        setSnap((s) => (s ? { ...s, values: { ...s.values, [field]: prev } } : s));
      }
    });
  }

  function addPages(n: number) {
    if (!snap) return;
    const from = snap.nextPage;
    setSnap({ ...snap, khatmPages: snap.khatmPages + n, nextPage: from ? Math.min(604, from + n) : null });
    startTransition(async () => {
      const res = await addKhatm(date, n, from);
      if (!res.ok) {
        setError(`Хатм: ${res.error}`);
        void load(date);
      }
    });
  }

  function addHifzEntry(reps: number) {
    if (!snap?.currentSurah) return;
    const surah = snap.currentSurah;
    setSnap({ ...snap, hifzToday: [...snap.hifzToday, { surah, repetitions: reps }] });
    startTransition(async () => {
      const res = await addHifz(date, surah, reps);
      if (!res.ok) {
        setError(`Хифз: ${res.error}`);
        void load(date);
      }
    });
  }

  const marked = snap ? ALL.filter((f) => snap.values[f]).length : 0;

  return (
    <>
      <button
        type="button"
        className={variant === "head" ? "quick-btn" : "fab"}
        onClick={openFor}
        aria-haspopup="dialog"
        aria-label="Күнді белгілеу"
        title="Күнді белгілеу"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {variant === "fab" && <span>Белгілеу</span>}
      </button>

      <dialog
        ref={dialogRef}
        className="quick-dialog"
        aria-label="Күнді белгілеу"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        {open && (
          <div className="quick-body">
            <header className="quick-head">
              <div className="flex min-w-0 flex-col">
                <span className="text-lg font-extrabold text-[#1b253b]">Күнді белгілеу</span>
                <span className="text-[13px] text-[#4d4d4d]">
                  {date === today ? "Бүгін, " : ""}
                  {date && dayLabel(date, today)} — {marked} / {ALL.length} белгіленді
                </span>
              </div>
              <button type="button" className="pick-close" onClick={() => setOpen(false)} aria-label="Жабу">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <div className="date-switch" role="group" aria-label="Күнді таңдау">
              <button type="button" className="date-step" onClick={() => goTo(addDays(date, -1))} aria-label="Алдыңғы күн">
                ‹
              </button>
              <label className="date-field">
                <span className="sr-only">Күн</span>
                <input type="date" value={date} max={today} onChange={(e) => goTo(e.target.value)} />
              </label>
              <button type="button" className="date-step" onClick={() => goTo(addDays(date, 1))} disabled={date === today} aria-label="Келесі күн">
                ›
              </button>
              {date !== today && (
                <button type="button" className="btn-seg" onClick={() => goTo(today)}>
                  Бүгін
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="save-error">
                ✕ {error}
              </p>
            )}

            {!snap ? (
              <p className="text-sm text-[#4d4d4d]">{loading ? "Жүктелуде…" : ""}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {GROUPS.map((g) => (
                  <section key={g.title} className="quick-group" aria-label={g.title}>
                    <h3>{g.title}</h3>
                    {g.fields.map((f) => (
                      <QuickRow key={f} field={f} value={snap.values[f] ?? null} onPick={(v) => set(f, v)} />
                    ))}
                    {g.title === "Құран — уирд" && (
                      <>
                        <div className="quick-row">
                          <span className="quick-name">
                            Хатм
                            <small>
                              {snap.khatmPages ? `${snap.khatmPages} бет қосылды` : "бет қосу"}
                              {snap.nextPage ? ` — келесі ${snap.nextPage}-бет` : ""}
                            </small>
                          </span>
                          <div className="quick-chips" role="group" aria-label="Хатм беті қосу">
                            {[1, 2, 4, 5].map((n) => (
                              <button key={n} type="button" className="quick-chip" onClick={() => addPages(n)}>
                                +{n} бет
                              </button>
                            ))}
                          </div>
                        </div>
                        {snap.currentSurah && (
                          <div className="quick-row">
                            <span className="quick-name">
                              Хифз — {snap.currentSurah}
                              <small>
                                {snap.hifzToday.length
                                  ? snap.hifzToday.map((h) => `${h.repetitions} рет`).join(", ") + " жазылды"
                                  : "жазба қосу"}
                              </small>
                            </span>
                            <div className="quick-chips" role="group" aria-label="Хифз жазбасы">
                              {[5, 3, 1].map((n) => (
                                <button key={n} type="button" className="quick-chip" onClick={() => addHifzEntry(n)}>
                                  {n} рет
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                ))}
              </div>
            )}

            <button type="button" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
              Дайын
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}

function QuickRow({ field, value, onPick }: { field: DayField; value: string | null; onPick: (v: string) => void }) {
  const def = FIELDS[field];
  return (
    <div className="quick-row">
      <span className="quick-name">{SHORT[field] ?? def.name}</span>
      <div className="quick-chips" role="group" aria-label={def.name}>
        {def.options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className="quick-chip"
              aria-pressed={on}
              style={on ? { background: TONE_DOT[o.tone], borderColor: TONE_DOT[o.tone], color: "#fff" } : undefined}
              onClick={() => onPick(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
