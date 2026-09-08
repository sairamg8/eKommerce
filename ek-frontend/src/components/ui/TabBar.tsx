import { cn } from "../../lib/cn";
import { Icon } from "./Icon";
import s from "./TabBar.module.css";

export type Tab = { key: string; label: string; icon?: string; count?: number };

export function TabBar({ tabs, active, onChange }: {
  tabs: Tab[]; active: string; onChange: (key: string) => void;
}) {
  return (
    <div className={s.tabs} role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={active === t.key}
                className={cn(s.tab, active === t.key && s.on)}
                onClick={() => onChange(t.key)}>
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
          {t.count != null && <span className={s.count}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
