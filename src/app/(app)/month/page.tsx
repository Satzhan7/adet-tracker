import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Ай кестесі · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Ай кестесі" stage={4} what="Жыл/ай таңдағышы, ай бойынша күндік кесте, талдау, ең жақсы / ең нашар ай, күнге жазбалар." />;
}
