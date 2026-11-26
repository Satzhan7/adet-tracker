import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Құпиясөзді қалпына келтіру — Әдет трекер" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell mode="forgot">
      <AuthForm mode="forgot" />
    </AuthShell>
  );
}
