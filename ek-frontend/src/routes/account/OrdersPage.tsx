import { useState } from "react";
import { Link } from "react-router-dom";
import type { OrderStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { date, money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as ordersApi from "../../mock/api/orders";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton } from "../../components/ui/Skeleton";
import { Thumb } from "../../components/ui/Thumb";
import { OrderStatusBadge } from "../../components/order/StatusBadge";
import { customers } from "../../mock/db";
import s from "./OrdersPage.module.css";

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const me = customers[0]!;

  const { data, loading } = useApi(
    () => ordersApi.listOrders({
      user_id: me.id, page, per_page: 5,
      ...(status !== "all" ? { status } : {}),
    }),
    [status, page],
  );

  return (
    <div>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>My orders</h1>
          <p className={s.sub}>Track, return or reorder anything you have bought</p>
        </div>
        <div className={s.tabs}>
          {FILTERS.map((f) => (
            <button key={f.key} className={cn(s.tab, status === f.key && s.tabOn)}
                    onClick={() => { setStatus(f.key); setPage(1); }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && Array.from({ length: 3 }, (_, i) => (
        <Card key={i} className={s.order}><div style={{ padding: 16, display: "grid", gap: 10 }}>
          <Skeleton h={14} w="35%" /><Skeleton h={54} /><Skeleton h={14} w="55%" />
        </div></Card>
      ))}

      {!loading && data?.data.length === 0 && (
        <Card>
          <EmptyState icon={<Icon name="package" size={20} />} title="No orders here yet"
            description="When you place an order it shows up here with live tracking."
            action={<Link to="/products"><Button size="sm">Start shopping</Button></Link>} />
        </Card>
      )}

      {!loading && data?.data.map((o) => (
        <Card key={o.id} className={s.order}>
          <div className={s.ohead}>
            <div className={s.field}>
              <span className={s.fk}>Order</span>
              <Link to={`/account/orders/${o.id}`} className={cn(s.fv, "mono")}>{o.order_number}</Link>
            </div>
            <div className={s.field}>
              <span className={s.fk}>Placed</span>
              <span className={s.fv}>{date(o.placed_at)}</span>
            </div>
            <div className={s.field}>
              <span className={s.fk}>Total</span>
              <span className={cn(s.fv, "tabular")}>{money(o.total)}</span>
            </div>
            <span className={s.spacer} />
            <OrderStatusBadge status={o.status} />
          </div>

          <div className={s.items}>
            {o.items.slice(0, 3).map((it) => (
              <div key={it.id} className={s.item}>
                <Thumb hue={it.image_hue} size={44} label={it.name_snapshot} />
                <div className={s.iname}>
                  {it.name_snapshot}
                  <div className={s.imeta}>{it.merchant_name} · qty {it.quantity}</div>
                </div>
                <span className="tabular" style={{ fontWeight: 600, fontSize: "var(--fs-md)" }}>
                  {money(it.line_total)}
                </span>
              </div>
            ))}
            {o.items.length > 3 && (
              <div className={s.imeta} style={{ padding: "8px 0" }}>
                + {o.items.length - 3} more {o.items.length - 3 === 1 ? "item" : "items"}
              </div>
            )}
          </div>

          <div className={s.ofoot}>
            <span className={s.split}>
              <Icon name="store" size={13} />
              {o.merchant_count} {o.merchant_count === 1 ? "merchant" : "merchants"} · {o.item_count} items
            </span>
            <span className={s.spacer} />
            <Link to={`/account/orders/${o.id}`}>
              <Button size="sm" variant="secondary">
                <Icon name="truck" size={14} /> Track order
              </Button>
            </Link>
            <Link to={`/account/orders/${o.id}`}>
              <Button size="sm" variant="ghost">View details</Button>
            </Link>
            <Link to={`/support?order=${o.order_number}`}>
              <Button size="sm" variant="ghost">
                <Icon name="info" size={14} /> Contact support
              </Button>
            </Link>
          </div>
        </Card>
      ))}

      {!loading && data && data.meta.total_pages > 1 && (
        <Card><Pagination meta={data.meta} unit="orders" onPage={setPage} /></Card>
      )}
    </div>
  );
}
