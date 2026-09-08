import { useState } from "react";
import { cn } from "../../lib/cn";
import s from "./DonutChart.module.css";

export type Slice = { label: string; value: number; tone?: string };

export function DonutChart({ data, size = 150, thickness = 22, centerLabel, format }: {
  data: Slice[]; size?: number; thickness?: number;
  centerLabel?: string; format?: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((t, d) => t + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const fmt = format ?? ((n: number) => String(n));

  let offset = 0;
  const segs = data.map((d, i) => {
    const len = (d.value / total) * c;
    const seg = { d, len, offset, tone: d.tone ?? `var(--chart-${(i % 6) + 1})` };
    offset += len;
    return seg;
  });

  return (
    <div className={s.wrap}>
      <div className={s.ring} style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img"
             aria-label="Distribution chart">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                  stroke="var(--surface-sunken)" strokeWidth={thickness} />
          {segs.map((seg, i) => (
            <circle key={i} className={cn(s.seg, hover != null && hover !== i && s.dim)}
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={seg.tone} strokeWidth={thickness}
                    strokeDasharray={`${seg.len} ${c - seg.len}`}
                    strokeDashoffset={-seg.offset}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          ))}
        </svg>
        <div className={s.center}>
          <div>
            <div className={s.cv}>
              {hover != null ? fmt(data[hover]!.value) : fmt(total)}
            </div>
            <div className={s.cl}>
              {hover != null ? data[hover]!.label : centerLabel ?? "Total"}
            </div>
          </div>
        </div>
      </div>

      <div className={s.legend}>
        {segs.map((seg, i) => (
          <div key={seg.d.label} className={s.item}
               onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className={s.swatch} style={{ background: seg.tone }} />
            <span className={s.label}>{seg.d.label.replace(/_/g, " ")}</span>
            <span className={cn(s.value, "tabular")}>{fmt(seg.d.value)}</span>
            <span className={cn(s.pct, "tabular")}>
              {((seg.d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
