import { useState } from "react";
import type { DeliveryTask, Shipment } from "../../mock/types";
import { date, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as deliveryApi from "../../mock/api/delivery";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { DeliveryStatusBadge } from "../../components/order/StatusBadge";
import { CURRENT_AGENT } from "../../components/layout/DeliveryLayout";
import { taskForShipment } from "../../mock/db";
import { ScanDrawer } from "./ScanDrawer";
import f from "../admin/Filters.module.css";

export function DeliveryShipmentsPage() {
  const a = CURRENT_AGENT;
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [active, setActive] = useState<DeliveryTask | null>(null);

  const { data, loading } = useApi(
    () => deliveryApi.listAgentShipments(a.id, { page, per_page: 12, q }),
    [a.id, q, page, nonce],
  );

  const columns: Column<Shipment>[] = [
    { key: "awb", header: "AWB",
      render: (sh) => <span className="mono" style={{ fontWeight: 600 }}>{sh.awb}</span> },
    { key: "customer_name", header: "Customer",
      render: (sh) => (
        <div>
          <div style={{ fontWeight: 550 }}>{sh.customer_name}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{sh.customer_phone}</div>
        </div>
      ) },
    { key: "destination", header: "Destination",
      render: (sh) => (
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }} className="truncate">
          {sh.destination}
        </span>
      ) },
    { key: "status", header: "Status", render: (sh) => <DeliveryStatusBadge status={sh.status} /> },
    { key: "is_cod", header: "COD", numeric: true,
      render: (sh) => (sh.is_cod ? <Badge tone="warning">{money(sh.cod_amount)}</Badge> : "—") },
    { key: "attempts", header: "Attempts", numeric: true, render: (sh) => sh.attempts },
    { key: "eta", header: "ETA", render: (sh) => date(sh.delivered_at ?? sh.eta) },
    { key: "actions", header: "", width: 100,
      render: (sh) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="sm" variant="secondary" onClick={(e) => {
            e.stopPropagation();
            const t = taskForShipment(sh.id);
            if (t) setActive(t);
          }}>
            Scan
          </Button>
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader title="All shipments" subtitle="Everything assigned to you, past and present" />
      <div className={f.bar}>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                 placeholder="AWB, customer, order…" icon={<Icon name="search" size={15} />}
                 aria-label="Search shipments" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={setPage} rowKey={(sh) => sh.id} unit="shipments"
                   emptyTitle="No shipments assigned" />
      </Card>
      <ScanDrawer task={active} onClose={() => setActive(null)}
                  onDone={() => { setActive(null); setNonce((n) => n + 1); }} />
    </div>
  );
}
