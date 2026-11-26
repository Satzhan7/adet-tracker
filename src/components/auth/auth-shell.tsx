import Link from "next/link";
import { Logo } from "@/components/logo";

type Mode = "login" | "register";

const COPY: Record<Mode, { title: string; lead: string }> = {
  login: {
    title: "Әдет трекерге қош келдіңіз!",
    lead: "Аккаунтыңызға кіріңіз",
  },
  register: {
    title: "Жаңа аккаунт ашу",
    lead: "Тіркелу тек рұқсат етілген email үшін",
  },
};

/** Centered auth frame: brand above, single dark card with centered heading. */
export function AuthShell({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  const copy = COPY[mode];
  return (
    <main className="auth-shell">
      <div className="auth-col">
        <div className="auth-brand">
          <Logo size={44} />
          <span>Әдет трекер</span>
        </div>

        <div className="auth-card">
          <header className="text-center">
            <h1 className="auth-title">{copy.title}</h1>
            <p className="auth-lead">{copy.lead}</p>
          </header>

          {children}

          <p className="text-center text-[15px] text-[var(--ink-muted)]">
            {mode === "login" ? (
              <>
                Аккаунтыңыз жоқ па? <Link href="/register" className="auth-link">Тіркелу</Link>
              </>
            ) : (
              <>
                Аккаунтыңыз бар ма? <Link href="/login" className="auth-link">Кіру</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
