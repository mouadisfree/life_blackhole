/** Thin bar showing % lived. Purely visual — the number is rendered next to it. */
export function ProgressBar({ percent }: { percent: number }) {
  const lived = Math.min(100, Math.max(0, percent));
  return (
    <div
      aria-hidden="true"
      className="h-1 w-full overflow-hidden rounded-full bg-sky-line"
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-halo via-cloud to-cyan rtl:bg-linear-to-l"
        style={{ width: `${lived}%` }}
      />
    </div>
  );
}
