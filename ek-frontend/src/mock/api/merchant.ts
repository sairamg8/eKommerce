import type { ApiPaged, Fulfilment, ListQuery, LowStockAlert, Payout, Product, StockMovement } from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search, sortRows } from "../core/paginate";
import {
  products, productById, fulfilments, fulfilmentById, movementsForProduct,
  lowStockAlerts, payoutsForMerchant, stockMovements, nextId, merchantById,
} from "../db";

/** GET /merchant/products — scoped to the signed-in merchant. */
export function listProducts(merchantId: string, query: ListQuery & { status?: string } = {}): Promise<ApiPaged<Product>> {
  return respond(() => {
    let rows = products.filter((p) => p.merchant_id === merchantId);
    if (query.status) rows = rows.filter((p) => p.status === query.status);
    rows = search(rows, query.q, ["name", "sku", "category_name"]);
    rows = sortRows(rows, query.sort ?? "updated_at", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);
}

/** PATCH /merchant/products/:id */
export function updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
  return respond(() => {
    const p = productById(id);
    if (!p) throw new MockApiError(404, "Product not found");
    if (patch.price != null && patch.price <= 0) {
      throw new MockApiError(422, "Price must be greater than zero", { price: ["Price must be greater than zero"] });
    }
    Object.assign(p, patch, { updated_at: new Date().toISOString() });
    return p;
  }, DELAY.normal);
}

/** GET /merchant/orders — the merchant's slice of each order. */
export function listFulfilments(merchantId: string, query: ListQuery & { status?: string } = {}): Promise<ApiPaged<Fulfilment>> {
  return respond(() => {
    let rows = fulfilments.filter((f) => f.merchant_id === merchantId);
    if (query.status) rows = rows.filter((f) => f.status === query.status);
    rows = search(rows, query.q, ["order_number", "awb"]);
    return paginate(rows, query);
  }, DELAY.normal);
}

/** POST /merchant/orders/:id/pack — merchant marks their slice packed. */
export function markPacked(fulfilmentId: string): Promise<Fulfilment> {
  return respond(() => {
    const f = fulfilmentById(fulfilmentId);
    if (!f) throw new MockApiError(404, "Fulfilment not found");
    if (f.status !== "paid") throw new MockApiError(409, `Cannot pack an order that is ${f.status}`);
    f.status = "packed";
    f.packed_at = new Date().toISOString();
    return f;
  }, DELAY.normal);
}

/** GET /merchant/inventory/:productId — the append-only ledger. */
export const getMovements = (productId: string): Promise<StockMovement[]> =>
  respond(() => movementsForProduct(productId), DELAY.fast);

/**
 * POST /merchant/inventory/restock — appends to stock_movements.
 * Stock is never a mutable column; it is SUM(quantity).
 */
export function restock(productId: string, quantity: number, note: string): Promise<StockMovement> {
  return respond(() => {
    const p = productById(productId);
    if (!p) throw new MockApiError(404, "Product not found");
    if (quantity === 0) throw new MockApiError(422, "Quantity cannot be zero");
    if (p.stock + quantity < 0) {
      throw new MockApiError(409, `Cannot remove ${Math.abs(quantity)} — only ${p.stock} in stock`);
    }
    p.stock += quantity;
    const movement: StockMovement = {
      id: nextId("stk"),
      product_id: p.id, product_name: p.name, sku: p.sku,
      quantity, reason: quantity > 0 ? "restock" : "adjustment",
      reference: null, note: note || (quantity > 0 ? "Manual restock" : "Manual adjustment"),
      balance_after: p.stock,
      actor: merchantById(p.merchant_id)?.business_name ?? "Merchant",
      created_at: new Date().toISOString(),
    };
    stockMovements.unshift(movement);
    return movement;
  }, DELAY.normal);
}

export const getLowStock = (merchantId: string): Promise<LowStockAlert[]> =>
  respond(() => lowStockAlerts(merchantId), DELAY.fast);

export const listPayouts = (merchantId: string, query: ListQuery = {}): Promise<ApiPaged<Payout>> =>
  respond(() => paginate(payoutsForMerchant(merchantId), query), DELAY.normal);
