import { cn } from "../../lib/cn";
import { useToast } from "../../store/ToastContext";
import { Icon } from "./Icon";
import s from "./Toaster.module.css";

const ICONS = { success: "check", error: "alert", info: "info" } as const;

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div className={s.wrap} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={cn(s.toast, s[t.tone])}>
          <Icon name={ICONS[t.tone]} size={16} className={s.ico} strokeWidth={2.2} />
          <span className={s.msg}>{t.message}</span>
          <button className={s.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
