import { useState } from "react";
import type { ReturnRequest, ReturnStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { compactMoney, date } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as returnsApi from "../../mock/api/returns";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { ReturnCard } from "../../components/returns/ReturnCard";
import { useToast } from "../../store/ToastContext";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import { returnsForMerchant } from "../../mock/db";
import f from "../admin/Filters.module.css";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "requested", label: "Needs decision" },
  { key: "approved", label: "Approved" },
  { key: "pickup_scheduled", label: "Pickup scheduled" },
  { key: "picked_up", label: "Received" },
  { key: "refunded", label: "Refunded" },
  { key: "rejected", label: "Declined" },
];

const NEXT_LABEL: Partial<Record<ReturnStatus, string>> = {
  approved: "Schedule pickup",
  pickup_scheduled: "Mark collected",
  picked_up: "Issue refund",
};

export function MerchantReturnsPage() {
  const m = CURRENT_MERCHANT;
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [decision, setDecision] = useState<{ r: ReturnRequest; to: ReturnStatus } | null>(null);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const { data, loading } = useApi(
    () => returnsApi.listReturns({
      merchant_id: m.id, page, per_page: 8,
      status: (status || undefined) as ReturnStatus,
    }),
    [status, page, nonce],
  );

  const act = async (r: ReturnRequest, to: ReturnStatus, note?: string) => {
    setBusy(true);
    try {
      await returnsApi.updateReturnStatus({
        returnId: r.id, status: to, response: note,
        actor: m.business_name, actorRole: "merchant",
      });
      push(
        to === "rejected" ? `${r.rma_number} declined`
        : to === "refunded" ? `${r.rma_number} refunded — stock returned to the ledger`
        : `${r.rma_number} moved to ${to.replace(/_/g, " ")}`,
        to === "rejected" ? "info" : "success",
      );
      setDecision(null);
      setResponse("");
      setNonce((n) => n + 1);
    } catch (e) {
      push(e instanceof Error ? e.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const mine = returnsForMerchant(m.id);
  const pending = mine.filter((r) => r.status === "requested");
  const refunded = mine.filter((r) => r.status === "refunded");
  const rate = mine.length ? ((mine.length / Math.max(m.orders_count, 1)) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <PageHeader title="Returns"
        subtitle="Approve or decline return requests, then track the reverse pickup" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
        <StatCard label="Needs your decision" value={String(pending.length)}
                  note="respond within 48h" icon="alert" tone="var(--chart-3)" />
        <StatCard label="Refunded" value={String(refunded.length)}
                  note={compactMoney(refunded.reduce((s, r) => s + r.refund_amount, 0))}
                  icon="refresh" tone="var(--chart-6)" />
        <StatCard label="Return rate" value={`${rate}%`} note="of your orders"
                  icon="chart" tone="var(--chart-4)" />
        <StatCard label="Total returns" value={String(mine.length)} icon="boxOpen" tone="var(--chart-1)" />
      </div>

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((t) => (
            <button key={t.key} className={cn(f.tab, status === t.key && f.tabOn)}
                    onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading && Array.from({ length: 3 }, (_, i) => (
        <div key={i} style={{ marginBottom: 12 }}><Skeleton h={200} radius={12} /></div>
      ))}

      {!loading && data?.data.length === 0 && (
        <Card>
          <EmptyState icon={<Icon name="refresh" size={20} />} title="No returns here"
                      description="Nothing matches this filter right now." />
        </Card>
      )}

      {!loading && data?.data.map((r) => {
        const next = returnsApi.allowedReturnTransitions(r.status)
          .filter((x) => x !== "rejected")[0];
        return (
          <ReturnCard key={r.id} request={r}
            footer={
              <>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                  {r.customer_name} · order {r.order_number}
                </span>
                <span style={{ flex: 1 }} />
                {r.status === "requested" ? (
                  <>
                    <Button size="sm" variant="secondary" disabled={busy}
                            onClick={() => { setDecision({ r, to: "rejected" }); setResponse(""); }}>
                      Decline
                    </Button>
                    <Button size="sm" disabled={busy}
                            onClick={() => { setDecision({ r, to: "approved" }); setResponse(""); }}>
                      <Icon name="check" size={13} /> Approve return
                    </Button>
                  </>
                ) : next ? (
                  <Button size="sm" disabled={busy} onClick={() => void act(r, next)}>
                    {NEXT_LABEL[next] ?? next.replace(/_/g, " ")}
                  </Button>
                ) : (
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    {r.resolved_at ? `Closed ${date(r.resolved_at)}` : "Closed"}
                  </span>
                )}
              </>
            }
          />
        );
      })}

      <Modal open={!!decision} onClose={() => setDecision(null)}
             title={decision?.to === "approved" ? "Approve this return" : "Decline this return"}
             subtitle={decision ? `${decision.r.rma_number} · ${decision.r.customer_name}` : ""}
             footer={
               <>
                 <Button variant="secondary" onClick={() => setDecision(null)}>Cancel</Button>
                 <Button variant={decision?.to === "approved" ? "primary" : "danger"} disabled={busy}
                         onClick={() => decision && void act(decision.r, decision.to, response)}>
                   {busy ? "Working…" : decision?.to === "approved" ? "Approve" : "Decline return"}
                 </Button>
               </>
             }>
        <Textarea
          label={decision?.to === "approved" ? "Message to the customer (optional)" : "Why are you declining? (required)"}
          rows={4} value={response} onChange={(e) => setResponse(e.target.value)}
          placeholder={decision?.to === "approved"
            ? "Sorry about this — we will arrange a pickup within 48 hours."
            : "Explain clearly. The customer sees this, and can escalate to platform support."} />
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.6 }}>
          {decision?.to === "approved"
            ? "Approving schedules a free reverse pickup. The refund is issued once you confirm receipt, and the units go back onto the stock ledger."
            : "Declining closes the request. The customer can raise a support ticket, and the platform can override your decision."}
        </div>
      </Modal>
    </div>
  );
}
