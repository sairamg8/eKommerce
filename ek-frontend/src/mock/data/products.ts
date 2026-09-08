import type { Product } from "../types";
import { daysAgo, makeRng, slugify } from "../core/rng";
import { PRODUCT_SEED } from "./product-seed";
import { categories } from "./categories";
import { merchants } from "./merchants";

const rng = makeRng(31081990);

/** Which merchant sells which leaf category. Mirrors a real vendor split. */
const CATEGORY_MERCHANT: Record<string, string> = {
  "electronics-audio": "mch_001",
  "electronics-wearables": "mch_001",
  "electronics-cameras": "mch_007",
  "computers-laptops": "mch_002",
  "computers-peripherals": "mch_002",
  "computers-storage": "mch_002",
  "home-kitchen-cookware": "mch_003",
  "home-kitchen-appliances": "mch_003",
  "home-kitchen-decor": "mch_003",
  "fashion-men": "mch_004",
  "fashion-women": "mch_004",
  "fashion-accessories": "mch_004",
  "fitness-equipment": "mch_005",
  "fitness-supplements": "mch_005",
  "books-technology": "mch_006",
  "books-business": "mch_006",
};

const SKU_PREFIX: Record<string, string> = {
  mch_001: "AUR", mch_002: "MER", mch_003: "HTH", mch_004: "NRT",
  mch_005: "IRN", mch_006: "FLP", mch_007: "LUM",
};

function build(): Product[] {
  const out: Product[] = [];
  let n = 0;

  for (const [catSlug, seeds] of Object.entries(PRODUCT_SEED)) {
    const cat = categories.find((c) => c.slug === catSlug);
    const merchantId = CATEGORY_MERCHANT[catSlug];
    if (!cat || !merchantId) continue;
    const merchant = merchants.find((m) => m.id === merchantId)!;

    for (const seed of seeds) {
      n += 1;
      const price = seed.price * 100;
      const discounted = rng.chance(0.35);
      const stock = rng.chance(0.08) ? 0 : rng.int(2, 240);
      const threshold = rng.pick([5, 10, 15, 20]);
      const status: Product["status"] =
        merchant.status !== "active" ? "archived"
        : rng.chance(0.06) ? "draft"
        : "active";

      out.push({
        id: `prd_${String(n).padStart(3, "0")}`,
        sku: `${SKU_PREFIX[merchantId] ?? "GEN"}-${String(n).padStart(4, "0")}`,
        name: seed.name,
        slug: slugify(seed.name),
        description:
          `${seed.name} from ${merchant.business_name}. Built for daily use with a ` +
          `two-year warranty, free returns within 14 days, and dispatch within ` +
          `${merchant.fulfilment_sla_hrs} hours of order confirmation.`,
        category_id: cat.id,
        category_name: cat.name,
        merchant_id: merchantId,
        merchant_name: merchant.business_name,
        price,
        compare_at_price: discounted ? Math.round(price * rng.float(1.12, 1.45)) : null,
        cost: Math.round(price * rng.float(0.42, 0.72)),
        status,
        stock,
        low_stock_threshold: threshold,
        attributes: seed.attrs,
        image_hue: (n * 37 + 11) % 360,
        avg_rating: Number(rng.float(3.2, 4.95).toFixed(2)),
        review_count: rng.int(0, 480),
        units_sold: rng.int(0, 1400),
        created_at: daysAgo(rng.int(30, 250)),
        updated_at: daysAgo(rng.int(0, 29)),
      });
    }
  }
  return out;
}

export const products: Product[] = build();

/** Denormalised counters the backend would maintain with a trigger or a job. */
for (const c of categories) {
  c.product_count = products.filter((p) => p.category_id === c.id).length;
}
for (const c of categories.filter((x) => x.depth === 0)) {
  const childIds = categories.filter((x) => x.parent_id === c.id).map((x) => x.id);
  c.product_count = products.filter((p) => childIds.includes(p.category_id)).length;
}
for (const m of merchants) {
  m.product_count = products.filter((p) => p.merchant_id === m.id).length;
}

export const activeProducts = products.filter((p) => p.status === "active");
export const productById = (id: string) => products.find((p) => p.id === id);
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
