import type { ReturnEvent, ReturnItem, ReturnRequest, ReturnStatus } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { orders, fulfilments } from "./orders";
import { merchants } from "./merchants";

const rng = makeRng(30991);

const REASONS = [
  { reason: "damaged" as const, comment: "The outer box was fine but the product itself has a cracked casing on the left side. Photos attached." },
  { reason: "wrong_item" as const, comment: "I ordered the black variant and received the grey one. The invoice says black." },
  { reason: "not_as_described" as const, comment: "The listing said the battery lasts 40 hours; I am getting about 12 with the same settings." },
  { reason: "missing_parts" as const, comment: "The charging cable and carry pouch listed in the box contents were not included." },
  { reason: "changed_mind" as const, comment: "Ordered by mistake, still sealed. Happy to return at my cost." },
  { reason: "quality_issue" as const, comment: "The stitching came apart after two days of normal use." },
];

const STATUS_FLOW: ReturnStatus[] = [
  "requested", "approved", "pickup_scheduled", "picked_up", "refunded",
];

const NOTES: Record<ReturnStatus, string> = {
  requested: "Return requested by the customer",
  approved: "Merchant approved the return",
  rejected: "Merchant declined the return",
  pickup_scheduled: "Reverse pickup scheduled with the courier",
  picked_up: "Courier collected the item",
  refunded: "Refund issued to the original payment method",
};

export const returns: ReturnRequest[] = [];

const delivered = fulfilments.filter((f) => f.status === "delivered").slice(0, 14);

delivered.forEach((f, i) => {
  const order = orders.find((o) => o.id === f.order_id);
  if (!order) return;

  const merchant = merchants.find((m) => m.id === f.merchant_id)!;
  const seed = REASONS[i % REASONS.length]!;
  const atDoor = rng.chance(0.25);

  // Spread across the lifecycle so every state is visible in the UI.
  const status: ReturnStatus =
    i % 7 === 0 ? "requested"
    : i % 7 === 1 ? "requested"
    : i % 7 === 2 ? "approved"
    : i % 7 === 3 ? "rejected"
    : i % 7 === 4 ? "pickup_scheduled"
    : i % 7 === 5 ? "picked_up"
    : "refunded";

  const items: ReturnItem[] = f.items.slice(0, rng.int(1, f.items.length)).map((it) => ({
    order_item_id: it.id,
    product_id: it.product_id,
    name: it.name_snapshot,
    sku: it.sku_snapshot,
    image_hue: it.image_hue,
    quantity: it.quantity,
    unit_price: it.unit_price_snapshot,
  }));

  const refund = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const day = 18 - i;

  const reached = status === "rejected"
    ? (["requested", "rejected"] as ReturnStatus[])
    : STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1);

  const timeline: ReturnEvent[] = reached.map((st, k) => ({
    at: daysAgo(Math.max(day - k, 0), 10 + k * 2),
    status: st,
    note: NOTES[st],
    actor: st === "requested" ? order.customer_name
      : st === "picked_up" ? "Courier"
      : st === "refunded" ? "System"
      : merchant.business_name,
    actor_role: st === "requested" ? "customer"
      : st === "picked_up" ? "agent"
      : st === "refunded" ? "admin"
      : "merchant",
  }));

  returns.push({
    id: `rma_${String(i + 1).padStart(3, "0")}`,
    rma_number: `RMA-${8100 + i}`,
    order_id: order.id,
    order_number: order.order_number,
    fulfilment_id: f.id,
    user_id: order.user_id,
    customer_name: order.customer_name,
    merchant_id: f.merchant_id,
    merchant_name: f.merchant_name,
    rejected_at_door: atDoor,
    reason: seed.reason,
    comment: seed.comment,
    evidence: seed.reason === "changed_mind" ? [] : Array.from(
      { length: rng.int(1, 2) },
      (_, k) => ({
        id: `med_rma_${i}_${k}`,
        kind: "image" as const,
        filename: `return_evidence_${i}_${k}.jpg`,
        mime: "image/jpeg",
        size_bytes: rng.int(240000, 3600000),
        hue: (i * 41 + k * 70) % 360,
        duration_s: null,
        pages: null,
        alt: "Return evidence",
        uploaded_by: order.customer_name,
        uploaded_at: daysAgo(day),
      }),
    ),
    items,
    refund_amount: refund,
    status,
    resolution: status === "rejected" ? "none" : status === "refunded" ? "refund" : "refund",
    merchant_response: status === "rejected"
      ? "The item shows clear signs of use beyond inspection, which falls outside our 14-day policy."
      : status === "approved" || status === "pickup_scheduled" || status === "picked_up" || status === "refunded"
        ? "Sorry about this — approved. Our courier will collect it, and the refund goes out once we receive it."
        : null,
    timeline,
    created_at: daysAgo(day, 10),
    resolved_at: status === "refunded" || status === "rejected"
      ? daysAgo(Math.max(day - reached.length, 0), 15) : null,
  });
});

returns.sort((a, b) => b.created_at.localeCompare(a.created_at));

export const returnById = (id: string) => returns.find((r) => r.id === id);
export const returnsForUser = (userId: string) => returns.filter((r) => r.user_id === userId);
export const returnsForMerchant = (merchantId: string) =>
  returns.filter((r) => r.merchant_id === merchantId);
export const returnForOrder = (orderId: string) => returns.filter((r) => r.order_id === orderId);
