import s from "./BarChart.module.css";

export type Bar = { label: string; value: number; meta?: string; tone?: string };

/** Horizontal ranked bars — the right form for "top N by value". */
export function BarChart({ data, format }: {
  data: Bar[]; format?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = format ?? ((n: number) => String(n));

  return (
    <div className={s.wrap}>
      {data.map((d, i) => (
        <div key={d.label}>
          <div className={s.top}>
            <span className={s.name}>{d.label}</span>
            <span className={s.meta}>{d.meta}</span>
          </div>
          <div className={s.row}>
            <span className={s.track}>
              <span className={s.fill}
                    style={{
                      width: `${(d.value / max) * 100}%`,
                      background: d.tone ?? `var(--chart-${(i % 6) + 1})`,
                    }} />
            </span>
            <span className={`${s.val} tabular`}>{fmt(d.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
