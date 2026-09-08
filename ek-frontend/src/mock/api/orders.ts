import type { ApiPaged, Fulfilment, ListQuery, Order, OrderStatus, Shipment } from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search, sortRows } from "../core/paginate";
import {
  orders, fulfilments, orderById, orderByNumber, fulfilmentsForOrder,
  shipments, shipmentsForOrder, shipmentByAwb, session, productById,
  merchantById, couponByCode, nextId, customers, persistCart,
} from "../db";

export type OrderQuery = ListQuery & { status?: OrderStatus; user_id?: string };

/** GET /orders — admin sees all, a customer sees only their own. */
export function listOrders(query: OrderQuery = {}): Promise<ApiPaged<Order>> {
  return respond(() => {
    let rows = orders.slice();
    if (query.user_id) rows = rows.filter((o) => o.user_id === query.user_id);
    if (query.status) rows = rows.filter((o) => o.status === query.status);
    rows = search(rows, query.q, ["order_number", "customer_name", "customer_email"]);
    rows = sortRows(rows, query.sort ?? "placed_at", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);
}

export function getOrder(id: string): Promise<{
  order: Order; fulfilments: Fulfilment[]; shipments: Shipment[];
}> {
  return respond(() => {
    const order = orderById(id) ?? orderByNumber(id);
    if (!order) throw new MockApiError(404, `Order ${id} not found`);
    return {
      order,
      fulfilments: fulfilmentsForOrder(order.id),
      shipments: shipmentsForOrder(order.id),
    };
  }, DELAY.fast);
}

/** GET /track?awb= — public tracking, no auth. */
export function trackByAwb(awb: string): Promise<Shipment> {
  return respond(() => {
    const s = shipmentByAwb(awb.trim());
    if (!s) throw new MockApiError(404, `No shipment found for AWB "${awb}"`);
    return s;
  }, DELAY.normal);
}

/**
 * POST /checkout — the transaction the backend must get right.
 * In Postgres this is ONE transaction: lock stock rows FOR UPDATE,
 * validate, snapshot prices, write stock_movements, split fulfilments,
 * clear the cart. Two checkouts on the last unit must not both succeed.
 */
export function placeOrder(input: { address: string; payment_method: string }): Promise<Order> {
  return respond(() => {
    const cart = session.cart;
    if (!cart.items.length) throw new MockApiError(422, "Your cart is empty");

    // 1. Validate stock for every line before touching anything.
    for (const item of cart.items) {
      const p = productById(item.product_id);
      if (!p) throw new MockApiError(404, `${item.name} is no longer listed`);
      if (p.stock < item.quantity) {
        throw new MockApiError(409, `Only ${p.stock} left of ${p.name} — adjust your cart`);
      }
    }

    const n = orders.length + 1;
    const orderId = nextId("ord");
    const orderNumber = `EK-${26000 + n}`;
    const customer = customers[0]!;

    // 2. Snapshot prices and decrement stock.
    const items = cart.items.map((item, k) => {
      const p = productById(item.product_id)!;
      p.stock -= item.quantity;
      p.units_sold += item.quantity;
      return {
        id: `${orderId}_it${k + 1}`,
        product_id: p.id,
        merchant_id: p.merchant_id,
        merchant_name: p.merchant_name,
        name_snapshot: p.name,
        sku_snapshot: p.sku,
        unit_price_snapshot: p.price,
        image_hue: p.image_hue,
        quantity: item.quantity,
        line_total: p.price * item.quantity,
      };
    });

    // 3. Split into one fulfilment per merchant.
    const byMerchant = new Map<string, typeof items>();
    for (const it of items) {
      const list = byMerchant.get(it.merchant_id) ?? [];
      list.push(it);
      byMerchant.set(it.merchant_id, list);
    }

    const t = cart.totals;
    const fIds: string[] = [];
    let fi = 0;
    for (const [merchantId, mItems] of byMerchant) {
      fi += 1;
      const merchant = merchantById(merchantId)!;
      const sub = mItems.reduce((s, i) => s + i.line_total, 0);
      const commission = Math.round((sub * merchant.commission_pct) / 100);
      const fId = `${orderId}_f${fi}`;
      fIds.push(fId);
      fulfilments.unshift({
        id: fId, order_id: orderId, order_number: orderNumber,
        merchant_id: merchantId, merchant_name: merchant.business_name,
        status: "paid", items: mItems, subtotal: sub, commission,
        net_to_merchant: sub - commission,
        shipping: Math.round(t.shipping / byMerchant.size),
        shipment_id: null, courier: null, awb: null,
        packed_at: null, shipped_at: null, delivered_at: null,
        sla_due_at: new Date(Date.now() + merchant.fulfilment_sla_hrs * 3600_000).toISOString(),
        is_breaching_sla: false,
      });
    }

    if (cart.coupon_code) {
      const c = couponByCode(cart.coupon_code);
      if (c) c.usage_count += 1;
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: orderId, order_number: orderNumber,
      user_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_email: customer.email,
      status: "paid",
      payment_status: input.payment_method === "Cash on Delivery" ? "unpaid" : "captured",
      payment_method: input.payment_method,
      items, fulfilment_ids: fIds, merchant_count: byMerchant.size,
      item_count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: t.subtotal, discount: t.discount, coupon_code: cart.coupon_code,
      tax: t.tax, shipping: t.shipping, total: t.total,
      shipping_address: input.address,
      timeline: [
        { at: now, status: "pending", note: "Order placed", actor: "Customer" },
        { at: now, status: "paid", note: "Payment captured successfully", actor: "System" },
      ],
      placed_at: now,
    };

    orders.unshift(order);

    // 4. Clear the cart.
    cart.items = [];
    cart.coupon_code = null;
    cart.totals = { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 };
    persistCart();

    return order;
  }, DELAY.slow);
}

/** PATCH /orders/:id/status — admin-only transition. */
export function updateOrderStatus(orderId: string, status: OrderStatus, note: string): Promise<Order> {
  return respond(() => {
    const order = orderById(orderId);
    if (!order) throw new MockApiError(404, "Order not found");
    order.status = status;
    order.timeline.push({ at: new Date().toISOString(), status, note, actor: "Admin" });
    for (const f of fulfilmentsForOrder(order.id)) f.status = status;
    return order;
  }, DELAY.normal);
}

export const listShipments = (query: ListQuery = {}): Promise<ApiPaged<Shipment>> =>
  respond(() => {
    let rows = shipments.slice();
    rows = search(rows, query.q, ["awb", "order_number", "customer_name", "merchant_name"]);
    return paginate(rows, query);
  }, DELAY.normal);
