"use client";

import { useRef, useState, useTransition } from "react";
import { applyImport, previewImport, type Applied, type Preview } from "@/app/(app)/reports/actions";
import { dayLabel } from "@/lib/dates";

type State =
  | { kind: "idle" }
  | { kind: "preview"; data: Preview }
  | { kind: "done"; data: Applied }
  | { kind: "error"; text: string };

/** Choose a file → preview what changes → confirm. Nothing is written before «Импорттау». */
export function ImportPanel({ today }: { today: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"fill" | "replace">("fill");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const form = (f: File, m: string) => {
    const fd = new FormData();
    fd.set("file", f);
    fd.set("mode", m);
    return fd;
  };
  const preview = (f: File, m: string) =>
    start(async () => {
      const res = await previewImport(form(f, m));
      setState(res.ok ? { kind: "preview", data: res } : { kind: "error", text: res.error });
    });

  const p = state.kind === "preview" ? state.data : null;
  const writes = p ? p.plan.dayWrites + p.plan.noteWrites + p.plan.khatmWrites + p.plan.hifzWrites : 0;

  return (
    <div className="flex flex-col gap-4">
      <ol className="import-steps">
        <li>Үлгі файлды жүктеп ал (төмендегі батырма)</li>
        <li>«Күнделік» парағын толтыр: бір жол — бір күн, мәнді тізімнен таңда</li>
        <li>Файлды төменде таңда — алдымен не өзгеретіні көрсетіледі</li>
      </ol>
      <a className="btn btn-secondary self-start text-sm font-medium" style={{ borderRadius: 6 }} href="/reports/export?template=1&format=xlsx" download>
        Шаблонды жүктеу (.xlsx)
      </a>

      <label className={`file-drop${file ? " has-file" : ""}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <span className="flex flex-col">
          <strong>{file ? file.name : "Файлды таңдау"}</strong>
          <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} КБ` : ".xlsx немесе .csv, 4 МБ-қа дейін"}</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setState({ kind: "idle" });
            if (f) preview(f, mode);
          }}
        />
      </label>

      <fieldset className="import-mode">
        <legend>Бар деректермен не істейміз</legend>
        {(
          [
            ["fill", "Тек бос өрістерді толтыру", "Бар белгілер өзгермейді (әдепкі)"],
            ["replace", "Файлдағы мәндермен ауыстыру", "Файлда бар мән дерекқордағыны ауыстырады; бос ұяшық ештеңе өшірмейді"],
          ] as const
        ).map(([value, label, hint]) => (
          <label key={value} className="radio-row">
            <input
              type="radio"
              name="mode"
              value={value}
              checked={mode === value}
              onChange={() => {
                setMode(value);
                if (file) preview(file, value);
              }}
            />
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div aria-live="polite" className="flex flex-col gap-3">
        {pending && <p className="m-0 text-sm">Файл тексерілуде…</p>}
        {state.kind === "error" && (
          <p role="alert" className="save-error m-0">
            ✕ {state.text}
          </p>
        )}
        {p && !pending && (
          <div className="extra">
            <span className="tile-label">Алдын ала көру · {p.fileName}</span>
            <div className="extra-row"><span>Файлдағы жол</span><strong>{p.rows}{p.range ? ` · ${dayLabel(p.range[0], today)} – ${dayLabel(p.range[1], today)}` : ""}</strong></div>
            <div className="extra-row"><span>Жаңа күн</span><strong>{p.plan.newDays}</strong></div>
            <div className="extra-row"><span>Өзгеретін күн</span><strong>{p.plan.changedDays}</strong></div>
            <div className="extra-row"><span>Өзгермейтін күн</span><strong>{p.plan.unchangedDays}</strong></div>
            {mode === "fill" && p.plan.keptValues > 0 && (
              <div className="extra-row"><span>Сақталып қалатын бар мәндер</span><strong>{p.plan.keptValues}</strong></div>
            )}
            <div className="extra-row"><span>Жазба / хатм / хифз</span><strong>{p.plan.noteWrites} / {p.plan.khatmWrites} / {p.plan.hifzWrites}</strong></div>
            <div className="extra-row"><span>Қате жол (жазылмайды)</span><strong className={p.errorCount ? "text-[#be0a0a]" : undefined}>{p.errorCount}</strong></div>
            {p.ignoredColumns.length > 0 && (
              <div className="extra-row"><span>Танылмаған бағандар</span><strong>{p.ignoredColumns.join(", ")}</strong></div>
            )}
          </div>
        )}
        {p && p.errors.length > 0 && !pending && (
          <details className="import-errors">
            <summary>Қателер ({p.errorCount})</summary>
            <ul>
              {p.errors.map((e) => (
                <li key={e.row}>
                  <strong>{e.row}-жол:</strong> {e.reason}
                </li>
              ))}
              {p.errorCount > p.errors.length && <li>… тағы {p.errorCount - p.errors.length}</li>}
            </ul>
          </details>
        )}
        {p && !pending && (
          <button
            type="button"
            className="btn btn-primary self-start"
            disabled={writes === 0}
            onClick={() =>
              file &&
              start(async () => {
                const res = await applyImport(form(file, mode));
                setState(res.ok ? { kind: "done", data: res } : { kind: "error", text: res.error });
              })
            }
          >
            {writes === 0 ? "Өзгеретін ештеңе жоқ" : `Импорттау · ${p.plan.newDays + p.plan.changedDays} күн`}
          </button>
        )}
        {state.kind === "done" && (
          <p role="status" className="m-0 text-[15px] font-semibold text-[#197d19]">
            ✓ Жазылды: {state.data.days} күн, {state.data.notes} жазба, {state.data.khatm} хатм, {state.data.hifz} хифз
            {state.data.skippedRows ? ` · ${state.data.skippedRows} қате жол өткізілді` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
