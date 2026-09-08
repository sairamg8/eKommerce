import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Shipment } from "../../mock/types";
import { date, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as ordersApi from "../../mock/api/orders";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { DeliveryStatusBadge } from "../../components/order/StatusBadge";
import { shipments, couriers } from "../../mock/db";
import f from "./Filters.module.css";

export function AdminShipmentsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, loading } = useApi(
    () => ordersApi.listShipments({ page, per_page: 12, q }), [q, page],
  );

  const failed = shipments.filter((s) => s.status === "failed_attempt").length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const onTime = ((delivered / Math.max(shipments.length, 1)) * 100).toFixed(1);

  const columns: Column<Shipment>[] = [
    { key: "awb", header: "AWB",
      render: (s) => <span className="mono" style={{ fontWeight: 600 }}>{s.awb}</span> },
    { key: "order_number", header: "Order",
      render: (s) => <span className="mono">{s.order_number}</span> },
    { key: "merchant_name", header: "Merchant", render: (s) => s.merchant_name },
    { key: "courier_name", header: "Courier",
      render: (s) => (
        <div>
          <div style={{ fontWeight: 550 }}>{s.courier_name}</div>
          {s.agent_name && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{s.agent_name}</div>
          )}
        </div>
      ) },
    { key: "destination", header: "Destination",
      render: (s) => (
        <div>
          <div>{s.customer_name}</div>
          <div className="mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{s.pincode}</div>
        </div>
      ) },
    { key: "status", header: "Status", render: (s) => <DeliveryStatusBadge status={s.status} /> },
    { key: "is_cod", header: "COD", numeric: true,
      render: (s) => (s.is_cod ? <Badge tone="warning">{money(s.cod_amount)}</Badge> : "—") },
    { key: "attempts", header: "Attempts", numeric: true, render: (s) => s.attempts },
    { key: "eta", header: "ETA", render: (s) => date(s.delivered_at ?? s.eta) },
  ];

  return (
    <div>
      <PageHeader title="Shipments" subtitle="Every package moving through the courier network" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
        <StatCard label="Total shipments" value={String(shipments.length)} icon="truck" tone="var(--chart-1)" />
        <StatCard label="Delivered" value={String(delivered)} note={`${onTime}% of all`} icon="check" tone="var(--chart-2)" />
        <StatCard label="Failed attempts" value={String(failed)} note="need re-attempt" icon="alert" tone="var(--chart-3)" />
        <StatCard label="Courier partners" value={String(couriers.length)} icon="package" tone="var(--chart-4)" />
      </div>

      <div className={f.bar}>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                 placeholder="AWB, order, customer…" icon={<Icon name="search" size={15} />}
                 aria-label="Search shipments" />
        </div>
      </div>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={setPage} rowKey={(s) => s.id} unit="shipments"
                   onRowClick={(s) => navigate(`/track?awb=${s.awb}`)}
                   emptyTitle="No shipments match" />
      </Card>
    </div>
  );
}
