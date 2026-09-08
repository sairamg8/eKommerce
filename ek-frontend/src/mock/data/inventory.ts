import type { LowStockAlert, MovementReason, StockMovement } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { products } from "./products";

const rng = makeRng(606060);

const NOTES: Record<MovementReason, string[]> = {
  restock: ["Purchase order received", "Supplier delivery — batch checked", "Quarterly restock"],
  sale: ["Order placed", "Order confirmed"],
  adjustment: ["Cycle count correction", "Reconciliation after audit"],
  return: ["Customer return — resalable", "RTO received back into stock"],
  damage: ["Damaged in transit — written off", "Failed QC on inbound"],
};

export const stockMovements: StockMovement[] = [];

let n = 0;
for (const p of products) {
  // Opening restock, then a ledger of ins and outs that sums to p.stock.
  const rows: Omit<StockMovement, "id" | "balance_after">[] = [];
  const opening = p.stock + rng.int(20, 180);

  rows.push({
    product_id: p.id, product_name: p.name, sku: p.sku,
    quantity: opening, reason: "restock",
    reference: `PO-${rng.int(1000, 9999)}`, note: NOTES.restock[0]!,
    actor: p.merchant_name, created_at: daysAgo(rng.int(180, 260)),
  });

  let running = opening;
  const events = rng.int(3, 9);
  for (let i = 0; i < events && running > p.stock; i++) {
    const reason = rng.pick(["sale", "sale", "sale", "adjustment", "damage", "return"] as const);
    const isOut = reason === "sale" || reason === "damage" || reason === "adjustment";
    const max = Math.max(running - p.stock, 1);
    const qty = isOut ? -Math.min(rng.int(1, 12), max) : rng.int(1, 4);
    running += qty;
    rows.push({
      product_id: p.id, product_name: p.name, sku: p.sku,
      quantity: qty, reason,
      reference: reason === "sale" ? `EK-${26000 + rng.int(1, 140)}` : null,
      note: rng.pick(NOTES[reason]),
      actor: reason === "sale" ? "System" : p.merchant_name,
      created_at: daysAgo(rng.int(1, 170)),
    });
  }

  // Final correction so the ledger sums exactly to the product's stock.
  if (running !== p.stock) {
    const delta = p.stock - running;
    running = p.stock;
    rows.push({
      product_id: p.id, product_name: p.name, sku: p.sku,
      quantity: delta, reason: delta > 0 ? "restock" : "adjustment",
      reference: null, note: "Cycle count correction",
      actor: p.merchant_name, created_at: daysAgo(rng.int(0, 20)),
    });
  }

  rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  let bal = 0;
  for (const r of rows) {
    bal += r.quantity;
    n += 1;
    stockMovements.push({ ...r, id: `stk_${String(n).padStart(5, "0")}`, balance_after: bal });
  }
}

stockMovements.sort((a, b) => b.created_at.localeCompare(a.created_at));

export const movementsForProduct = (productId: string) =>
  stockMovements.filter((m) => m.product_id === productId);

/** Verifies the ledger invariant: SUM(movements) === product.stock. */
export const stockOf = (productId: string) =>
  movementsForProduct(productId).reduce((s, m) => s + m.quantity, 0);

export function lowStockAlerts(merchantId?: string): LowStockAlert[] {
  return products
    .filter((p) => p.status === "active" && p.stock <= p.low_stock_threshold)
    .filter((p) => !merchantId || p.merchant_id === merchantId)
    .map((p) => {
      const sold30 = Math.round(p.units_sold / 12);
      return {
        product_id: p.id, name: p.name, sku: p.sku,
        stock: p.stock, threshold: p.low_stock_threshold,
        units_sold_30d: sold30,
        days_of_cover: sold30 > 0 ? Number((p.stock / (sold30 / 30)).toFixed(1)) : null,
      };
    })
    .sort((a, b) => a.stock - b.stock);
}
