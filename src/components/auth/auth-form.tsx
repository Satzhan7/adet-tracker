"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; text: string; register?: boolean };

const NOT_ALLOWED = /database error saving new user|email_not_allowed/i;
/** Returned by signInWithOtp when shouldCreateUser is false and the email has no account. */
const NO_ACCOUNT = /signups not allowed for otp|otp_disabled|user not found/i;

export function AuthForm({ mode, initialError }: { mode: Mode; initialError?: string }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(
    initialError ? { kind: "error", text: initialError } : { kind: "idle" },
  );

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function continueWithGoogle() {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setStatus({ kind: "error", text: "Google арқылы кіру сәтсіз. Қайта көріңіз." });
  }

  async function sendLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    setStatus({ kind: "sending" });

    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: {
        emailRedirectTo: redirectTo(),
        // Login never creates accounts; registration does (the allowlist trigger still gates it).
        shouldCreateUser: isRegister,
        data: isRegister ? { full_name: name.trim() } : undefined,
      },
    });

    if (!error) return setStatus({ kind: "sent", email: address });
    const text = `${error.code ?? ""} ${error.message}`;
    if (NOT_ALLOWED.test(text)) {
      return setStatus({ kind: "error", text: "Бұл email рұқсат етілген тізімде жоқ." });
    }
    if (!isRegister && NO_ACCOUNT.test(text)) {
      return setStatus({ kind: "error", text: "Бұл email әлі тіркелмеген.", register: true });
    }
    setStatus({ kind: "error", text: "Сілтеме жіберілмеді. Сәлден соң қайта көріңіз." });
  }

  if (status.kind === "sent") {
    return (
      <div className="flex flex-col gap-6">
        <div className="auth-note auth-note-good" role="status">
          <span aria-hidden="true">✓</span>
          <span>
            Сілтеме жіберілді: <strong className="break-all">{status.email}</strong>. Поштаңызды ашып, сілтемені
            басыңыз.
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-lg" onClick={() => setStatus({ kind: "idle" })}>
          Басқа email енгізу
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={sendLink} className="flex flex-col gap-6">
        {isRegister && (
          <label className="auth-field">
            <span>
              Атыңыз <span className="auth-req" aria-hidden="true">*</span>
            </span>
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label className="auth-field">
          <span>
            Email <span className="auth-req" aria-hidden="true">*</span>
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <p className="-mt-3 text-[13px] text-[var(--ink-muted)]">
          Құпиясөз керек емес: email-ге бір реттік кіру сілтемесі келеді.
        </p>
        <button type="submit" disabled={sending} className="btn btn-primary btn-lg">
          {sending ? "Жіберілуде…" : isRegister ? "Тіркелу" : "Кіру"}
        </button>
      </form>

      <div aria-live="polite" className="empty:hidden">
        {status.kind === "error" && (
          <div className="auth-note auth-note-bad" role="alert">
            <span aria-hidden="true">✕</span>
            <span>
              {status.text}
              {status.register && (
                <>
                  {" "}
                  <Link href="/register" className="font-bold underline">
                    Тіркелу
                  </Link>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-[13px] text-[var(--ink-muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        немесе
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <button type="button" onClick={continueWithGoogle} className="btn btn-outline btn-lg">
        <GoogleIcon />
        {isRegister ? "Google арқылы тіркелу" : "Google арқылы кіру"}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
