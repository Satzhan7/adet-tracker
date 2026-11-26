"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type AuthMode = "login" | "register" | "forgot";

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; text: string }
  | { kind: "error"; text: string; link?: { href: string; label: string } };

const MIN_PASSWORD = 8;
const NOT_ALLOWED = /database error saving new user|email_not_allowed/i;

export function AuthForm({ mode, initialError }: { mode: AuthMode; initialError?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(
    initialError ? { kind: "error", text: initialError } : { kind: "idle" },
  );

  const callback = (next?: string) =>
    `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function continueWithGoogle() {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    if (error) setStatus({ kind: "error", text: "Google арқылы кіру сәтсіз. Қайта көріңіз." });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    const auth = createClient().auth;
    setStatus({ kind: "busy" });

    if (mode === "login") {
      const { error } = await auth.signInWithPassword({ email: address, password });
      if (!error) {
        router.replace("/");
        router.refresh();
        return;
      }
      if (error.code === "email_not_confirmed") {
        return setStatus({ kind: "error", text: "Email әлі расталмаған. Поштаңыздағы растау сілтемесін басыңыз." });
      }
      if (error.code === "invalid_credentials") {
        return setStatus({
          kind: "error",
          text: "Email немесе құпиясөз қате.",
          link: { href: "/forgot-password", label: "Құпиясөзді қалпына келтіру" },
        });
      }
      return setStatus({ kind: "error", text: "Кіру сәтсіз. Сәлден соң қайта көріңіз." });
    }

    if (mode === "register") {
      if (password.length < MIN_PASSWORD) {
        return setStatus({ kind: "error", text: `Құпиясөз кемі ${MIN_PASSWORD} таңба болсын.` });
      }
      const { data, error } = await auth.signUp({
        email: address,
        password,
        options: { emailRedirectTo: callback(), data: { full_name: name.trim() } },
      });
      if (error) {
        if (NOT_ALLOWED.test(`${error.code ?? ""} ${error.message}`)) {
          return setStatus({ kind: "error", text: "Бұл email рұқсат етілген тізімде жоқ." });
        }
        if (error.code === "user_already_exists") return alreadyRegistered();
        if (error.code === "weak_password") {
          return setStatus({ kind: "error", text: "Құпиясөз тым әлсіз. Ұзынырақ әрі күрделірек етіңіз." });
        }
        return setStatus({ kind: "error", text: "Тіркелу сәтсіз. Сәлден соң қайта көріңіз." });
      }
      // With email confirmation on, an existing address comes back as a user with no identities.
      if (data.user && data.user.identities?.length === 0) return alreadyRegistered();
      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }
      return setStatus({
        kind: "done",
        text: `Растау сілтемесі ${address} поштасына жіберілді. Бір рет басыңыз, содан кейін email мен құпиясөзбен кіресіз.`,
      });
    }

    // forgot
    const { error } = await auth.resetPasswordForEmail(address, { redirectTo: callback("/update-password") });
    if (error) return setStatus({ kind: "error", text: "Хат жіберілмеді. Сәлден соң қайта көріңіз." });
    setStatus({
      kind: "done",
      text: `Егер ${address} тіркелген болса, жаңа құпиясөз орнату сілтемесі жіберілді.`,
    });
  }

  function alreadyRegistered() {
    setStatus({
      kind: "error",
      text: "Бұл email бұрын тіркелген.",
      link: { href: "/login", label: "Кіру" },
    });
  }

  if (status.kind === "done") {
    return (
      <div className="flex flex-col gap-4">
        <Note tone="good" text={status.text} />
        <Link href="/login" className="btn btn-outline btn-lg">
          Кіру бетіне оралу
        </Link>
      </div>
    );
  }

  const busy = status.kind === "busy";
  const submitLabel = { login: "Кіру", register: "Тіркелу", forgot: "Сілтеме жіберу" }[mode];

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "register" && (
          <Field label="Атыңыз">
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete={mode === "register" ? "email" : "username"}
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {mode !== "forgot" && (
          <Field
            label="Құпиясөз"
            aside={
              mode === "login" ? (
                <Link href="/forgot-password" className="auth-link text-[14px]">
                  Ұмыттыңыз ба?
                </Link>
              ) : undefined
            }
          >
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={mode === "register" ? MIN_PASSWORD : undefined}
            />
          </Field>
        )}
        {mode === "register" && (
          <p className="-mt-2 text-[12px] text-[var(--ink-muted)]">Кемі {MIN_PASSWORD} таңба.</p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary btn-lg">
          {busy ? "Күте тұрыңыз…" : submitLabel}
        </button>
      </form>

      <div aria-live="polite" className="empty:hidden">
        {status.kind === "error" && <Note tone="bad" text={status.text} link={status.link} />}
      </div>

      {mode !== "forgot" && (
        <>
          <div className="flex items-center gap-3 text-[13px] text-[var(--ink-muted)]">
            <span className="h-px flex-1 bg-[var(--line)]" />
            немесе
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
          <button type="button" onClick={continueWithGoogle} className="btn btn-outline btn-lg">
            <GoogleIcon />
            {mode === "register" ? "Google арқылы тіркелу" : "Google арқылы кіру"}
          </button>
        </>
      )}
    </div>
  );
}

export function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="auth-field">
      <span className="flex items-baseline justify-between gap-3">
        <span>
          {label} <span className="auth-req" aria-hidden="true">*</span>
        </span>
        {aside}
      </span>
      {children}
    </label>
  );
}

export function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [shown, setShown] = useState(false);
  return (
    <span className="auth-password">
      <input
        type={shown ? "text" : "password"}
        name="password"
        required
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
        aria-pressed={shown}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {shown && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}

export function Note({
  tone,
  text,
  link,
}: {
  tone: "good" | "bad";
  text: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className={`auth-note auth-note-${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <span aria-hidden="true">{tone === "good" ? "✓" : "✕"}</span>
      <span>
        {text}
        {link && (
          <>
            {" "}
            <Link href={link.href} className="font-bold underline">
              {link.label}
            </Link>
          </>
        )}
      </span>
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
