import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Денсаулық · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Денсаулық" stage={5} what="Креатин және протеин: доза %, соңғы күндер." />;
}
