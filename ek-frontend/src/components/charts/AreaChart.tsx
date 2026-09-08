import { useId, useState } from "react";
import s from "./AreaChart.module.css";

export type Series = { label: string; value: number; hint?: string };

/** Responsive area chart with a hover cursor. Hand-drawn SVG, no library. */
export function AreaChart({ data, height = 240, tone = "var(--chart-1)", format }: {
  data: Series[]; height?: number; tone?: string; format?: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Unique per instance — two charts on one page must not share a gradient id.
  const gradientId = useId().replace(/:/g, "");
  const W = 800;
  const H = height;
  const PAD = { t: 12, r: 12, b: 26, l: 52 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value)) * 1.12 || 1;
  const step = data.length > 1 ? iw / (data.length - 1) : iw;
  const x = (i: number) => PAD.l + i * step;
  const y = (v: number) => PAD.t + ih - (v / max) * ih;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${PAD.t + ih} L${PAD.l},${PAD.t + ih} Z`;
  const ticks = 4;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const fmt = format ?? ((n: number) => String(Math.round(n)));

  return (
    <div className={s.wrap}>
      <svg className={s.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
           role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
            <stop offset="100%" stopColor={tone} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = (max / ticks) * i;
          const yy = y(v);
          return (
            <g key={i}>
              <line className={s.grid} x1={PAD.l} y1={yy} x2={W - PAD.r} y2={yy} />
              <text className={s.axis} x={PAD.l - 8} y={yy + 3} textAnchor="end">{fmt(v)}</text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={tone} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

        {data.map((d, i) => (
          i % labelEvery === 0 ? (
            <text key={i} className={s.axis} x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text>
          ) : null
        ))}

        {hover != null && (
          <>
            <line className={s.cursor} x1={x(hover)} y1={PAD.t} x2={x(hover)} y2={PAD.t + ih} />
            <circle cx={x(hover)} cy={y(data[hover]!.value)} r="4"
                    fill={tone} stroke="var(--surface-card)" strokeWidth="2" />
          </>
        )}

        {data.map((_, i) => (
          <rect key={i} className={s.hit} x={x(i) - step / 2} y={PAD.t}
                width={step} height={ih}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>

      {hover != null && (
        <div className={s.tip}
             style={{ left: `${((x(hover)) / W) * 100}%`, top: `${(y(data[hover]!.value) / H) * 100}%` }}>
          <span className={s.tipL}>{data[hover]!.label}</span>
          <span className={s.tipV}>{data[hover]!.hint ?? fmt(data[hover]!.value)}</span>
        </div>
      )}
    </div>
  );
}
