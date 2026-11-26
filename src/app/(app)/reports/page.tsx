import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/page";

export const metadata: Metadata = { title: "Есептер · Әдет трекер" };

export default function Page() {
  return <ComingSoon title="Есептер" stage={6} what="Excel импорты (алдын ала көру, қателер), xlsx / csv экспорт." />;
}
