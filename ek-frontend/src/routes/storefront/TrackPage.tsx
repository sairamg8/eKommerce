import { useState } from "react";
import type { DeliveryStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { dateTime } from "../../lib/format";
import * as ordersApi from "../../mock/api/orders";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { DeliveryStatusBadge } from "../../components/order/StatusBadge";
import { TrackingTimeline } from "../../components/order/TrackingTimeline";
import { shipments } from "../../mock/db";
import type { Shipment } from "../../mock/types";
import s from "./TrackPage.module.css";

const STEPS: { key: DeliveryStatus; label: string; icon: string }[] = [
  { key: "awaiting_pickup", label: "Manifested", icon: "clock" },
  { key: "picked_up", label: "Picked up", icon: "package" },
  { key: "in_transit", label: "In transit", icon: "truck" },
  { key: "out_for_delivery", label: "Out for delivery", icon: "mapPin" },
  { key: "delivered", label: "Delivered", icon: "check" },
];

const SAMPLES = shipments.slice(0, 3).map((x) => x.awb);

export function TrackPage() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState<Shipment | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const track = async (value: string) => {
    if (!value.trim()) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      setResult(await ordersApi.trackByAwb(value));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Tracking failed");
    } finally {
      setBusy(false);
    }
  };

  // Statuses that are not their own step map onto the step they sit within.
  const STEP_OF: Partial<Record<DeliveryStatus, number>> = {
    at_hub: 2,
    failed_attempt: 3,
    returned: 3,
  };
  const currentIdx = !result
    ? -1
    : STEP_OF[result.status] ?? Math.max(STEPS.findIndex((x) => x.key === result.status), 0);

  return (
    <div className={s.wrap}>
      <div className={s.hero}>
        <h1 className={s.h1}>Track your shipment</h1>
        <p className={s.sub}>Enter the AWB number from your order confirmation</p>
        <form className={s.form} onSubmit={(e) => { e.preventDefault(); void track(awb); }}>
          <Input value={awb} onChange={(e) => setAwb(e.target.value.toUpperCase())}
                 placeholder="e.g. SWFT123456789" aria-label="AWB number"
                 icon={<Icon name="search" size={15} />} />
          <Button type="submit" disabled={busy || !awb.trim()}>
            {busy ? <Spinner size={15} /> : <Icon name="truck" size={15} />} Track
          </Button>
        </form>
        <p className={s.hint}>No account needed — this endpoint is public.</p>
        <div className={s.samples}>
          {SAMPLES.map((a) => (
            <button key={a} className={s.sample} onClick={() => { setAwb(a); void track(a); }}>{a}</button>
          ))}
        </div>
      </div>

      {err && (
        <Card>
          <EmptyState tone="danger" icon={<Icon name="alert" size={20} />}
            title="Shipment not found" description={err} />
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader
            title={<span className="mono">{result.awb}</span>}
            subtitle={`${result.courier_name} · order ${result.order_number}`}
            action={<DeliveryStatusBadge status={result.status} />}
          />
          <CardBody>
            <div className={s.sum}>
              <div className={s.f}><span className={s.fk}>Merchant</span><span className={s.fv}>{result.merchant_name}</span></div>
              <div className={s.f}><span className={s.fk}>Destination</span><span className={s.fv}>{result.pincode}</span></div>
              <div className={s.f}><span className={s.fk}>Weight</span><span className={s.fv}>{(result.weight_g / 1000).toFixed(2)} kg</span></div>
              <div className={s.f}>
                <span className={s.fk}>{result.delivered_at ? "Delivered" : "Expected by"}</span>
                <span className={s.fv}>{dateTime(result.delivered_at ?? result.eta)}</span>
              </div>
              {result.is_cod && (
                <div className={s.f}><span className={s.fk}>Payment</span><span className={s.fv}>Cash on delivery</span></div>
              )}
            </div>

            <div className={s.progress}>
              {STEPS.map((step, i) => (
                <div key={step.key} className={s.pstep}>
                  <span className={cn(s.pbar, i < currentIdx && s.pbarOn)} />
                  <span className={cn(s.pdot, i < currentIdx && s.pon, i === currentIdx && s.pnow)}>
                    <Icon name={step.icon} size={14} strokeWidth={2.3} />
                  </span>
                  <span className={s.pl}>{step.label}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "var(--fs-md)", marginBottom: "var(--sp-4)" }}>Scan history</h3>
            <TrackingTimeline events={result.events} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
