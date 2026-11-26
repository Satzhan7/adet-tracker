/** Design-system building blocks from canvas v2, shared by every section page. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="flex min-w-0 flex-col gap-1 pr-2.5">
        <h1>{title}</h1>
        {subtitle && <span className="text-sm text-[var(--t-text)]">{subtitle}</span>}
      </div>
      {actions && (
        <div role="group" className="flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

/** Light panel with the orange section header. */
export function Section({
  title,
  children,
  id,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className="panel" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

/** KPI tile: uppercase label, large value, optional note. */
export function Tile({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
      {note && <span className="tile-note">{note}</span>}
    </div>
  );
}

/** Section page that is not built yet: header plus a note saying which stage fills it. */
export function ComingSoon({ title, stage, what }: { title: string; stage: number; what: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={`${stage}-кезеңде толады`} />
      <Section title="Жоспарда">
        <p className="panel-body">{what}</p>
      </Section>
    </>
  );
}
