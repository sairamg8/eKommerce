import { useState } from "react";
import type { Payout } from "../../mock/types";
import { cn } from "../../lib/cn";
import { compactMoney, date, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as adminApi from "../../mock/api/admin";
import { Badge } from "../../components/ui/Badge";
import type { Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../store/ToastContext";
import { payouts } from "../../mock/db";
import f from "./Filters.module.css";

const TONE: Record<Payout["status"], Tone> = {
  pending: "warning", processing: "info", paid: "success", failed: "danger",
};

const TABS = ["", "pending", "processing", "paid", "failed"];

export function AdminPayoutsPage() {
  const [status, setStatus] = useState("");
  const t = useTableQuery({ sort: "period_end", dir: "desc", perPage: 12 });
  const [target, setTarget] = useState<Payout | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const { data, loading, refetch } = useApi(
    () => adminApi.listPayouts({
      page: t.page, per_page: t.perPage, sort: t.sort, dir: t.dir,
      status: status || undefined,
    }),
    [status, t.page, t.sort, t.dir],
  );

  const settle = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await adminApi.settlePayout(target.id);
      push(`Settled ${money(target.net)} to ${target.merchant_name}`, "success");
      setTarget(null);
      refetch();
    } catch (e) {
      push(e instanceof Error ? e.message : "Settlement failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const duePending = payouts.filter((p) => p.status === "pending");
  const totalCommission = payouts.reduce((s, p) => s + p.commission, 0);

  const columns: Column<Payout>[] = [
    { key: "merchant_name", header: "Merchant",
      render: (p) => <span style={{ fontWeight: 550 }}>{p.merchant_name}</span> },
    { key: "period", header: "Settlement period",
      render: (p) => (
        <span style={{ fontSize: "var(--fs-sm)" }}>
          {date(p.period_start)} – {date(p.period_end)}
        </span>
      ) },
    { key: "orders_count", header: "Orders", numeric: true, render: (p) => p.orders_count },
    { key: "gross", header: "Gross", numeric: true, sortable: true, render: (p) => money(p.gross) },
    { key: "commission", header: "Commission", numeric: true,
      render: (p) => <span style={{ color: "var(--text-muted)" }}>−{money(p.commission)}</span> },
    { key: "refunds", header: "Refunds", numeric: true,
      render: (p) => (p.refunds ? <span style={{ color: "var(--danger-fg)" }}>−{money(p.refunds)}</span> : "—") },
    { key: "net", header: "Net payout", numeric: true, sortable: true,
      render: (p) => <span style={{ fontWeight: 700 }}>{money(p.net)}</span> },
    { key: "status", header: "Status", render: (p) => <Badge tone={TONE[p.status]} dot>{p.status}</Badge> },
    { key: "utr", header: "UTR",
      render: (p) => (p.utr ? <span className="mono" style={{ fontSize: "var(--fs-xs)" }}>{p.utr}</span> : "—") },
    { key: "actions", header: "", width: 100,
      render: (p) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {p.status !== "paid" && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); setTarget(p); }}>Settle</Button>
          )}
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Weekly merchant settlements — gross minus commission and refunds" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
        <StatCard label="Pending settlement" value={compactMoney(duePending.reduce((s, p) => s + p.net, 0))}
                  note={`${duePending.length} payouts`} icon="wallet" tone="var(--chart-3)" />
        <StatCard label="Commission earned" value={compactMoney(totalCommission)}
                  note="all time" icon="rupee" tone="var(--chart-2)" />
        <StatCard label="Settled this cycle" value={compactMoney(payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.net, 0))}
                  note={`${payouts.filter((p) => p.status === "paid").length} payouts`} icon="check" tone="var(--chart-1)" />
      </div>

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((tab) => (
            <button key={tab} className={cn(f.tab, status === tab && f.tabOn)}
                    onClick={() => { setStatus(tab); t.resetPage(); }}>
              {tab === "" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={t.setPage} rowKey={(p) => p.id} unit="payouts"
                   sort={t.sort} dir={t.dir} onSort={t.onSort}
                   emptyTitle="No payouts match" />
      </Card>

      <Modal open={!!target} onClose={() => setTarget(null)}
             title="Settle payout" subtitle={target?.merchant_name}
             footer={
               <>
                 <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
                 <Button disabled={busy} onClick={() => void settle()}>
                   {busy ? "Transferring…" : `Transfer ${target ? money(target.net) : ""}`}
                 </Button>
               </>
             }>
        {target && (
          <div style={{ display: "grid", gap: 8, fontSize: "var(--fs-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Gross sales</span>
              <span className="tabular">{money(target.gross)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Platform commission</span>
              <span className="tabular">−{money(target.commission)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Refunds</span>
              <span className="tabular">−{money(target.refunds)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border-subtle)", fontWeight: 700 }}>
              <span>Net to merchant</span>
              <span className="tabular">{money(target.net)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
