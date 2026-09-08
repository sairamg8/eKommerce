import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import { Thumb } from "../ui/Thumb";
import s from "./ConsoleShell.module.css";

export type NavItem = {
  to: string; label: string; icon: string;
  end?: boolean; badge?: number; badgeMuted?: boolean;
};
export type NavGroup = { heading?: string; items: NavItem[] };

export function ConsoleShell({ title, role, accent, groups, user, footer }: {
  title: string;
  role: string;
  accent: string;
  groups: NavGroup[];
  user: { name: string; sub: string; hue: number };
  footer?: ReactNode;
}) {
  const { pathname } = useLocation();
  const active = groups.flatMap((g) => g.items)
    .filter((i) => pathname === i.to || (!i.end && pathname.startsWith(i.to + "/")))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return (
    <div className={s.shell}>
      <aside className={s.side}>
        <div className={s.brand}>
          <span className={s.mark} style={{ background: accent }}>
            {title.slice(0, 1)}
          </span>
          <div>
            <div className={s.bName}>{title}</div>
            <div className={s.bRole}>{role}</div>
          </div>
        </div>

        <nav className={s.nav}>
          {groups.map((g, gi) => (
            <div key={g.heading ?? gi}>
              {g.heading && <div className={s.group}>{g.heading}</div>}
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end}
                         className={({ isActive }) => cn(s.link, isActive && s.on)}>
                  <Icon name={i.icon} size={16} />
                  {i.label}
                  {i.badge != null && i.badge > 0 && (
                    <span className={cn(s.pill, i.badgeMuted && s.pillMuted)}>{i.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {footer && <div className={s.foot}>{footer}</div>}
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <span className={s.crumb}>{active?.label ?? title}</span>
          <span className={s.spacer} />
          <button className={s.iconBtn} aria-label="Search"><Icon name="search" size={17} /></button>
          <button className={s.iconBtn} aria-label="Notifications">
            <Icon name="bell" size={17} /><span className={s.dotAlert} />
          </button>
          <div className={s.who}>
            <Thumb hue={user.hue} size={28} label={user.name} radius={999} />
            <div>
              <div className={s.whoName}>{user.name}</div>
              <div className={s.whoRole}>{user.sub}</div>
            </div>
          </div>
        </header>
        <div className={s.content}><Outlet /></div>
      </div>
    </div>
  );
}
