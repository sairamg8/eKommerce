/**
 * The in-memory "database". Everything the prototype mutates lives here,
 * so clicks actually change state for the rest of the session.
 * Reloading the page resets it — that is intentional for a prototype.
 */
import type { Cart, CartItem } from "./types";
import { load, save } from "./core/persist";

export { categories, categoryTree, categoryById, leafCategories } from "./data/categories";
export { merchants, activeMerchants, merchantById, merchantBySlug } from "./data/merchants";
export { users, customers, adminUser, userById, userByEmail } from "./data/users";
export { products, activeProducts, productById, productBySlug } from "./data/products";
export { orders, fulfilments, orderById, orderByNumber, fulfilmentById, fulfilmentsForOrder, fulfilmentsForMerchant } from "./data/orders";
export { couriers, courierById } from "./data/couriers";
export { agents, currentAgent, agentById } from "./data/agents";
export { shipments, shipmentById, shipmentByAwb, shipmentsForOrder, shipmentsForAgent } from "./data/shipments";
export { deliveryTasks, tasksForAgent, taskById, taskForShipment } from "./data/tasks";
export { reviews, reviewsForProduct, ratingBreakdown } from "./data/reviews";
export { coupons, couponByCode } from "./data/coupons";
export { stockMovements, movementsForProduct, lowStockAlerts } from "./data/inventory";
export { payouts, payoutsForMerchant } from "./data/payouts";
export { conversations, messages, conversationById, messagesFor, conversationsOfKind } from "./data/conversations";
export { tickets, ticketById, nextTicketNumber } from "./data/tickets";
export { returns, returnById, returnsForUser, returnsForMerchant, returnForOrder } from "./data/returns";

const EMPTY_CART: Cart = {
  id: "crt_session",
  user_id: null,
  session_id: "sess_local",
  items: [] as CartItem[],
  coupon_code: null,
  totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 },
  updated_at: new Date().toISOString(),
};

/** Mutable session state — the cart lives client-side until checkout. */
export const session: { cart: Cart } = {
  cart: load<Cart>("cart", EMPTY_CART),
};

/** Called after every cart mutation so a refresh does not lose the cart. */
export const persistCart = () => save("cart", session.cart);

/** Monotonic id helper for records created during the session. */
let seq = 9000;
export const nextId = (prefix: string) => `${prefix}_${++seq}`;
