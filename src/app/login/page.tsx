import { Suspense } from "react";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  not_allowed: "Бұл email-ге кіруге рұқсат жоқ.",
  auth_failed: "Кіру сәтсіз аяқталды. Қайта көріңіз.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--ink)]">
        <h1 className="text-2xl font-extrabold text-[var(--accent-head)]">Әдет трекер</h1>
        <p className="mt-1 text-sm text-[var(--ink-dim)]">Кіру тек рұқсат етілген email үшін.</p>
        <Suspense fallback={<LoginForm />}>
          <LoginFormWithError searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginFormWithError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return <LoginForm initialError={message} />;
}
