import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = { title: "Жаңа құпиясөз · Әдет трекер" };

/** Reached from the reset email (via /auth/callback, so a session exists) or when signed in. */
export default function UpdatePasswordPage() {
  return (
    <AuthShell mode="update">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
