import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Ораза · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Ораза" stage={5} what="Ұсталған күндер, Рамазан қазасы және өтелуі." />;
}
