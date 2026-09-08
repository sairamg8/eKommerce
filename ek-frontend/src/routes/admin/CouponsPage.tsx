import type { Coupon } from "../../mock/types";
import { date, money, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as adminApi from "../../mock/api/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../store/ToastContext";
import f from "./Filters.module.css";

export function AdminCouponsPage() {
  const t = useTableQuery({ sort: "usage_count", dir: "desc", perPage: 10 });
  const { push } = useToast();
  const { data, loading, refetch } = useApi(
    () => adminApi.listCoupons({
      page: t.page, per_page: t.perPage, q: t.q, sort: t.sort, dir: t.dir,
    }),
    [t.q, t.page, t.sort, t.dir],
  );

  const toggle = async (c: Coupon) => {
    try {
      const next = await adminApi.toggleCoupon(c.id);
      push(`${next.code} ${next.is_active ? "activated" : "deactivated"}`, next.is_active ? "success" : "info");
      refetch();
    } catch (e) {
      push(e instanceof Error ? e.message : "Action failed", "error");
    }
  };

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", sortable: true,
      render: (c) => (
        <div>
          <div className="mono" style={{ fontWeight: 700, letterSpacing: "0.02em" }}>{c.code}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{c.description}</div>
        </div>
      ) },
    { key: "discount", header: "Discount",
      render: (c) => (
        <span style={{ fontWeight: 600 }}>
          {c.discount_type === "percentage" ? `${c.discount_value}%` : money(c.discount_value)}
          {c.max_discount && (
            <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "var(--fs-xs)" }}>
              {" "}max {money(c.max_discount)}
            </span>
          )}
        </span>
      ) },
    { key: "min_order_value", header: "Min order", numeric: true,
      render: (c) => (c.min_order_value ? money(c.min_order_value) : "—") },
    { key: "usage_count", header: "Redeemed", numeric: true, sortable: true,
      render: (c) => (
        <span>
          {num(c.usage_count)}
          <span style={{ color: "var(--text-muted)" }}>{c.usage_limit ? ` / ${num(c.usage_limit)}` : ""}</span>
        </span>
      ) },
    { key: "expires_at", header: "Expires", sortable: true, render: (c) => date(c.expires_at) },
    { key: "is_active", header: "Status",
      render: (c) => <Badge tone={c.is_active ? "success" : "neutral"} dot>{c.is_active ? "active" : "inactive"}</Badge> },
    { key: "actions", header: "", width: 110,
      render: (c) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); void toggle(c); }}>
            {c.is_active ? "Disable" : "Enable"}
          </Button>
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discount codes applied at checkout"
        actions={<Button size="sm"><Icon name="plus" size={14} /> New coupon</Button>} />
      <div className={f.bar}>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={t.q} onChange={(e) => t.setQ(e.target.value)}
                 placeholder="Search coupons…" icon={<Icon name="search" size={15} />}
                 aria-label="Search coupons" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={t.setPage} rowKey={(c) => c.id} unit="coupons"
                   sort={t.sort} dir={t.dir} onSort={t.onSort}
                   emptyTitle="No coupons match" />
      </Card>
    </div>
  );
}
