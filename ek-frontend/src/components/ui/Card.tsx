import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn";
import s from "./Card.module.css";

export function Card({ children, className, pad, style }: {
  children: ReactNode; className?: string; pad?: boolean; style?: CSSProperties;
}) {
  return <div className={cn(s.card, pad && s.pad, className)} style={style}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: {
  title: ReactNode; subtitle?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className={s.head}>
      <div>
        <div className={s.title}>{title}</div>
        {subtitle && <div className={s.sub}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, flush, className }: {
  children: ReactNode; flush?: boolean; className?: string;
}) {
  return <div className={cn(s.body, flush && s.bodyFlush, className)}>{children}</div>;
}
