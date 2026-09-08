import type { Cart } from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { session, productById, couponByCode, nextId, persistCart } from "../db";

const FREE_SHIP_ABOVE = 99900;
const SHIP_FEE = 4900;
const TAX_RATE = 0.18;

/** Totals are always recomputed server-side — never trust a client price. */
function recalc(cart: Cart): Cart {
  const subtotal = cart.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  let discount = 0;
  if (cart.coupon_code) {
    const c = couponByCode(cart.coupon_code);
    if (c && c.is_active && subtotal >= c.min_order_value) {
      discount = c.discount_type === "percentage"
        ? Math.round((subtotal * c.discount_value) / 100)
        : c.discount_value;
      if (c.max_discount) discount = Math.min(discount, c.max_discount);
    } else {
      cart.coupon_code = null;
    }
  }

  const taxable = Math.max(subtotal - discount, 0);
  const shipping = taxable === 0 || taxable >= FREE_SHIP_ABOVE ? 0 : SHIP_FEE;
  const tax = Math.round(taxable * TAX_RATE);

  for (const i of cart.items) i.line_total = i.unit_price * i.quantity;
  cart.totals = { subtotal, discount, tax, shipping, total: taxable + tax + shipping };
  cart.updated_at = new Date().toISOString();
  persistCart();
  return cart;
}

export const getCart = (): Promise<Cart> =>
  respond(() => recalc(session.cart), DELAY.fast);

/** POST /cart/items */
export function addToCart(productId: string, quantity = 1): Promise<Cart> {
  return respond(() => {
    const p = productById(productId);
    if (!p) throw new MockApiError(404, "Product not found");
    if (p.stock <= 0) throw new MockApiError(409, `${p.name} is out of stock`);

    const existing = session.cart.items.find((i) => i.product_id === productId);
    const wanted = (existing?.quantity ?? 0) + quantity;
    if (wanted > p.stock) {
      throw new MockApiError(409, `Only ${p.stock} left of ${p.name}`);
    }

    if (existing) existing.quantity = wanted;
    else session.cart.items.push({
      id: nextId("cit"),
      product_id: p.id, name: p.name, sku: p.sku, slug: p.slug,
      image_hue: p.image_hue, unit_price: p.price,
      quantity, line_total: p.price * quantity, available_stock: p.stock,
    });

    return recalc(session.cart);
  }, DELAY.fast);
}

/** PATCH /cart/items/:id */
export function updateQuantity(itemId: string, quantity: number): Promise<Cart> {
  return respond(() => {
    const item = session.cart.items.find((i) => i.id === itemId);
    if (!item) throw new MockApiError(404, "Cart item not found");
    if (quantity < 1) {
      session.cart.items = session.cart.items.filter((i) => i.id !== itemId);
    } else if (quantity > item.available_stock) {
      throw new MockApiError(409, `Only ${item.available_stock} available`);
    } else {
      item.quantity = quantity;
    }
    return recalc(session.cart);
  }, DELAY.fast);
}

/** DELETE /cart/items/:id */
export const removeFromCart = (itemId: string): Promise<Cart> =>
  respond(() => {
    session.cart.items = session.cart.items.filter((i) => i.id !== itemId);
    return recalc(session.cart);
  }, DELAY.fast);

/** POST /cart/coupon */
export function applyCoupon(code: string): Promise<Cart> {
  return respond(() => {
    const c = couponByCode(code);
    if (!c) throw new MockApiError(404, `Coupon "${code}" is not valid`);
    if (!c.is_active) throw new MockApiError(409, `Coupon "${c.code}" has expired`);
    if (c.usage_limit && c.usage_count >= c.usage_limit) {
      throw new MockApiError(409, `Coupon "${c.code}" is fully redeemed`);
    }
    const subtotal = session.cart.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    if (subtotal < c.min_order_value) {
      throw new MockApiError(422, `Requires a minimum order of ₹${c.min_order_value / 100}`);
    }
    session.cart.coupon_code = c.code;
    return recalc(session.cart);
  }, DELAY.normal);
}

export const removeCoupon = (): Promise<Cart> =>
  respond(() => { session.cart.coupon_code = null; return recalc(session.cart); }, DELAY.fast);

export const clearCart = (): Promise<Cart> =>
  respond(() => {
    session.cart.items = [];
    session.cart.coupon_code = null;
    return recalc(session.cart);
  }, DELAY.fast);
