import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import s from "./Badge.module.css";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

export function Badge({ tone = "neutral", dot, children, className }: {
  tone?: Tone; dot?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <span className={cn(s.badge, s[tone], className)}>
      {dot && <span className={s.dot} />}
      {children}
    </span>
  );
}
