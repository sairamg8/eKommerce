import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../store/AuthContext";
import type { Persona } from "../../store/AuthContext";
import { useTheme } from "../../store/ThemeContext";
import s from "./PersonaBar.module.css";

const PERSONAS: { key: Persona; label: string; icon: string; home: string }[] = [
  { key: "guest",    label: "Shopper",  icon: "store",  home: "/" },
  { key: "customer", label: "Customer", icon: "user",   home: "/account/orders" },
  { key: "merchant", label: "Merchant", icon: "package", home: "/merchant" },
  { key: "admin",    label: "Admin",    icon: "shield", home: "/admin" },
  { key: "agent",    label: "Delivery", icon: "truck",  home: "/delivery" },
];

/**
 * Prototype-only. Jumps between the four portals without a login round-trip
 * so every screen is one click away.
 */
export function PersonaBar() {
  const { persona, switchPersona } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className={s.bar}>
      <span className={s.label}>
        <Icon name="eye" size={13} /> Viewing as
      </span>
      <div className={s.tabs}>
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            className={cn(s.tab, persona === p.key && s.on)}
            onClick={() => { switchPersona(p.key); navigate(p.home); }}
          >
            <Icon name={p.icon} size={13} />
            {p.label}
          </button>
        ))}
      </div>
      <span className={s.spacer} />
      <span className={cn(s.note, "mono")}>{pathname}</span>
      <div className={s.right}>
        <button className={s.iconBtn} onClick={toggle} aria-label="Toggle theme">
          <Icon name={theme === "light" ? "moon" : "sun"} size={14} />
        </button>
      </div>
    </div>
  );
}
