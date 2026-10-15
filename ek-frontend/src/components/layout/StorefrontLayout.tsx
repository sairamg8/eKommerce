import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { useCart } from "../../store/CartContext";
import { categories } from "../../mock/db";
import s from "./StorefrontLayout.module.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useLogoutMutation } from "../../store/slices/auth/auth_api";

const ROOTS = categories.filter((c) => c.depth === 0);

export function StorefrontLayout() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const [logout, { isLoading }] = useLogoutMutation();

  const { user_info, is_logged_in, refresh_token } = useSelector(
    (state: RootState) => state.authSlice,
  );
  const { first_name } = user_info ?? {};

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    logout({ refresh_token });
  };

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.inner}>
          <Link to="/" className={s.brand}>
            <span className={s.mark}>e</span>
            eKommerce
          </Link>

          <form className={s.search} onSubmit={submit} role="search">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands and merchants…"
              icon={<Icon name="search" size={15} />}
              aria-label="Search products"
            />
          </form>

          <nav className={s.nav}>
            <li>
              <NavLink to="/products" className={s.navLink}>
                <Icon name="grid" size={16} />{" "}
                <span className={s.navLabel}>Browse</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/track" className={s.navLink}>
                <Icon name="truck" size={16} />{" "}
                <span className={s.navLabel}>Track</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/support" className={s.navLink}>
                <Icon name="info" size={16} />{" "}
                <span className={s.navLabel}>Support</span>
              </NavLink>
            </li>
            <li className={s.sub_menu}>
              <NavLink
                to={is_logged_in ? "/account/orders" : "/login"}
                className={s.navLink}
              >
                <Icon name="user" size={16} />
                <span className={s.navLabel}>
                  {is_logged_in ? first_name : "Sign in"}
                </span>
                {is_logged_in && (
                  <ul className={s.user_options}>
                    <li onClick={handleLogout}>
                      {isLoading ? "Please wait..." : "Logout"}
                    </li>
                  </ul>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/cart"
                className={cn(s.navLink, s.cartBtn)}
                aria-label="Cart"
              >
                <Icon name="cart" size={17} />
                {count > 0 && <span className={s.count}>{count}</span>}
              </NavLink>
            </li>
          </nav>
        </div>

        <div className={s.catbar}>
          <div className={s.catinner}>
            <NavLink
              to="/products"
              end
              className={({ isActive }) => cn(s.cat, isActive && s.catOn)}
            >
              All
            </NavLink>
            {ROOTS.map((c) => (
              <NavLink
                key={c.id}
                to={`/products?category=${c.slug}`}
                className={({ isActive }) => cn(s.cat, isActive && s.catOn)}
              >
                {c.name}
              </NavLink>
            ))}
            <NavLink
              to="/merchants"
              className={({ isActive }) => cn(s.cat, isActive && s.catOn)}
            >
              Merchants
            </NavLink>
          </div>
        </div>
      </header>

      <main className={s.main}>
        <Outlet />
      </main>

      <footer className={s.footer}>
        <div className={s.finner}>
          <div className={s.fcol}>
            <span className={s.brand}>
              <span className={s.mark}>e</span> eKommerce
            </span>
            <span>A multi-vendor marketplace prototype.</span>
          </div>
          <div className={s.fcol}>
            <span className={s.fh}>Shop</span>
            <Link to="/products">All products</Link>
            <Link to="/merchants">Merchants</Link>
            <Link to="/track">Track an order</Link>
            <Link to="/support">Help &amp; support</Link>
            <Link to="/account/messages">Messages</Link>
          </div>
          <div className={s.fcol}>
            <span className={s.fh}>Sell</span>
            <Link to="/merchant">Merchant console</Link>
            <Link to="/merchant/products">Manage catalogue</Link>
            <Link to="/merchant/payouts">Payouts</Link>
          </div>
          <div className={s.fcol}>
            <span className={s.fh}>Operate</span>
            <Link to="/admin">Admin console</Link>
            <Link to="/delivery">Delivery portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
