/** Thin ring showing % lived. Purely visual — the number is rendered next to it. */
export function ProgressRing({
  percent,
  size = 220,
}: {
  percent: number;
  size?: number;
}) {
  const stroke = 3;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const lived = Math.min(100, Math.max(0, percent)) / 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="-rotate-90 rtl:scale-x-[-1]"
    >
      <defs>
        <linearGradient id="ring-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--flare)" />
          <stop offset="50%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--ember)" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--void-line)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ring-glow)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - lived)}
      />
    </svg>
  );
}
