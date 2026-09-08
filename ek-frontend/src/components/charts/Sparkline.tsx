import { useId } from "react";

/** Tiny trend line for KPI tiles. No chart library — plain SVG path. */
export function Sparkline({ data, width = 96, height = 28, tone = "var(--chart-1)" }: {
  data: number[]; width?: number; height?: number; tone?: string;
}) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);

  const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.24" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={tone} strokeWidth="1.75"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
