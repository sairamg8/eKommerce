import { useState } from "react";
import { Link } from "react-router-dom";
import { num } from "../../lib/format";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { Rating } from "../../components/ui/Rating";
import { Select } from "../../components/ui/Select";
import { Thumb } from "../../components/ui/Thumb";
import { activeMerchants } from "../../mock/db";
import s from "./MerchantsPage.module.css";

const SORTS = [
  { value: "rating", label: "Highest rated" },
  { value: "products", label: "Most products" },
  { value: "newest", label: "Newest sellers" },
  { value: "name", label: "Name (A–Z)" },
];

export function MerchantsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rating");

  const rows = activeMerchants
    .filter((m) => {
      const needle = q.trim().toLowerCase();
      return !needle
        || m.business_name.toLowerCase().includes(needle)
        || m.city.toLowerCase().includes(needle);
    })
    .slice()
    .sort((a, b) => {
      if (sort === "products") return b.product_count - a.product_count;
      if (sort === "newest") return b.joined_at.localeCompare(a.joined_at);
      if (sort === "name") return a.business_name.localeCompare(b.business_name);
      return b.rating - a.rating;
    });

  return (
    <div>
      <div className={s.head}>
        <h1 className={s.h1}>Merchants</h1>
        <p className={s.sub}>
          {activeMerchants.length} verified sellers on the marketplace — every one KYC-checked
        </p>
      </div>

      <div className={s.tools}>
        <div className={s.search}>
          <Input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search merchants or cities…"
                 icon={<Icon name="search" size={15} />} aria-label="Search merchants" />
        </div>
        <div style={{ width: 190 }}>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}
                  options={SORTS} aria-label="Sort merchants" />
        </div>
        <span style={{ flex: 1 }} />
        <Link to="/sell">
          <Button variant="secondary"><Icon name="store" size={15} /> Become a merchant</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<Icon name="store" size={20} />} title="No merchants match"
                      description="Try a different name or city." />
        </Card>
      ) : (
        <div className={s.grid}>
          {rows.map((m) => (
            <Card key={m.id} className={s.card}>
              <div className={s.top}>
                <Thumb hue={m.logo_hue} size={48} label={m.business_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.name}>{m.business_name}</div>
                  <div className={s.where}>{m.city}, {m.state}</div>
                </div>
                <Badge tone="success" dot>Verified</Badge>
              </div>

              <Rating value={m.rating} count={m.rating_count} size={14} />

              <div className={s.stats}>
                <div>
                  <div className={`${s.sv} tabular`}>{num(m.product_count)}</div>
                  <div className={s.sl}>Products</div>
                </div>
                <div>
                  <div className={`${s.sv} tabular`}>{num(m.orders_count)}</div>
                  <div className={s.sl}>Orders shipped</div>
                </div>
                <div>
                  <div className={`${s.sv} tabular`}>{(m.on_time_rate * 100).toFixed(0)}%</div>
                  <div className={s.sl}>On-time delivery</div>
                </div>
              </div>

              <div className={s.actions}>
                <Link to={`/products?merchant=${m.slug}`} style={{ flex: 1 }}>
                  <Button size="sm" block>Browse products</Button>
                </Link>
                <Link to="/account/messages">
                  <Button size="sm" variant="secondary" aria-label="Message merchant">
                    <Icon name="bell" size={14} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
