import type { ApiPaged, Category, ListQuery, Product, ProductFilters, RatingBreakdown, Review } from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search, sortRows } from "../core/paginate";
import { activeProducts, categoryTree, categories, productBySlug, reviewsForProduct, ratingBreakdown, merchantBySlug } from "../db";

export type CatalogQuery = ListQuery & ProductFilters;

/** GET /catalog/products — public, no auth. */
export function listProducts(query: CatalogQuery = {}): Promise<ApiPaged<Product>> {
  return respond(() => {
    let rows = activeProducts.slice();

    if (query.category) {
      const cat = categories.find((c) => c.slug === query.category);
      if (cat) {
        const ids = cat.depth === 0
          ? categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)
          : [cat.id];
        rows = rows.filter((p) => ids.includes(p.category_id));
      }
    }
    if (query.merchant) {
      const m = merchantBySlug(query.merchant);
      rows = rows.filter((p) => p.merchant_id === m?.id);
    }
    if (query.min_price != null) rows = rows.filter((p) => p.price >= query.min_price! * 100);
    if (query.max_price != null) rows = rows.filter((p) => p.price <= query.max_price! * 100);
    if (query.min_rating != null) rows = rows.filter((p) => p.avg_rating >= query.min_rating!);
    if (query.in_stock_only) rows = rows.filter((p) => p.stock > 0);

    rows = search(rows, query.q, ["name", "description", "sku", "merchant_name"]);

    const sort = query.sort ?? "relevance";
    if (sort === "price") rows = sortRows(rows, "price", query.dir ?? "asc");
    else if (sort === "rating") rows = sortRows(rows, "avg_rating", "desc");
    else if (sort === "newest") rows = sortRows(rows, "created_at", "desc");
    else if (sort === "popular") rows = sortRows(rows, "units_sold", "desc");

    return paginate(rows, query);
  }, DELAY.normal);
}

/** GET /catalog/products/:slug — public. */
export function getProduct(slug: string): Promise<Product> {
  return respond(() => {
    const p = productBySlug(slug);
    if (!p) throw new MockApiError(404, `No product found for "${slug}"`);
    return p;
  }, DELAY.fast);
}

/** GET /catalog/products/:id/reviews */
export function getReviews(productId: string): Promise<{ reviews: Review[]; breakdown: RatingBreakdown }> {
  return respond(() => ({
    reviews: reviewsForProduct(productId),
    breakdown: ratingBreakdown(productId),
  }), DELAY.fast);
}

/** GET /catalog/categories — public, returns the nested tree. */
export function getCategories(): Promise<Category[]> {
  return respond(() => categoryTree(), DELAY.fast);
}

/** GET /catalog/products/:id/related */
export function getRelated(product: Product): Promise<Product[]> {
  return respond(
    () => activeProducts
      .filter((p) => p.category_id === product.category_id && p.id !== product.id)
      .slice(0, 4),
    DELAY.fast,
  );
}

/** Facet counts for the filter rail — a real backend does this in one GROUP BY. */
export function getFacets(): Promise<{ priceMax: number; categories: { slug: string; name: string; count: number }[] }> {
  return respond(() => ({
    priceMax: Math.ceil(Math.max(...activeProducts.map((p) => p.price)) / 100),
    categories: categories
      .filter((c) => c.depth === 0)
      .map((c) => ({ slug: c.slug, name: c.name, count: c.product_count })),
  }), DELAY.fast);
}
