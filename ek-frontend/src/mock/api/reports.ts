import type { CategoryRevenue, Kpi, RevenuePoint, StatusBreakdown, TopProduct } from "../types";
import { respond, DELAY } from "../core/latency";
import { orders, fulfilments, products, merchants, payouts, shipments, customers } from "../db";

const day = (iso: string) => iso.slice(0, 10);

/** Aggregations a real backend does in SQL — GROUP BY, window functions. */
function revenueByDay(days: number, merchantId?: string): RevenuePoint[] {
  const buckets = new Map<string, RevenuePoint>();
  const today = new Date("2026-08-31T00:00:00.000Z");

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    buckets.set(k, { date: k, revenue: 0, orders: 0, units: 0 });
  }

  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const k = day(o.placed_at);
    const b = buckets.get(k);
    if (!b) continue;

    if (merchantId) {
      const mine = o.items.filter((i) => i.merchant_id === merchantId);
      if (!mine.length) continue;
      b.revenue += mine.reduce((s, i) => s + i.line_total, 0);
      b.units += mine.reduce((s, i) => s + i.quantity, 0);
      b.orders += 1;
    } else {
      b.revenue += o.total;
      b.units += o.item_count;
      b.orders += 1;
    }
  }
  return [...buckets.values()];
}

function topProducts(limit: number, merchantId?: string): TopProduct[] {
  const tally = new Map<string, TopProduct>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const it of o.items) {
      if (merchantId && it.merchant_id !== merchantId) continue;
      const row = tally.get(it.product_id) ?? {
        product_id: it.product_id, name: it.name_snapshot, sku: it.sku_snapshot,
        units: 0, revenue: 0, margin_pct: 0,
      };
      row.units += it.quantity;
      row.revenue += it.line_total;
      tally.set(it.product_id, row);
    }
  }
  for (const row of tally.values()) {
    const p = products.find((x) => x.id === row.product_id);
    row.margin_pct = p ? Number((((p.price - p.cost) / p.price) * 100).toFixed(1)) : 0;
  }
  return [...tally.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

function statusBreakdown(merchantId?: string): StatusBreakdown[] {
  const rows = merchantId
    ? fulfilments.filter((f) => f.merchant_id === merchantId)
    : orders;
  const tally = new Map<string, StatusBreakdown>();
  for (const r of rows) {
    const value = "total" in r ? r.total : r.subtotal;
    const row = tally.get(r.status) ?? { status: r.status, count: 0, value: 0 };
    row.count += 1;
    row.value += value;
    tally.set(r.status, row);
  }
  return [...tally.values()].sort((a, b) => b.count - a.count);
}

function categoryRevenue(): CategoryRevenue[] {
  const tally = new Map<string, CategoryRevenue>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const it of o.items) {
      const p = products.find((x) => x.id === it.product_id);
      if (!p) continue;
      const row = tally.get(p.category_name) ?? { category: p.category_name, revenue: 0, units: 0 };
      row.revenue += it.line_total;
      row.units += it.quantity;
      tally.set(p.category_name, row);
    }
  }
  return [...tally.values()].sort((a, b) => b.revenue - a.revenue);
}

const sparkOf = (pts: RevenuePoint[], key: keyof RevenuePoint) =>
  pts.slice(-14).map((p) => Number(p[key]));

const deltaOf = (pts: RevenuePoint[], key: keyof RevenuePoint) => {
  const half = Math.floor(pts.length / 2);
  const a = pts.slice(0, half).reduce((s, p) => s + Number(p[key]), 0);
  const b = pts.slice(half).reduce((s, p) => s + Number(p[key]), 0);
  if (a === 0) return b > 0 ? 100 : 0;
  return Number((((b - a) / a) * 100).toFixed(1));
};

/** GET /admin/reports/overview */
export function adminOverview() {
  return respond(() => {
    const trend = revenueByDay(30);
    const gmv = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const commission = fulfilments.reduce((s, f) => s + f.commission, 0);
    const aov = Math.round(gmv / Math.max(orders.length, 1));

    const kpis: Kpi[] = [
      { key: "gmv", label: "Gross merchandise value", value: gmv, format: "money",
        delta_pct: deltaOf(trend, "revenue"), spark: sparkOf(trend, "revenue") },
      { key: "commission", label: "Platform commission", value: commission, format: "money",
        delta_pct: deltaOf(trend, "revenue") * 0.9, spark: sparkOf(trend, "revenue") },
      { key: "orders", label: "Orders", value: orders.length, format: "number",
        delta_pct: deltaOf(trend, "orders"), spark: sparkOf(trend, "orders") },
      { key: "aov", label: "Average order value", value: aov, format: "money",
        delta_pct: 4.2, spark: sparkOf(trend, "revenue") },
    ];

    return {
      kpis,
      trend,
      topProducts: topProducts(6),
      statusBreakdown: statusBreakdown(),
      categoryRevenue: categoryRevenue(),
      counts: {
        merchants: merchants.length,
        activeMerchants: merchants.filter((m) => m.status === "active").length,
        pendingMerchants: merchants.filter((m) => m.status === "pending").length,
        customers: customers.length,
        products: products.length,
        shipments: shipments.length,
        inTransit: shipments.filter((s) => s.status !== "delivered").length,
        pendingPayouts: payouts.filter((p) => p.status === "pending").length,
        payoutValue: payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.net, 0),
      },
    };
  }, DELAY.normal);
}

/** GET /merchant/reports/overview */
export function merchantOverview(merchantId: string) {
  return respond(() => {
    const trend = revenueByDay(30, merchantId);
    const mine = fulfilments.filter((f) => f.merchant_id === merchantId);
    const gross = mine.reduce((s, f) => s + f.subtotal, 0);
    const commission = mine.reduce((s, f) => s + f.commission, 0);
    const net = gross - commission;
    const myProducts = products.filter((p) => p.merchant_id === merchantId);

    const kpis: Kpi[] = [
      { key: "gross", label: "Gross sales", value: gross, format: "money",
        delta_pct: deltaOf(trend, "revenue"), spark: sparkOf(trend, "revenue") },
      { key: "net", label: "Net earnings", value: net, format: "money",
        delta_pct: deltaOf(trend, "revenue"), spark: sparkOf(trend, "revenue") },
      { key: "orders", label: "Orders received", value: mine.length, format: "number",
        delta_pct: deltaOf(trend, "orders"), spark: sparkOf(trend, "orders") },
      { key: "units", label: "Units sold", value: trend.reduce((s, p) => s + p.units, 0), format: "number",
        delta_pct: deltaOf(trend, "units"), spark: sparkOf(trend, "units") },
    ];

    return {
      kpis, trend,
      topProducts: topProducts(6, merchantId),
      statusBreakdown: statusBreakdown(merchantId),
      counts: {
        products: myProducts.length,
        active: myProducts.filter((p) => p.status === "active").length,
        lowStock: myProducts.filter((p) => p.status === "active" && p.stock <= p.low_stock_threshold).length,
        awaitingAction: mine.filter((f) => f.status === "paid").length,
        commission,
        pendingPayout: payouts.filter((p) => p.merchant_id === merchantId && p.status === "pending")
          .reduce((s, p) => s + p.net, 0),
      },
    };
  }, DELAY.normal);
}
