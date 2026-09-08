# Learning Project: Full-Stack E-commerce (PERN + Microfrontend UI)

## Purpose

Master a backend-heavy, data-heavy PERN stack build, then integrate it with a
microfrontend UI. Backend comes first — Postgres, Express, correct data modeling
under concurrency — before any UI work starts. The frontend, once it starts, is
itself a deliberate architecture exercise: multiple independently-built apps
composed together, not a single React SPA.

## Stack decisions

- **Database:** PostgreSQL
- **Server:** Node.js + Express
- **Data access:** Raw SQL using `pg` (node-postgres) exclusively. No Knex, no query builders, and no ORM (e.g. Prisma). The point is to write, understand, and optimize real SQL natively, which is excellent for deep learning and maximum performance.
- **Auth:** JWT + bcrypt
- **Frontend (later):** React, split into microfrontends (see below)
- **State management:** user's own plan — intentionally not specified here

## Scope (v1)

Single seller, single currency, no marketplace/multi-vendor, no product variants
(size/color) — those are stretch goals. Focus is catalog → cart → checkout → orders →
payments → reviews → coupons → admin reporting, with inventory tracking as one
subsystem inside that, not a separate project.

## Domain model

| Entity | Purpose |
|---|---|
| `users` | customer/admin roles, JWT auth, bcrypt passwords |
| `categories`, `products` | catalog (SKU, price, cost, description) |
| `stock_movements` | append-only ledger — stock in (restock) / stock out (order placed) / adjustment. Current stock = `SUM(stock_movements)` for a product, not a mutable counter — mirrors how real inventory/accounting systems work and sets up the reporting phase. |
| `carts`, `cart_items` | pre-checkout state, tied to user or session |
| `orders`, `order_items` | placed orders — snapshot price/product details at time of purchase; never re-read live product price for a historical order |
| `payments` | mock payment records first, Stripe test-mode later |
| `reviews` | product_id, user_id, rating, comment — aggregated onto `products` (avg_rating, review_count) |
| `coupons` | code, discount type/value, expiry — applied at checkout |

## Frontend / microfrontend architecture

Two microfrontends, split by audience, plus a thin shell:

- **Shell/host app** — composes the MFEs, owns cross-cutting concerns only (auth
  token, top-level routing). No business logic.
- **Storefront MFE** — catalog browsing, cart, checkout, account. Customer-facing.
- **Admin MFE** — product/order management, reports dashboard. Admin-facing.
- **Composition:** Vite Module Federation (`@originjs/vite-plugin-federation`) —
  each MFE builds and can deploy independently; the shell loads them at runtime.
  (Consistent with the Vite tooling already in use for the design system.)
- **Design system tie-in:** `my-components` (this repo's Storybook library) becomes
  the shared UI kit both MFEs consume — the component work already done here feeds
  directly into this phase.
- **Cross-MFE communication:** kept minimal and explicit — the backend API is the
  source of truth; MFEs refetch rather than share live client state across the
  boundary. Exact state management approach (store choice, event patterns) is the
  user's own plan and isn't dictated here.

## Phased build order

1. **Setup** — Postgres, custom raw SQL migrations/seeds using `pg`, Express skeleton, centralized error
   handling, request logging.
2. **Auth & RBAC** — users, JWT login/refresh, admin vs customer middleware.
3. **Catalog CRUD** — categories/products, pagination, filtering (price range,
   category), search (Postgres full-text search), sorting.
4. **Cart** — add/remove/update items, totals computed server-side (never trust
   client-sent prices).
5. **Checkout** — the core lesson. One DB transaction: lock stock rows
   (`SELECT ... FOR UPDATE`), validate availability, apply coupon, create order +
   order_items (price-snapshotted), write `stock_movements`, clear cart. Two
   simultaneous checkouts against the last unit of stock must not both succeed.
6. **Reviews & ratings** — write reviews, maintain aggregated rating on `products`
   (trigger vs application-level — deliberate tradeoff to explore).
7. **Payments** — mock payment flow first (mark order paid), swap in Stripe test mode
   once the flow works end to end.
8. **Admin reports** — revenue by day/month, top-selling products, low-stock alerts,
   order status breakdown. `GROUP BY`, window functions, `EXPLAIN ANALYZE` on the
   slow queries.
9. **Performance** — indexes (especially filtering/search columns), cursor pagination
   for product listing at scale, Redis cache for hot catalog queries.
10. **Testing** — supertest integration tests, plus a concurrency test: fire two
    simultaneous checkouts against 1 unit of stock, assert exactly one succeeds.
11. **Stretch** — order status state machine (pending → paid → shipped → delivered),
    Stripe webhook handling, CSV export for admin, background job (BullMQ) for
    abandoned-cart emails, product variants, multi-warehouse inventory.
12. **Frontend shell & MFE scaffolding** — Vite Module Federation setup, shell app,
    routing between the Storefront and Admin MFEs.
13. **Storefront MFE** — catalog browsing, cart, checkout UI, consuming the backend
    API and the `my-components` design system.
14. **Admin MFE** — product/order management UI, reports dashboard.
15. **Cross-MFE integration** — auth token sharing via the shell, cart-count/event
    communication across the boundary, each MFE built and run independently
    (separate dev servers, or simulated separate deploys).

## Working agreement

- Backend-first. Frontend/microfrontend work begins only after phase 10 (testing)
  is done.
- Guided, not built-for-you: implementation steps are walked through step by step;
  code isn't written on the user's behalf unless explicitly asked.
