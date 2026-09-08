import type { Fulfilment, Order, OrderEvent, OrderItem, OrderStatus } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { activeProducts } from "./products";
import { customers } from "./users";
import { merchants } from "./merchants";

const rng = makeRng(4242);

const ADDRESSES = [
  "12 Brigade Rd, Ashok Nagar, Bengaluru, Karnataka 560001",
  "402 Sunrise Apts, Powai, Mumbai, Maharashtra 400076",
  "88 Anna Salai, Nandanam, Chennai, Tamil Nadu 600035",
  "17 Sector 15, Dwarka, New Delhi, Delhi 110078",
  "9 Jubilee Hills Rd 36, Hyderabad, Telangana 500033",
  "23 Salt Lake Sec V, Kolkata, West Bengal 700091",
  "56 Koregaon Park, Pune, Maharashtra 411001",
  "31 MG Road, Ernakulam, Kochi, Kerala 682035",
];

const PAY_METHODS = ["UPI — GPay", "UPI — PhonePe", "Card — Visa ••4821", "Card — Mastercard ••7702", "Cash on Delivery", "Netbanking — HDFC"];

/** Status distribution weighted like a real order book. */
const STATUS_POOL: OrderStatus[] = [
  "delivered", "delivered", "delivered", "delivered", "delivered", "delivered",
  "shipped", "shipped", "shipped",
  "packed", "packed",
  "paid", "paid",
  "pending",
  "cancelled",
  "refunded",
];

const FLOW: OrderStatus[] = ["pending", "paid", "packed", "shipped", "delivered"];

function timelineFor(status: OrderStatus, placedDay: number): OrderEvent[] {
  const events: OrderEvent[] = [];
  const idx = FLOW.indexOf(status);
  const reached = idx >= 0 ? FLOW.slice(0, idx + 1) : ["pending", "paid"] as OrderStatus[];

  const notes: Record<string, string> = {
    pending: "Order placed, awaiting payment confirmation",
    paid: "Payment captured successfully",
    packed: "All merchants have packed their items",
    shipped: "Handed to courier partner",
    delivered: "Delivered to customer",
  };

  reached.forEach((s, i) => {
    events.push({
      at: daysAgo(Math.max(placedDay - i, 0), 9 + i * 2),
      status: s,
      note: notes[s] ?? s,
      actor: s === "packed" ? "Merchant" : s === "shipped" || s === "delivered" ? "Courier" : "System",
    });
  });

  if (status === "cancelled") {
    events.push({ at: daysAgo(Math.max(placedDay - 1, 0), 14), status: "cancelled", note: "Cancelled by customer before dispatch", actor: "Customer" });
  }
  if (status === "refunded") {
    events.push({ at: daysAgo(Math.max(placedDay - 2, 0), 12), status: "refunded", note: "Refund of full amount initiated to source", actor: "Admin" });
  }
  return events;
}

export const orders: Order[] = [];
export const fulfilments: Fulfilment[] = [];

