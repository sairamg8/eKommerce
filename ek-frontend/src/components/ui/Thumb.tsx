import { cn } from "../../lib/cn";
import s from "./Thumb.module.css";

/**
 * Placeholder product/merchant imagery derived from a stable hue.
 * A real build swaps this for an <img> against object storage.
 */
export function Thumb({ hue, size = 48, label, radius, className }: {
  hue: number; size?: number; label?: string; radius?: number; className?: string;
}) {
  const bg = `linear-gradient(145deg, hsl(${hue} 62% 92%), hsl(${(hue + 40) % 360} 58% 84%))`;
  const fg = `hsl(${hue} 45% 32%)`;
  return (
    <div
      className={cn(s.thumb, className)}
      style={{ width: size, height: size, background: bg, borderRadius: radius, color: fg }}
      aria-hidden
    >
      <span className={s.mono} style={{ fontSize: Math.max(size * 0.3, 10) }}>
        {(label ?? "").slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}
