"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; text: string };

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(
    initialError ? { kind: "error", text: initialError } : { kind: "idle" },
  );

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setStatus({ kind: "error", text: "Google арқылы кіру сәтсіз." });
  }

  async function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (!error) return setStatus({ kind: "sent" });
    const notAllowed = /database error saving new user|email_not_allowed/i.test(error.message);
    setStatus({
      kind: "error",
      text: notAllowed ? "Бұл email-ге кіруге рұқсат жоқ." : "Сілтеме жіберілмеді. Қайта көріңіз.",
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <button type="button" onClick={signInWithGoogle} className="btn btn-secondary">
        Google арқылы кіру
      </button>

      <div className="flex items-center gap-3 text-xs text-[var(--ink-dim)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        немесе
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--field)] px-3 text-base font-normal outline-none focus:border-[var(--primary)]"
          />
        </label>
        <button type="submit" disabled={status.kind === "sending"} className="btn btn-primary">
          {status.kind === "sending" ? "Жіберілуде…" : "Кіру сілтемесін жіберу"}
        </button>
      </form>

      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {status.kind === "sent" && <span className="text-[var(--good)]">Сілтеме жіберілді. Поштаңызды тексеріңіз.</span>}
        {status.kind === "error" && <span className="text-[var(--bad)]">{status.text}</span>}
      </p>
    </div>
  );
}
