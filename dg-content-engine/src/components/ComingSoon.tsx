/** Placeholder for a stage that lands in a later build phase. */
export function ComingSoon({ stage, phase, what }: { stage: string; phase: number; what: string }) {
  return (
    <div className="dg-card px-6 py-14 text-center">
      <p className="text-xs font-bold tracking-[0.2em] text-gold">{stage}</p>
      <p className="mt-3 text-base font-medium text-white">Arriving in Phase {phase}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{what}</p>
    </div>
  );
}
