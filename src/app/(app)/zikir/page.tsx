import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Зікір · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Зікір" stage={5} what="Таңғы және кешкі зікір: орындалу %, ішінара, серия (streak)." />;
}
