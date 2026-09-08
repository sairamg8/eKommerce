import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "./Icon";
import s from "./Modal.module.css";

export function Modal({ open, onClose, title, subtitle, children, footer, wide }: {
  open: boolean; onClose: () => void;
  title: string; subtitle?: string;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={s.backdrop} onClick={onClose} role="presentation">
      <div className={cn(s.panel, wide && s.wide)} role="dialog" aria-modal="true"
           aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className={s.head}>
          <div>
            <div className={s.title}>{title}</div>
            {subtitle && <div className={s.sub}>{subtitle}</div>}
          </div>
          <button className={s.close} onClick={onClose} aria-label="Close dialog">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className={s.body}>{children}</div>
        {footer && <div className={s.foot}>{footer}</div>}
      </div>
    </div>
  );
}
