import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Намаз · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Намаз" stage={5} what="Парыз, нәпіл және үтір: уақытында %, қаза саны, қалған қаза; 7/10/14/30 күн чиптері." />;
}
