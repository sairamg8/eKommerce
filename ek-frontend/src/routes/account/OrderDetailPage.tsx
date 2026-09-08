import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { cn } from "../../lib/cn";
import { dateTime, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as ordersApi from "../../mock/api/orders";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Spinner";
import { Thumb } from "../../components/ui/Thumb";
import { DeliveryStatusBadge, OrderStatusBadge, PaymentStatusBadge } from "../../components/order/StatusBadge";
import { TrackingTimeline } from "../../components/order/TrackingTimeline";
import { ReturnRequestModal } from "../../components/returns/ReturnRequestModal";
import type { Fulfilment } from "../../mock/types";
import s from "./OrderDetailPage.module.css";

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const justPlaced = params.get("placed") === "1";
  const [returning, setReturning] = useState<Fulfilment | null>(null);
  const { data, loading, error, refetch } = useApi(() => ordersApi.getOrder(id), [id]);

  if (loading) return <LoadingBlock label="Loading order…" />;
  if (error || !data) {
    return (
      <Card>
        <EmptyState tone="danger" icon={<Icon name="alert" size={20} />}
          title="Order not found" description={error ?? undefined}
          action={<Link to="/account/orders"><Button size="sm">Back to orders</Button></Link>} />
      </Card>
    );
  }

  const { order, fulfilments, shipments } = data;

  return (
    <div>
      <Link to="/account/orders" className={s.back}>
        <Icon name="arrowLeft" size={14} /> All orders
      </Link>

      {justPlaced && (
        <div className={s.banner}>
          <Icon name="check" size={20} strokeWidth={2.5} />
          <div>
            <div className={s.bTitle}>Order placed successfully</div>
            <div className={s.bDesc}>
              Stock was reserved and your order split across {order.merchant_count}{" "}
              {order.merchant_count === 1 ? "merchant" : "merchants"}. Each ships separately.
            </div>
          </div>
        </div>
      )}

      <div className={s.head}>
        <div>
          <h1 className={s.h1}>
            <span className="mono">{order.order_number}</span>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </h1>
          <p className={s.sub}>
            Placed {dateTime(order.placed_at)} · {order.item_count} items ·
            {" "}{order.merchant_count} {order.merchant_count === 1 ? "merchant" : "merchants"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm">
            <Icon name="download" size={14} /> Download invoice
          </Button>
          <Link to="/account/messages">
            <Button variant="secondary" size="sm">
              <Icon name="bell" size={14} /> Message merchant
            </Button>
          </Link>
          <Link to={`/support?order=${order.order_number}`}>
            <Button variant="secondary" size="sm">
              <Icon name="info" size={14} /> Contact support
            </Button>
          </Link>
        </div>
      </div>

      <ReturnRequestModal
        fulfilment={returning}
        customerName={order.customer_name}
        onClose={() => setReturning(null)}
        onCreated={() => refetch()}
      />

      <div className={s.grid}>
        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          {fulfilments.map((f, i) => {
            const shipment = shipments.find((sh) => sh.fulfilment_id === f.id);
            return (
              <Card key={f.id}>
                <CardHeader
                  title={
                    <span className={s.fh}>
                      <Icon name="store" size={15} />
                      <span className={s.fName}>{f.merchant_name}</span>
                      <DeliveryStatusBadge status={shipment?.status ?? "awaiting_pickup"} />
                    </span>
                  }
                  subtitle={`Package ${i + 1} of ${fulfilments.length}${f.awb ? ` · AWB ${f.awb}` : ""}`}
                />
                <CardBody>
                  {shipment && (
                    <div className={s.courier}>
                      <div className={s.cField}>
                        <span className={s.ck}>Courier</span>
                        <span className={s.cv}>{shipment.courier_name}</span>
                      </div>
                      <div className={s.cField}>
                        <span className={s.ck}>AWB</span>
                        <span className={cn(s.cv, "mono")}>{shipment.awb}</span>
                      </div>
                      {shipment.agent_name && (
                        <div className={s.cField}>
                          <span className={s.ck}>Delivery agent</span>
                          <span className={s.cv}>{shipment.agent_name}</span>
                        </div>
                      )}
                      <div className={s.cField}>
                        <span className={s.ck}>{shipment.delivered_at ? "Delivered" : "Expected"}</span>
                        <span className={s.cv}>{dateTime(shipment.delivered_at ?? shipment.eta)}</span>
                      </div>
                    </div>
                  )}

                  {f.items.map((it) => (
                    <div key={it.id} className={s.item}>
                      <Thumb hue={it.image_hue} size={46} label={it.name_snapshot} />
                      <div className={s.iname}>
                        {it.name_snapshot}
                        <div className={s.imeta}>
                          <span className="mono">{it.sku_snapshot}</span> · qty {it.quantity} ·
                          {" "}{money(it.unit_price_snapshot)} each
                        </div>
                      </div>
                      <span className="tabular" style={{ fontWeight: 600 }}>{money(it.line_total)}</span>
                    </div>
                  ))}

                  {(f.status === "delivered" || shipment?.status === "out_for_delivery") && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap",
                      marginTop: "var(--sp-4)", padding: "var(--sp-3) var(--sp-4)",
                      background: "var(--surface-sunken)", borderRadius: "var(--r-lg)",
                    }}>
                      <span style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                        {f.status === "delivered"
                          ? "Something wrong with this package? You have 14 days to return it."
                          : "Out for delivery — you can also refuse the parcel at the door."}
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => setReturning(f)}>
                        <Icon name="refresh" size={14} /> Return or reject
                      </Button>
                      <Link to="/account/messages">
                        <Button size="sm" variant="ghost">
                          <Icon name="bell" size={14} /> Message merchant
                        </Button>
                      </Link>
                    </div>
                  )}

                  {shipment && (
                    <div style={{ marginTop: "var(--sp-5)", paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border-subtle)" }}>
                      <h3 style={{ fontSize: "var(--fs-md)", marginBottom: "var(--sp-4)" }}>
                        Tracking history
                      </h3>
                      <TrackingTimeline events={shipment.events} />
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          <Card>
            <CardHeader title="Payment summary" />
            <CardBody>
              <div className={s.line}><span className={s.lbl}>Subtotal</span><span className="tabular">{money(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className={s.line}>
                  <span className={s.lbl}>Discount ({order.coupon_code})</span>
                  <span className={cn(s.disc, "tabular")}>−{money(order.discount)}</span>
                </div>
              )}
              <div className={s.line}><span className={s.lbl}>GST</span><span className="tabular">{money(order.tax)}</span></div>
              <div className={s.line}><span className={s.lbl}>Shipping</span><span className="tabular">{order.shipping === 0 ? "Free" : money(order.shipping)}</span></div>
              <div className={s.total}><span>Total</span><span className="tabular">{money(order.total)}</span></div>
              <div className={s.line} style={{ marginTop: 10 }}>
                <span className={s.lbl}>Method</span><span>{order.payment_method}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Delivery address" />
            <CardBody><p className={s.addr}>{order.shipping_address}</p></CardBody>
          </Card>

          <Card>
            <CardHeader title="Order timeline" />
            <CardBody>
              {order.timeline.slice().reverse().map((e, i) => (
                <div key={i} className={s.line} style={{ alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 550, textTransform: "capitalize" }}>{e.status}</div>
                    <div className={s.imeta}>{e.note}</div>
                  </div>
                  <span className={s.imeta} style={{ whiteSpace: "nowrap" }}>{dateTime(e.at)}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
