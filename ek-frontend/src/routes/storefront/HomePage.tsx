import { Link } from "react-router-dom";
import { compactMoney, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as catalogApi from "../../mock/api/catalog";
import { categories, activeMerchants, activeProducts, orders } from "../../mock/db";
import { ProductCard } from "../../components/product/ProductCard";
import { Icon } from "../../components/ui/Icon";
import { Rating } from "../../components/ui/Rating";
import { Skeleton } from "../../components/ui/Skeleton";
import { Thumb } from "../../components/ui/Thumb";
import s from "./HomePage.module.css";

const ROOTS = categories.filter((c) => c.depth === 0);
const CAT_ICONS: Record<string, string> = {
  electronics: "bell", computers: "grid", "home-kitchen": "home",
  fashion: "tag", fitness: "heart", books: "file",
};

const GMV = orders.reduce((t, o) => t + o.total, 0);

export function HomePage() {
  const trending = useApi(() => catalogApi.listProducts({ sort: "popular", per_page: 5 }), []);
  const newest = useApi(() => catalogApi.listProducts({ sort: "newest", per_page: 5 }), []);

  return (
    <div>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}><Icon name="store" size={13} /> Multi-vendor marketplace</span>
          <h1 className={s.h1}>Everything you need, from merchants you can trust.</h1>
          <p className={s.sub}>
            {num(activeProducts.length)} products across {activeMerchants.length} verified
            merchants — with live order tracking from warehouse to doorstep.
          </p>
          <div className={s.ctas}>
            <Link to="/products" className={s.solidBtn}>
              Start shopping <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/merchant" className={s.ghostBtn}>
              <Icon name="package" size={16} /> Sell on eKommerce
            </Link>
          </div>
        </div>
        <div className={s.stats}>
          <div className={s.stat}>
            <span className={s.statV}>{num(activeProducts.length)}</span>
            <span className={s.statL}>Products listed</span>
          </div>
          <div className={s.stat}>
            <span className={s.statV}>{activeMerchants.length}</span>
            <span className={s.statL}>Verified merchants</span>
          </div>
          <div className={s.stat}>
            <span className={s.statV}>{num(orders.length)}</span>
            <span className={s.statL}>Orders placed</span>
          </div>
          <div className={s.stat}>
            <span className={s.statV}>{compactMoney(GMV)}</span>
            <span className={s.statL}>Gross merchandise value</span>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sechead}>
          <div>
            <h2 className={s.sh}>Shop by category</h2>
            <p className={s.ss}>Six departments, {categories.filter((c) => c.depth === 1).length} sub-categories</p>
          </div>
        </div>
        <div className={s.cats}>
          {ROOTS.map((c, i) => (
            <Link key={c.id} to={`/products?category=${c.slug}`} className={s.cat}>
              <span className={s.catIco}
                    style={{
                      background: `hsl(${(i * 55 + 220) % 360} 70% 95%)`,
                      color: `hsl(${(i * 55 + 220) % 360} 55% 40%)`,
                    }}>
                <Icon name={CAT_ICONS[c.slug] ?? "grid"} size={17} />
              </span>
              <span className={s.catN}>{c.name}</span>
              <span className={s.catC}>{c.product_count} products</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sechead}>
          <div>
            <h2 className={s.sh}>Trending now</h2>
            <p className={s.ss}>Best sellers across the marketplace this month</p>
          </div>
          <Link to="/products?sort=popular" className={s.more}>
            View all <Icon name="chevronRight" size={14} />
          </Link>
        </div>
        <div className={s.grid}>
          {trending.loading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} h={300} radius={12} />)
            : trending.data?.data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sechead}>
          <div>
            <h2 className={s.sh}>Featured merchants</h2>
            <p className={s.ss}>Independent sellers, vetted and rated by customers</p>
          </div>
          <Link to="/merchants" className={s.more}>
            All merchants <Icon name="chevronRight" size={14} />
          </Link>
        </div>
        <div className={s.merchants}>
          {activeMerchants.map((m) => (
            <Link key={m.id} to={`/products?merchant=${m.slug}`} className={s.merchant}>
              <Thumb hue={m.logo_hue} size={40} label={m.business_name} />
              <div>
                <div className={s.mName}>{m.business_name}</div>
                <div className={s.mMeta}>{m.product_count} products · {m.city}</div>
                <Rating value={m.rating} count={m.rating_count} size={11} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sechead}>
          <div>
            <h2 className={s.sh}>New arrivals</h2>
            <p className={s.ss}>Freshly listed by our merchants</p>
          </div>
          <Link to="/products?sort=newest" className={s.more}>
            View all <Icon name="chevronRight" size={14} />
          </Link>
        </div>
        <div className={s.grid}>
          {newest.loading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} h={300} radius={12} />)
            : newest.data?.data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
