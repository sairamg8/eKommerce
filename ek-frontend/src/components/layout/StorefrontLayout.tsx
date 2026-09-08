import { Link, NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { useCart } from "../../store/CartContext";
import { useAuth } from "../../store/AuthContext";
import { categories } from "../../mock/db";
import s from "./StorefrontLayout.module.css";

const ROOTS = categories.filter((c) => c.depth === 0);

export function StorefrontLayout() {
  const { count } = useCart();
  const { isAuthed, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q)}`);
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
            <NavLink to="/products" className={s.navLink}>
              <Icon name="grid" size={16} /> <span className={s.navLabel}>Browse</span>
            </NavLink>
            <NavLink to="/track" className={s.navLink}>
              <Icon name="truck" size={16} /> <span className={s.navLabel}>Track</span>
            </NavLink>
            <NavLink to="/support" className={s.navLink}>
              <Icon name="info" size={16} /> <span className={s.navLabel}>Support</span>
            </NavLink>
            <NavLink to={isAuthed ? "/account/orders" : "/login"} className={s.navLink}>
              <Icon name="user" size={16} />
              <span className={s.navLabel}>{isAuthed ? user?.first_name : "Sign in"}</span>
            </NavLink>
            <NavLink to="/cart" className={cn(s.navLink, s.cartBtn)} aria-label="Cart">
              <Icon name="cart" size={17} />
              {count > 0 && <span className={s.count}>{count}</span>}
            </NavLink>
          </nav>
        </div>

        <div className={s.catbar}>
          <div className={s.catinner}>
            <NavLink to="/products" end
              className={({ isActive }) => cn(s.cat, isActive && s.catOn)}>All</NavLink>
            {ROOTS.map((c) => (
              <NavLink key={c.id} to={`/products?category=${c.slug}`}
                className={({ isActive }) => cn(s.cat, isActive && s.catOn)}>
                {c.name}
              </NavLink>
            ))}
            <NavLink to="/merchants" className={({ isActive }) => cn(s.cat, isActive && s.catOn)}>
              Merchants
            </NavLink>
          </div>
        </div>
      </header>

      <main className={s.main}><Outlet /></main>

      <footer className={s.footer}>
        <div className={s.finner}>
          <div className={s.fcol}>
            <span className={s.brand}><span className={s.mark}>e</span> eKommerce</span>
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
