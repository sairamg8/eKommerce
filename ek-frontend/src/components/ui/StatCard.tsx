import { cn } from "../../lib/cn";
import { Sparkline } from "../charts/Sparkline";
import { Icon } from "./Icon";
import s from "./StatCard.module.css";

export function StatCard({ label, value, delta, note, icon, tone = "var(--chart-1)", spark }: {
  label: string; value: string; delta?: number; note?: string;
  icon?: string; tone?: string; spark?: number[];
}) {
  const dir = delta == null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <div className={s.card}>
      <div className={s.top}>
        <span className={s.label}>{label}</span>
        {icon && (
          <span className={s.ico} style={{ background: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }}>
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>
      <div className={cn(s.value, "tabular")}>{value}</div>
      <div className={s.foot}>
        <span>
          {delta != null && (
            <span className={cn(s.delta, s[dir])}>
              <Icon name={dir === "up" ? "arrowUp" : dir === "down" ? "arrowDown" : "minus"} size={12} strokeWidth={2.5} />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {note && <span className={s.note} style={{ marginLeft: delta != null ? 8 : 0 }}>{note}</span>}
        </span>
        {spark && <Sparkline data={spark} tone={tone} />}
      </div>
    </div>
  );
}
