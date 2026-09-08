import { useState } from "react";
import type { Fulfilment } from "../../mock/types";
import { cn } from "../../lib/cn";
import { date, dateTime, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
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
import { Thumb } from "../../components/ui/Thumb";
import { OrderStatusBadge } from "../../components/order/StatusBadge";
import { useToast } from "../../store/ToastContext";
import { useNavigate } from "react-router-dom";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import { orderById } from "../../mock/db";
import f from "../admin/Filters.module.css";

const TABS = ["", "paid", "packed", "shipped", "delivered"];

export function MerchantOrdersPage() {
  const m = CURRENT_MERCHANT;
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Fulfilment | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const navigate = useNavigate();

  const { data, loading, refetch } = useApi(
    () => merchantApi.listFulfilments(m.id, { page, per_page: 12, q, status: status || undefined }),
    [status, q, page],
  );

  const pack = async (fl: Fulfilment) => {
    setBusy(true);
    try {
      await merchantApi.markPacked(fl.id);
      push(`${fl.order_number} marked packed — courier will collect`, "success");
      setDetail(null);
      refetch();
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not pack", "error");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Fulfilment>[] = [
    { key: "order_number", header: "Order",
      render: (fl) => <span className="mono" style={{ fontWeight: 600 }}>{fl.order_number}</span> },
    { key: "customer", header: "Customer",
      render: (fl) => {
        const o = orderById(fl.order_id);
        return (
          <div>
            <div style={{ fontWeight: 550 }}>{o?.customer_name ?? "—"}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
              {o?.customer_email ?? ""}
            </div>
          </div>
        );
      } },
    { key: "items", header: "Items",
      render: (fl) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex" }}>
            {fl.items.slice(0, 3).map((it, i) => (
              <span key={it.id} style={{ marginLeft: i ? -8 : 0 }}>
                <Thumb hue={it.image_hue} size={28} label={it.name_snapshot} />
              </span>
            ))}
          </div>
          <span style={{ fontSize: "var(--fs-sm)" }}>
            {fl.items.reduce((s, i) => s + i.quantity, 0)} units
          </span>
        </div>
      ) },
    { key: "status", header: "Status", render: (fl) => <OrderStatusBadge status={fl.status} /> },
    { key: "sla", header: "SLA",
      render: (fl) => (fl.is_breaching_sla
        ? <Badge tone="danger" dot>Breaching</Badge>
        : fl.status === "paid" ? <Badge tone="warning" dot>Pack by {date(fl.sla_due_at)}</Badge>
        : <span style={{ color: "var(--text-disabled)" }}>—</span>) },
    { key: "subtotal", header: "Subtotal", numeric: true, render: (fl) => money(fl.subtotal) },
    { key: "commission", header: "Commission", numeric: true,
      render: (fl) => <span style={{ color: "var(--text-muted)" }}>−{money(fl.commission)}</span> },
    { key: "net_to_merchant", header: "You earn", numeric: true,
      render: (fl) => <span style={{ fontWeight: 700, color: "var(--success-fg)" }}>{money(fl.net_to_merchant)}</span> },
    { key: "awb", header: "AWB",
      render: (fl) => (fl.awb ? <span className="mono" style={{ fontSize: "var(--fs-xs)" }}>{fl.awb}</span> : "—") },
    { key: "actions", header: "", width: 110,
      render: (fl) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          {fl.status === "paid" ? (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); void pack(fl); }}>
              <Icon name="package" size={13} /> Pack
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(fl); }}>
              View
            </Button>
          )}
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="Your slice of each customer order — pack, then hand to the courier" />

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((t) => (
            <button key={t} className={cn(f.tab, status === t && f.tabOn)}
                    onClick={() => { setStatus(t); setPage(1); }}>
              {t === "" ? "All" : t === "paid" ? "To pack" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                 placeholder="Order number or AWB…" icon={<Icon name="search" size={15} />}
                 aria-label="Search orders" />
        </div>
      </div>

      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={setPage} rowKey={(fl) => fl.id} unit="orders"
                   onRowClick={setDetail} emptyTitle="No orders match" />
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} wide
             title={detail ? `Order ${detail.order_number}` : ""}
             subtitle={detail ? `Package for ${detail.merchant_name}` : ""}
             footer={
               detail?.status === "paid"
                 ? <>
                     <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
                     <Button disabled={busy} onClick={() => detail && void pack(detail)}>
                       {busy ? "Working…" : "Mark packed"}
                     </Button>
                   </>
                 : <>
                     <Button variant="ghost" onClick={() => navigate("/merchant/messages")}>
                       <Icon name="info" size={14} /> Raise with platform support
                     </Button>
                     <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
                   </>
             }>
        {detail && (
          <div style={{ display: "grid", gap: 12 }}>
            {detail.items.map((it) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Thumb hue={it.image_hue} size={44} label={it.name_snapshot} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 550 }}>{it.name_snapshot}</div>
                  <div className="mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    {it.sku_snapshot} · qty {it.quantity}
                  </div>
                </div>
                <span className="tabular" style={{ fontWeight: 600 }}>{money(it.line_total)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "grid", gap: 6, fontSize: "var(--fs-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                <span className="tabular">{money(detail.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Platform commission</span>
                <span className="tabular">−{money(detail.commission)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Net to you</span>
                <span className="tabular">{money(detail.net_to_merchant)}</span>
              </div>
            </div>
            {(() => {
              const o = orderById(detail.order_id);
              return o ? (
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <strong>Ship to:</strong> {o.customer_name} — {o.shipping_address}
                </div>
              ) : null;
            })()}
            {detail.awb && (
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                Courier: <strong>{detail.courier}</strong> · AWB <span className="mono">{detail.awb}</span>
                {detail.shipped_at && <> · shipped {dateTime(detail.shipped_at)}</>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
