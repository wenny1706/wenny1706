export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Friendly empty state — never leave a blank screen with no next step. */
export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="dg-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-base font-medium text-white">{title}</p>
      <p className="max-w-md text-sm text-ink-muted">{hint}</p>
      {action}
    </div>
  );
}
