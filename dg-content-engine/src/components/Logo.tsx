/** The DG mark: a gold monogram tile. Kept as code so it stays crisp anywhere. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-gold font-black tracking-tight text-ink"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      DG
    </span>
  );
}
