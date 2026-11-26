import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Кіру · Әдет трекер" };

const ERRORS: Record<string, string> = {
  not_allowed: "Бұл email рұқсат етілген тізімде жоқ.",
  auth_failed: "Кіру сәтсіз аяқталды. Қайта көріңіз.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell mode="login">
      <Suspense fallback={<AuthForm mode="login" />}>
        <LoginFormWithError searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

/** ?error=… comes from /auth/callback; reading it is request-time, so it sits behind Suspense. */
async function LoginFormWithError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return <AuthForm mode="login" initialError={message} />;
}
