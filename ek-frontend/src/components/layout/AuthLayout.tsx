import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { activeProducts, activeMerchants, orders } from "../../mock/db";
import { num } from "../../lib/format";
import s from "./AuthLayout.module.css";

export function AuthLayout({ title, subtitle, children, panel }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  panel?: { quote: string; points: { icon: string; title: string; desc: string }[] };
}) {
  const p = panel ?? {
    quote: "One marketplace. Thousands of products, from merchants you can trust.",
    points: [
      { icon: "truck", title: "Live order tracking", desc: "Follow every package from the warehouse to your door." },
      { icon: "shield", title: "Buyer protection", desc: "14-day returns and refunds on everything you buy." },
      { icon: "bell", title: "Talk to the seller", desc: "Message merchants directly about any order." },
    ],
  };

  return (
    <div className={s.wrap}>
      <section className={s.formSide}>
        <div className={s.form}>
          <Link to="/" className={s.brandRow}>
            <span className={s.mark}>e</span> eKommerce
          </Link>
          <div>
            <h1 className={s.h1}>{title}</h1>
            <p className={s.sub}>{subtitle}</p>
          </div>
          {children}
        </div>
      </section>

      <aside className={s.brandSide}>
        <div className={s.bInner}>
          <p className={s.bQuote}>{p.quote}</p>
          <div className={s.bList}>
            {p.points.map((pt) => (
              <div key={pt.title} className={s.bItem}>
                <span className={s.bIco}><Icon name={pt.icon} size={16} /></span>
                <span>
                  <span className={s.bT} style={{ display: "block" }}>{pt.title}</span>
                  <span className={s.bD}>{pt.desc}</span>
                </span>
              </div>
            ))}
          </div>
          <div className={s.stats}>
            <div>
              <div className={s.sv}>{num(activeProducts.length)}</div>
              <div className={s.sl}>Products</div>
            </div>
            <div>
              <div className={s.sv}>{activeMerchants.length}</div>
              <div className={s.sl}>Merchants</div>
            </div>
            <div>
              <div className={s.sv}>{num(orders.length)}</div>
              <div className={s.sl}>Orders shipped</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
