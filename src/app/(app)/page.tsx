import type { Metadata } from "next";
import { PageHeader, Section, Tile } from "@/components/ui/page";

export const metadata: Metadata = { title: "Басты бет · Әдет трекер" };

/** Home frame. KPI values arrive with the data import (stage 1) and quick entry (stage 3). */
export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Басты бет"
        subtitle="Деректер 1-кезеңде (Excel импорты) қосылады"
        actions={
          <>
            <button type="button" className="btn-seg" aria-pressed="true">
              Ай
            </button>
            <button type="button" className="btn-seg" aria-pressed="false" disabled>
              Жыл
            </button>
          </>
        }
      />
      <Section id="kpi" title="Осы ай">
        <div className="tiles">
          <Tile label="Парыз намаз уақытында" value="—" note="деректер жоқ" />
          <Tile label="Қаза намаз" value="—" note="деректер жоқ" />
          <Tile label="Таңғы зікір" value="—" note="деректер жоқ" />
          <Tile label="Креатин" value="—" note="деректер жоқ" />
        </div>
      </Section>
      <Section id="recent" title="Соңғы 10 күн">
        <p className="panel-body">3-кезеңде: күндік кесте және «+» арқылы бүгінді жылдам белгілеу.</p>
      </Section>
    </>
  );
}
