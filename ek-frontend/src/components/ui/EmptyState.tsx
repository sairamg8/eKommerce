import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import s from "./EmptyState.module.css";

export function EmptyState({ icon, title, description, action, tone = "neutral" }: {
  icon?: ReactNode; title: string; description?: string;
  action?: ReactNode; tone?: "neutral" | "danger";
}) {
  return (
    <div className={cn(s.empty, tone === "danger" && s.danger)}>
      {icon && <div className={s.icon}>{icon}</div>}
      <div className={s.title}>{title}</div>
      {description && <p className={s.desc}>{description}</p>}
      {action}
    </div>
  );
}
