import { useState } from "react";
import type { Product } from "../../mock/types";
import { cn } from "../../lib/cn";
import { money, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as adminApi from "../../mock/api/admin";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Rating } from "../../components/ui/Rating";
import { Select } from "../../components/ui/Select";
import { Thumb } from "../../components/ui/Thumb";
import { merchants } from "../../mock/db";
import f from "./Filters.module.css";

const TABS = ["", "active", "draft", "archived"];

export function AdminProductsPage() {
  const [status, setStatus] = useState("");
  const [merchant, setMerchant] = useState("");
  const t = useTableQuery({ sort: "units_sold", dir: "desc", perPage: 12 });

  const { data, loading } = useApi(
    () => adminApi.listAllProducts({
      page: t.page, per_page: t.perPage, q: t.q, sort: t.sort, dir: t.dir,
      status: status || undefined, merchant: merchant || undefined,
    }),
    [status, merchant, t.q, t.page, t.sort, t.dir],
  );

  const columns: Column<Product>[] = [
    { key: "name", header: "Product", sortable: true,
      render: (p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Thumb hue={p.image_hue} size={36} label={p.name} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 550 }} className="truncate">{p.name}</div>
            <div className="mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{p.sku}</div>
          </div>
        </div>
      ) },
    { key: "merchant_name", header: "Merchant", render: (p) => p.merchant_name },
    { key: "category_name", header: "Category", render: (p) => p.category_name },
    { key: "status", header: "Status",
      render: (p) => (
        <Badge tone={p.status === "active" ? "success" : p.status === "draft" ? "warning" : "neutral"} dot>
          {p.status}
        </Badge>
      ) },
    { key: "price", header: "Price", numeric: true, sortable: true,
      render: (p) => <span style={{ fontWeight: 600 }}>{money(p.price)}</span> },
    { key: "stock", header: "Stock", numeric: true, sortable: true,
      render: (p) => (
        <span style={{
          fontWeight: 600,
          color: p.stock === 0 ? "var(--danger-fg)"
            : p.stock <= p.low_stock_threshold ? "var(--warning-fg)" : "inherit",
        }}>
          {num(p.stock)}
        </span>
      ) },
    { key: "units_sold", header: "Sold", numeric: true, sortable: true, render: (p) => num(p.units_sold) },
    { key: "avg_rating", header: "Rating",
      render: (p) => <Rating value={p.avg_rating} count={p.review_count} size={11} /> },
  ];

  return (
    <div>
      <PageHeader title="Catalogue" subtitle="Every product listed by every merchant" />

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((tab) => (
            <button key={tab} className={cn(f.tab, status === tab && f.tabOn)}
                    onClick={() => { setStatus(tab); t.resetPage(); }}>
              {tab === "" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className={f.spacer} />
        <div className={f.select}>
          <Select dense value={merchant} onChange={(e) => { setMerchant(e.target.value); t.resetPage(); }}
                  aria-label="Filter by merchant"
                  options={[{ value: "", label: "All merchants" },
                            ...merchants.map((m) => ({ value: m.id, label: m.business_name }))]} />
        </div>
        <div className={f.search}>
          <Input value={t.q} onChange={(e) => t.setQ(e.target.value)}
                 placeholder="Search catalogue…" icon={<Icon name="search" size={15} />}
                 aria-label="Search products" />
        </div>
      </div>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={t.setPage} rowKey={(p) => p.id} unit="products"
                   sort={t.sort} dir={t.dir} onSort={t.onSort}
                   emptyTitle="No products match" />
      </Card>
    </div>
  );
}