function build() {
  for (let i = 0; i < 140; i++) {
    const n = i + 1;
    const placedDay = rng.int(0, 89);
    // Weight the demo customer heavily so "My orders" has a rich history to
    // demo tracking, returns and reviews against; the rest spread normally.
    const customer = rng.chance(0.4) ? customers[0]! : rng.pick(customers);
    const status = rng.pick(STATUS_POOL);
    const orderId = `ord_${String(n).padStart(4, "0")}`;
    const orderNumber = `EK-${26000 + n}`;

    // 1–4 distinct products, deliberately spanning merchants sometimes.
    const picked = rng.shuffle(activeProducts).slice(0, rng.int(1, 4));
    const items: OrderItem[] = picked.map((p, k) => {
      const qty = rng.int(1, 3);
      return {
        id: `oit_${String(n).padStart(4, "0")}_${k + 1}`,
        product_id: p.id,
        merchant_id: p.merchant_id,
        merchant_name: p.merchant_name,
        name_snapshot: p.name,
        sku_snapshot: p.sku,
        unit_price_snapshot: p.price,
        image_hue: p.image_hue,
        quantity: qty,
        line_total: p.price * qty,
      };
    });

    const subtotal = items.reduce((s, it) => s + it.line_total, 0);
    const hasCoupon = rng.chance(0.28);
    const discount = hasCoupon ? Math.round(subtotal * rng.float(0.05, 0.2)) : 0;
    const shipping = subtotal - discount > 99900 ? 0 : 4900;
    const tax = Math.round((subtotal - discount) * 0.18);
    const total = subtotal - discount + tax + shipping;

    // Split into one fulfilment per merchant — the marketplace core.
    const byMerchant = new Map<string, OrderItem[]>();
    for (const it of items) {
      const list = byMerchant.get(it.merchant_id) ?? [];
      list.push(it);
      byMerchant.set(it.merchant_id, list);
    }

    const fIds: string[] = [];
    let fi = 0;
    for (const [merchantId, mItems] of byMerchant) {
      fi += 1;
      const merchant = merchants.find((m) => m.id === merchantId)!;
      const fSubtotal = mItems.reduce((s, it) => s + it.line_total, 0);
      const commission = Math.round((fSubtotal * merchant.commission_pct) / 100);
      const fId = `ful_${String(n).padStart(4, "0")}_${fi}`;
      fIds.push(fId);

      const shippedIdx = FLOW.indexOf(status);
      fulfilments.push({
        id: fId,
        order_id: orderId,
        order_number: orderNumber,
        merchant_id: merchantId,
        merchant_name: merchant.business_name,
        status,
        items: mItems,
        subtotal: fSubtotal,
        commission,
        net_to_merchant: fSubtotal - commission,
        shipping: Math.round(shipping / byMerchant.size),
        shipment_id: shippedIdx >= 3 ? `shp_${String(n).padStart(4, "0")}_${fi}` : null,
        courier: null,
        awb: null,
        packed_at: shippedIdx >= 2 ? daysAgo(Math.max(placedDay - 2, 0), 13) : null,
        shipped_at: shippedIdx >= 3 ? daysAgo(Math.max(placedDay - 3, 0), 15) : null,
        delivered_at: status === "delivered" ? daysAgo(Math.max(placedDay - 4, 0), 17) : null,
        sla_due_at: daysAgo(Math.max(placedDay - Math.ceil(merchant.fulfilment_sla_hrs / 24), 0), 10),
        is_breaching_sla: status === "paid" && placedDay > 3,
      });
    }

    orders.push({
      id: orderId,
      order_number: orderNumber,
      user_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_email: customer.email,
      status,
      payment_status:
        status === "pending" ? "unpaid"
        : status === "refunded" ? "refunded"
        : status === "cancelled" ? (rng.chance(0.5) ? "refunded" : "failed")
        : "captured",
      payment_method: rng.pick(PAY_METHODS),
      items,
      fulfilment_ids: fIds,
      merchant_count: byMerchant.size,
      item_count: items.reduce((s, it) => s + it.quantity, 0),
      subtotal,
      discount,
      coupon_code: hasCoupon ? rng.pick(["WELCOME10", "FEST20", "FREESHIP", "BIGSAVE15"]) : null,
      tax,
      shipping,
      total,
      shipping_address: rng.pick(ADDRESSES),
      timeline: timelineFor(status, placedDay),
      placed_at: daysAgo(placedDay, 11),
    });
  }

  orders.sort((a, b) => b.placed_at.localeCompare(a.placed_at));

  for (const c of customers) {
    const mine = orders.filter((o) => o.user_id === c.id && o.status !== "cancelled");
    c.orders_count = mine.length;
    c.lifetime_value = mine.reduce((s, o) => s + o.total, 0);
  }
}

build();

export const orderById = (id: string) => orders.find((o) => o.id === id);
export const orderByNumber = (n: string) => orders.find((o) => o.order_number === n);
export const fulfilmentById = (id: string) => fulfilments.find((f) => f.id === id);
export const fulfilmentsForOrder = (orderId: string) =>
  fulfilments.filter((f) => f.order_id === orderId);
export const fulfilmentsForMerchant = (merchantId: string) =>
  fulfilments.filter((f) => f.merchant_id === merchantId);
