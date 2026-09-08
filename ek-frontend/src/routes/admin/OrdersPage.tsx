import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Order, OrderStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { date, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as ordersApi from "../../mock/api/orders";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "../../components/order/StatusBadge";
import f from "./Filters.module.css";

const TABS = ["", "pending", "paid", "shipped", "delivered", "cancelled", "refunded"];

export function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const t = useTableQuery({ sort: "placed_at", dir: "desc", perPage: 12 });
  const navigate = useNavigate();

  const { data, loading } = useApi(
    () => ordersApi.listOrders({
      page: t.page, per_page: t.perPage, q: t.q, sort: t.sort, dir: t.dir,
      ...(status ? { status: status as OrderStatus } : {}),
    }),
    [status, t.q, t.page, t.sort, t.dir],
  );

  const columns: Column<Order>[] = [
    { key: "order_number", header: "Order", sortable: true,
      render: (o) => <span className="mono" style={{ fontWeight: 600 }}>{o.order_number}</span> },
    { key: "customer_name", header: "Customer",
      render: (o) => (
        <div>
          <div style={{ fontWeight: 550 }}>{o.customer_name}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{o.customer_email}</div>
        </div>
      ) },
    { key: "merchant_count", header: "Merchants", numeric: true,
      render: (o) => (
        <span title={[...new Set(o.items.map((i) => i.merchant_name))].join(", ")}>
          {o.merchant_count}
        </span>
      ) },
    { key: "item_count", header: "Items", numeric: true, render: (o) => o.item_count },
    { key: "status", header: "Status", render: (o) => <OrderStatusBadge status={o.status} /> },
    { key: "payment_status", header: "Payment", render: (o) => <PaymentStatusBadge status={o.payment_status} /> },
    { key: "total", header: "Total", numeric: true, sortable: true,
      render: (o) => <span style={{ fontWeight: 600 }}>{money(o.total)}</span> },
    { key: "placed_at", header: "Placed", sortable: true, render: (o) => date(o.placed_at) },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="Every order across the marketplace"
        actions={<Button size="sm" variant="secondary"><Icon name="download" size={14} /> Export</Button>} />

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
                 placeholder="Order number, customer…" icon={<Icon name="search" size={15} />}
                 aria-label="Search orders" />
        </div>
      </div>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={t.setPage} rowKey={(o) => o.id} unit="orders"
                   sort={t.sort} dir={t.dir} onSort={t.onSort}
                   onRowClick={(o) => navigate(`/account/orders/${o.id}`)}
                   emptyTitle="No orders match" />
      </Card>
    </div>
  );
}
