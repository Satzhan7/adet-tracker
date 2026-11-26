"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, Note, PasswordInput } from "./auth-form";

const MIN_PASSWORD = 8;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(`Құпиясөз кемі ${MIN_PASSWORD} таңба болсын.`);
    if (password !== repeat) return setError("Құпиясөздер сәйкес емес.");

    setBusy(true);
    setError(undefined);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      return setError(
        error.code === "same_password"
          ? "Жаңа құпиясөз бұрынғысымен бірдей."
          : error.code === "weak_password"
            ? "Құпиясөз тым әлсіз. Ұзынырақ әрі күрделірек етіңіз."
            : "Сақталмады. Сілтеменің мерзімі өткен болуы мүмкін — қайта сұраңыз.",
      );
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <Field label="Жаңа құпиясөз">
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={MIN_PASSWORD} />
        </Field>
        <Field label="Қайталаңыз">
          <PasswordInput value={repeat} onChange={setRepeat} autoComplete="new-password" minLength={MIN_PASSWORD} />
        </Field>
        <button type="submit" disabled={busy} className="btn btn-primary btn-lg">
          {busy ? "Сақталуда…" : "Сақтау"}
        </button>
      </form>
      <div aria-live="polite" className="empty:hidden">
        {error && <Note tone="bad" text={error} />}
      </div>
    </div>
  );
}
