import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Құран · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Құран" stage={5} what="Хатм прогресі (604 бет), хифз журналы, уирд." />;
}
