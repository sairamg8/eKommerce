import { useState } from "react";
import type { MovementReason, Product, StockMovement } from "../../mock/types";
import { cn } from "../../lib/cn";
import { dateTime, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as merchantApi from "../../mock/api/merchant";
import { Badge } from "../../components/ui/Badge";
import type { Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Thumb } from "../../components/ui/Thumb";
import { useToast } from "../../store/ToastContext";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import { products } from "../../mock/db";
import s from "./InventoryPage.module.css";

const REASON_TONE: Record<MovementReason, Tone> = {
  restock: "success", sale: "info", adjustment: "warning",
  return: "brand", damage: "danger",
};

export function MerchantInventoryPage() {
  const m = CURRENT_MERCHANT;
  const mine = products.filter((p) => p.merchant_id === m.id);
  const [selected, setSelected] = useState<Product>(mine[0]!);
  const [restocking, setRestocking] = useState(false);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);
  const { push } = useToast();

  const { data: movements, loading } = useApi(
    () => merchantApi.getMovements(selected.id), [selected.id, nonce],
  );
  const { data: alerts } = useApi(() => merchantApi.getLowStock(m.id), [m.id, nonce]);

  const submit = async () => {
    const n = Number(qty);
    if (!n) { push("Enter a quantity", "error"); return; }
    setBusy(true);
    try {
      await merchantApi.restock(selected.id, n, note);
      push(`${n > 0 ? "Added" : "Removed"} ${Math.abs(n)} units — ledger entry written`, "success");
      setRestocking(false); setQty(""); setNote("");
      setNonce((x) => x + 1);
    } catch (e) {
      push(e instanceof Error ? e.message : "Restock failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const ledgerSum = (movements ?? []).reduce((t, mv) => t + mv.quantity, 0);

  const columns: Column<StockMovement>[] = [
    { key: "created_at", header: "When", render: (mv) => dateTime(mv.created_at) },
    { key: "reason", header: "Reason",
      render: (mv) => <Badge tone={REASON_TONE[mv.reason]}>{mv.reason}</Badge> },
    { key: "quantity", header: "Change", numeric: true,
      render: (mv) => (
        <span className={cn("tabular", mv.quantity > 0 ? s.pos : s.neg)}>
          {mv.quantity > 0 ? "+" : ""}{mv.quantity}
        </span>
      ) },
    { key: "balance_after", header: "Balance", numeric: true,
      render: (mv) => <span className="tabular" style={{ fontWeight: 600 }}>{mv.balance_after}</span> },
    { key: "reference", header: "Reference",
      render: (mv) => (mv.reference ? <span className="mono" style={{ fontSize: "var(--fs-xs)" }}>{mv.reference}</span> : "—") },
    { key: "note", header: "Note",
      render: (mv) => <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>{mv.note}</span> },
    { key: "actor", header: "By", render: (mv) => <span style={{ fontSize: "var(--fs-sm)" }}>{mv.actor}</span> },
  ];

  return (
    <div>
      <PageHeader title="Inventory"
        subtitle="Stock is the sum of an append-only ledger — never a mutable column" />

      {alerts && alerts.length > 0 && (
        <Card style={{ marginBottom: "var(--sp-4)" }}>
          <CardHeader title={`${alerts.length} products low on stock`}
                      subtitle="Days of cover is stock ÷ average daily sales" />
          <CardBody>
            <div className={s.alerts}>
              {alerts.slice(0, 4).map((a) => (
                <div key={a.product_id} className={s.alert}>
                  <Icon name="alert" size={16} style={{ color: "var(--warning-fg)" }} />
                  <div className={s.an}>
                    {a.name}
                    <div className={s.acover}>
                      {a.stock} left · threshold {a.threshold} ·
                      {a.days_of_cover != null ? ` ${a.days_of_cover} days of cover` : " no recent sales"}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => {
                    const p = mine.find((x) => x.id === a.product_id);
                    if (p) { setSelected(p); setRestocking(true); }
                  }}>
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className={s.grid}>
        <Card>
          <CardHeader title="Your products" subtitle={`${mine.length} listings`} />
          <div className={s.list}>
            {mine.map((p) => (
              <button key={p.id} className={cn(s.item, selected.id === p.id && s.itemOn)}
                      onClick={() => setSelected(p)}>
                <Thumb hue={p.image_hue} size={32} label={p.name} />
                <span className={s.iname}>
                  <span className={cn(s.in, "truncate")} style={{ display: "block" }}>{p.name}</span>
                  <span className={cn(s.is, "mono")}>{p.sku}</span>
                </span>
                <span className={cn(s.stock, "tabular",
                  p.stock === 0 ? s.out : p.stock <= p.low_stock_threshold ? s.low : "")}>
                  {p.stock}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={selected.name}
            subtitle={`SKU ${selected.sku} · movement ledger`}
            action={<Button size="sm" onClick={() => setRestocking(true)}>
              <Icon name="plus" size={14} /> Record movement
            </Button>}
          />
          <CardBody flush>
            <div style={{ padding: "var(--sp-4) var(--sp-5) 0" }}>
              <div className={s.sum}>
                <div>
                  <div className={`${s.sv} tabular`}>{num(selected.stock)}</div>
                  <div className={s.sl}>Current stock</div>
                </div>
                <div>
                  <div className={`${s.sv} tabular`}>{num(ledgerSum)}</div>
                  <div className={s.sl}>Ledger sum {ledgerSum === selected.stock ? "✓ matches" : "⚠ mismatch"}</div>
                </div>
                <div>
                  <div className={`${s.sv} tabular`}>{movements?.length ?? 0}</div>
                  <div className={s.sl}>Movements recorded</div>
                </div>
                <div>
                  <div className={`${s.sv} tabular`}>{selected.low_stock_threshold}</div>
                  <div className={s.sl}>Alert threshold</div>
                </div>
              </div>
            </div>
            <DataTable columns={columns} rows={movements ?? []} loading={loading}
                       rowKey={(mv) => mv.id}
                       emptyTitle="No movements yet"
                       emptyDescription="Record a restock to start the ledger." />
          </CardBody>
        </Card>
      </div>

      <Modal open={restocking} onClose={() => setRestocking(false)}
             title="Record a stock movement" subtitle={selected.name}
             footer={
               <>
                 <Button variant="secondary" onClick={() => setRestocking(false)}>Cancel</Button>
                 <Button disabled={busy} onClick={() => void submit()}>
                   {busy ? "Writing…" : "Append to ledger"}
                 </Button>
               </>
             }>
        <div style={{ display: "grid", gap: 14 }}>
          <Input label="Quantity" value={qty} onChange={(e) => setQty(e.target.value)}
                 inputMode="numeric" placeholder="e.g. 50 to add, -5 to remove"
                 hint={`Current stock is ${selected.stock}. Positive adds, negative removes.`} required />
          <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)}
                    rows={3} placeholder="Purchase order received, damaged in transit…" />
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", padding: "10px 12px", background: "var(--surface-sunken)", borderRadius: 8, lineHeight: 1.5 }}>
            This appends a row to <span className="mono">stock_movements</span>. Nothing is
            ever updated or deleted — corrections are new rows, which is how real
            inventory and accounting systems work.
          </div>
        </div>
      </Modal>
    </div>
  );
}
