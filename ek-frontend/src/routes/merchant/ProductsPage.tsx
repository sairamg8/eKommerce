import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../mock/types";
import { cn } from "../../lib/cn";
import { money, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as merchantApi from "../../mock/api/merchant";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Thumb } from "../../components/ui/Thumb";
import { useToast } from "../../store/ToastContext";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import f from "../admin/Filters.module.css";

const TABS = ["", "active", "draft", "archived"];

export function MerchantProductsPage() {
  const m = CURRENT_MERCHANT;
  const [status, setStatus] = useState("");
  const t = useTableQuery({ sort: "updated_at", dir: "desc", perPage: 10 });
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ price: "", status: "active", threshold: "" });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const navigate = useNavigate();

  const { data, loading, refetch } = useApi(
    () => merchantApi.listProducts(m.id, {
      page: t.page, per_page: t.perPage, q: t.q, sort: t.sort, dir: t.dir,
      status: status || undefined,
    }),
    [status, t.q, t.page, t.sort, t.dir],
  );

  const open = (p: Product) => {
    setEditing(p);
    setForm({ price: String(p.price / 100), status: p.status, threshold: String(p.low_stock_threshold) });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await merchantApi.updateProduct(editing.id, {
        price: Math.round(Number(form.price) * 100),
        status: form.status as Product["status"],
        low_stock_threshold: Number(form.threshold),
      });
      push(`${editing.name} updated`, "success");
      setEditing(null);
      refetch();
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Product>[] = [
    { key: "name", header: "Product", sortable: true,
      render: (p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Thumb hue={p.image_hue} size={38} label={p.name} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 550 }} className="truncate">{p.name}</div>
            <div className="mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
              {p.sku} · {p.category_name}
            </div>
          </div>
        </div>
      ) },
    { key: "status", header: "Status",
      render: (p) => (
        <Badge tone={p.status === "active" ? "success" : p.status === "draft" ? "warning" : "neutral"} dot>
          {p.status}
        </Badge>
      ) },
    { key: "price", header: "Price", numeric: true, sortable: true,
      render: (p) => <span style={{ fontWeight: 600 }}>{money(p.price)}</span> },
    { key: "cost", header: "Margin", numeric: true,
      render: (p) => (
        <span style={{ color: "var(--success-fg)", fontWeight: 600 }}>
          {(((p.price - p.cost) / p.price) * 100).toFixed(0)}%
        </span>
      ) },
    { key: "stock", header: "Stock", numeric: true, sortable: true,
      render: (p) => (
        <span style={{
          fontWeight: 600,
          color: p.stock === 0 ? "var(--danger-fg)" : p.stock <= p.low_stock_threshold ? "var(--warning-fg)" : "inherit",
        }}>
          {num(p.stock)}
        </span>
      ) },
    { key: "units_sold", header: "Sold", numeric: true, sortable: true, render: (p) => num(p.units_sold) },
    { key: "actions", header: "", width: 90,
      render: (p) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); open(p); }}>
            <Icon name="edit" size={13} /> Edit
          </Button>
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader title="My products" subtitle={`${m.product_count} listings in your catalogue`}
        actions={<Button size="sm" onClick={() => navigate("/merchant/products/new")}>
          <Icon name="plus" size={14} /> New product
        </Button>} />

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
        <div className={f.search}>
          <Input value={t.q} onChange={(e) => t.setQ(e.target.value)}
                 placeholder="Search your products…" icon={<Icon name="search" size={15} />}
                 aria-label="Search products" />
        </div>
      </div>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={t.setPage} rowKey={(p) => p.id} unit="products"
                   sort={t.sort} dir={t.dir} onSort={t.onSort}
                   emptyTitle="No products match" />
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)}
             title="Edit listing" subtitle={editing?.name}
             footer={
               <>
                 <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                 <Button disabled={busy} onClick={() => void save()}>
                   {busy ? "Saving…" : "Save changes"}
                 </Button>
               </>
             }>
        <div style={{ display: "grid", gap: 14 }}>
          <Input label="Price (₹)" value={form.price} inputMode="decimal"
                 onChange={(e) => setForm({ ...form, price: e.target.value })}
                 hint="Stored as paise on the server — never a float" required />
          <Select label="Listing status" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  options={[
                    { value: "active", label: "Active — visible to shoppers" },
                    { value: "draft", label: "Draft — hidden" },
                    { value: "archived", label: "Archived" },
                  ]} />
          <Input label="Low-stock threshold" value={form.threshold} inputMode="numeric"
                 onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                 hint="You get an alert when stock falls to this level" />
          {editing && (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", padding: "10px 12px", background: "var(--surface-sunken)", borderRadius: 8 }}>
              Current stock is <strong>{editing.stock}</strong>. Stock is not editable here —
              it is the sum of the movement ledger. Use Inventory to restock.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
