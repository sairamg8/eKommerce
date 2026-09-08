import { useState } from "react";
import type { Payout } from "../../mock/types";
import { compactMoney, date, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as merchantApi from "../../mock/api/merchant";
import { Badge } from "../../components/ui/Badge";
import type { Tone } from "../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { BarChart } from "../../components/charts/BarChart";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import { payoutsForMerchant } from "../../mock/db";

const TONE: Record<Payout["status"], Tone> = {
  pending: "warning", processing: "info", paid: "success", failed: "danger",
};

export function MerchantPayoutsPage() {
  const m = CURRENT_MERCHANT;
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(
    () => merchantApi.listPayouts(m.id, { page, per_page: 10 }), [page],
  );

  const all = payoutsForMerchant(m.id);
  const pending = all.filter((p) => p.status === "pending");
  const paid = all.filter((p) => p.status === "paid");

  const columns: Column<Payout>[] = [
    { key: "period", header: "Period",
      render: (p) => <span style={{ fontWeight: 550 }}>{date(p.period_start)} – {date(p.period_end)}</span> },
    { key: "orders_count", header: "Orders", numeric: true, render: (p) => p.orders_count },
    { key: "gross", header: "Gross sales", numeric: true, render: (p) => money(p.gross) },
    { key: "commission", header: `Commission (${m.commission_pct}%)`, numeric: true,
      render: (p) => <span style={{ color: "var(--text-muted)" }}>−{money(p.commission)}</span> },
    { key: "refunds", header: "Refunds", numeric: true,
      render: (p) => (p.refunds ? <span style={{ color: "var(--danger-fg)" }}>−{money(p.refunds)}</span> : "—") },
    { key: "net", header: "Net received", numeric: true,
      render: (p) => <span style={{ fontWeight: 700 }}>{money(p.net)}</span> },
    { key: "status", header: "Status", render: (p) => <Badge tone={TONE[p.status]} dot>{p.status}</Badge> },
    { key: "utr", header: "UTR",
      render: (p) => (p.utr ? <span className="mono" style={{ fontSize: "var(--fs-xs)" }}>{p.utr}</span> : "—") },
    { key: "settled_at", header: "Settled", render: (p) => (p.settled_at ? date(p.settled_at) : "—") },
  ];

  return (
    <div>
      <PageHeader title="Payouts"
        subtitle={`Settled weekly. The platform keeps ${m.commission_pct}% commission on item subtotal.`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
        <StatCard label="Pending payout" value={compactMoney(pending.reduce((s, p) => s + p.net, 0))}
                  note={`${pending.length} cycle${pending.length === 1 ? "" : "s"}`} icon="clock" tone="var(--chart-3)" />
        <StatCard label="Received all time" value={compactMoney(paid.reduce((s, p) => s + p.net, 0))}
                  note={`${paid.length} settlements`} icon="wallet" tone="var(--chart-2)" />
        <StatCard label="Commission paid" value={compactMoney(all.reduce((s, p) => s + p.commission, 0))}
                  note="platform fee" icon="rupee" tone="var(--chart-4)" />
        <StatCard label="Refunds deducted" value={compactMoney(all.reduce((s, p) => s + p.refunds, 0))}
                  icon="refresh" tone="var(--chart-6)" />
      </div>

      <Card style={{ marginBottom: "var(--sp-4)" }}>
        <CardHeader title="Net earnings by cycle" subtitle="Last 8 weekly settlements" />
        <CardBody>
          <BarChart
            data={all.slice(0, 8).reverse().map((p) => ({
              label: `${date(p.period_start)} – ${date(p.period_end)}`,
              value: p.net,
              meta: `${p.orders_count} orders`,
            }))}
            format={compactMoney}
          />
        </CardBody>
      </Card>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={setPage} rowKey={(p) => p.id} unit="settlements"
                   emptyTitle="No payouts yet" />
      </Card>
    </div>
  );
}
