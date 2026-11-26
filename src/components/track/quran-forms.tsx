"use client";

import { useState, useTransition } from "react";
import { addHifz, addKhatm, deleteLogEntry } from "@/app/(app)/track-actions";

/** Adds today's khatm pages; "from page" is optional and fills from/to in the log. */
export function KhatmForm({ date, nextPage }: { date: string; nextPage: number | null }) {
  const [pages, setPages] = useState("");
  const [from, setFrom] = useState(nextPage ? String(nextPage) : "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(pages);
    start(async () => {
      const res = await addKhatm(date, n, from ? Number(from) : null);
      setMsg(res.ok ? { ok: true, text: `✓ ${n} бет қосылды` } : { ok: false, text: `✕ ${res.error}` });
      if (res.ok) {
        setPages("");
        if (from) setFrom(String(Math.min(604, Number(from) + n)));
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="quick-chips" role="group" aria-label="Жылдам таңдау">
        {[1, 2, 4, 5, 10].map((n) => (
          <button key={n} type="button" className="btn-seg" aria-pressed={pages === String(n)} onClick={() => setPages(String(n))}>
            {n} бет
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="field-light">
          Бүгін оқылған бет
          <input type="number" inputMode="numeric" min={1} max={604} required value={pages} onChange={(e) => setPages(e.target.value)} />
        </label>
        <label className="field-light">
          Қай беттен (міндетті емес)
          <input type="number" inputMode="numeric" min={1} max={604} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Сақталуда…" : "Қосу"}
      </button>
      {msg && (
        <span role={msg.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${msg.ok ? "text-[#197d19]" : "text-[#be0a0a]"}`}>
          {msg.text}
        </span>
      )}
    </form>
  );
}

/** Adds a hifz entry: surah (defaults to the current one) and repetitions (defaults to 5). */
export function HifzForm({ date, currentSurah }: { date: string; currentSurah: string | null }) {
  const [surah, setSurah] = useState(currentSurah ?? "");
  const [reps, setReps] = useState("5");
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await addHifz(date, surah, Number(reps));
      setMsg(res.ok ? { ok: true, text: `✓ ${surah.trim()}, ${reps} рет қосылды` } : { ok: false, text: `✕ ${res.error}` });
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="field-light">
          Сүре
          <input type="text" required maxLength={60} value={surah} onChange={(e) => setSurah(e.target.value)} />
        </label>
        <label className="field-light w-28">
          Неше рет
          <input type="number" inputMode="numeric" min={0} max={100} required value={reps} onChange={(e) => setReps(e.target.value)} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Сақталуда…" : "Қосу"}
      </button>
      {msg && (
        <span role={msg.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${msg.ok ? "text-[#197d19]" : "text-[#be0a0a]"}`}>
          {msg.text}
        </span>
      )}
    </form>
  );
}

export function DeleteEntry({ table, id, label }: { table: "khatm_log" | "hifz_log"; id: number; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="entry-delete"
      disabled={pending}
      aria-label={`Өшіру: ${label}`}
      title="Өшіру"
      onClick={() => {
        if (confirm(`«${label}» жазбасын өшіру керек пе?`)) start(async () => void (await deleteLogEntry(table, id)));
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
