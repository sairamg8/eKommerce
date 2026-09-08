import type {
  ApiPaged, Coupon, ListQuery, Merchant, MerchantStatus, Payout, Product, User,
} from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search, sortRows } from "../core/paginate";
import { merchants, merchantById, products, users, coupons, payouts, customers } from "../db";

/** GET /admin/merchants */
export function listMerchants(query: ListQuery & { status?: MerchantStatus } = {}): Promise<ApiPaged<Merchant>> {
  return respond(() => {
    let rows = merchants.slice();
    if (query.status) rows = rows.filter((m) => m.status === query.status);
    rows = search(rows, query.q, ["business_name", "owner_name", "email", "city"]);
    rows = sortRows(rows, query.sort ?? "gross_sales", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);
}

export const getMerchant = (id: string): Promise<Merchant> =>
  respond(() => {
    const m = merchantById(id);
    if (!m) throw new MockApiError(404, "Merchant not found");
    return m;
  }, DELAY.fast);

/** PATCH /admin/merchants/:id/status — approve, reject or suspend. */
export function setMerchantStatus(id: string, status: MerchantStatus): Promise<Merchant> {
  return respond(() => {
    const m = merchantById(id);
    if (!m) throw new MockApiError(404, "Merchant not found");
    if (m.status === status) throw new MockApiError(409, `Already ${status}`);
    m.status = status;
    if (status === "active" && !m.approved_at) m.approved_at = new Date().toISOString();
    return m;
  }, DELAY.normal);
}

/** PATCH /admin/merchants/:id/commission */
export function setCommission(id: string, pct: number): Promise<Merchant> {
  return respond(() => {
    const m = merchantById(id);
    if (!m) throw new MockApiError(404, "Merchant not found");
    if (pct < 0 || pct > 40) throw new MockApiError(422, "Commission must be between 0 and 40%");
    m.commission_pct = pct;
    return m;
  }, DELAY.normal);
}

/** GET /admin/products — every merchant's catalogue. */
export function listAllProducts(query: ListQuery & { merchant?: string; status?: string } = {}): Promise<ApiPaged<Product>> {
  return respond(() => {
    let rows = products.slice();
    if (query.merchant) rows = rows.filter((p) => p.merchant_id === query.merchant);
    if (query.status) rows = rows.filter((p) => p.status === query.status);
    rows = search(rows, query.q, ["name", "sku", "merchant_name", "category_name"]);
    rows = sortRows(rows, query.sort ?? "units_sold", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);
}

/** GET /admin/users */
export function listUsers(query: ListQuery & { role?: string } = {}): Promise<ApiPaged<User>> {
  return respond(() => {
    let rows = query.role ? users.filter((u) => u.role === query.role) : users.slice();
    rows = search(rows, query.q, ["first_name", "last_name", "email"]);
    rows = sortRows(rows, query.sort ?? "lifetime_value", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);
}

/** PATCH /admin/users/:id/active */
export function toggleUserActive(id: string): Promise<User> {
  return respond(() => {
    const u = users.find((x) => x.id === id);
    if (!u) throw new MockApiError(404, "User not found");
    if (u.role === "admin") throw new MockApiError(403, "Admin accounts cannot be deactivated");
    u.is_active = !u.is_active;
    return u;
  }, DELAY.normal);
}

/** GET /admin/coupons */
export const listCoupons = (query: ListQuery = {}): Promise<ApiPaged<Coupon>> =>
  respond(() => {
    let rows = search(coupons.slice(), query.q, ["code", "description"]);
    rows = sortRows(rows, query.sort ?? "usage_count", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);

/** PATCH /admin/coupons/:id */
export function toggleCoupon(id: string): Promise<Coupon> {
  return respond(() => {
    const c = coupons.find((x) => x.id === id);
    if (!c) throw new MockApiError(404, "Coupon not found");
    c.is_active = !c.is_active;
    return c;
  }, DELAY.fast);
}

/** GET /admin/payouts */
export const listPayouts = (query: ListQuery & { status?: string } = {}): Promise<ApiPaged<Payout>> =>
  respond(() => {
    let rows = payouts.slice();
    if (query.status) rows = rows.filter((p) => p.status === query.status);
    rows = search(rows, query.q, ["merchant_name", "utr"]);
    rows = sortRows(rows, query.sort ?? "period_end", query.dir ?? "desc");
    return paginate(rows, query);
  }, DELAY.normal);

/** POST /admin/payouts/:id/settle */
export function settlePayout(id: string): Promise<Payout> {
  return respond(() => {
    const p = payouts.find((x) => x.id === id);
    if (!p) throw new MockApiError(404, "Payout not found");
    if (p.status === "paid") throw new MockApiError(409, "This payout is already settled");
    p.status = "paid";
    p.utr = `UTR${Math.floor(100000000000 + customers.length * 7654321)}`;
    p.settled_at = new Date().toISOString();
    return p;
  }, DELAY.slow);
}
