import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import { Thumb } from "../ui/Thumb";
import s from "./AccountLayout.module.css";
import { useAppSelector } from "../../store";
import { random_hue } from "../../utils";

const LINKS = [
  { to: "/account/orders", label: "My orders", icon: "package" },
  { to: "/account/returns", label: "Returns", icon: "refresh" },
  { to: "/account/messages", label: "Messages", icon: "bell" },
  { to: "/account/profile", label: "Profile", icon: "user" },
  { to: "/account/addresses", label: "Addresses", icon: "mapPin" },
  { to: "/account/reviews", label: "My reviews", icon: "star" },
  { to: "/account/wishlist", label: "Wishlist", icon: "heart" },
];

export function AccountLayout() {
  const { user_info } = useAppSelector((state) => state.authSlice);
  const { email, first_name, last_name } = user_info ?? {};

  return (
    <div className={s.wrap}>
      <aside className={s.rail}>
        <div className={s.who}>
          <Thumb
            hue={random_hue((first_name + last_name).length)}
            size={38}
            label={`${first_name} ${last_name}`}
            radius={999}
          />
          <div>
            <div className={s.name}>
              {first_name} {last_name}
            </div>
            <div className={s.mail}>{email}</div>
          </div>
        </div>
        <nav className={s.nav}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => cn(s.link, isActive && s.on)}
            >
              <Icon name={l.icon} size={16} /> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
