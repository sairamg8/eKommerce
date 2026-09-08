import type { RatingBreakdown, Review } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { activeProducts } from "./products";
import { customers } from "./users";

const rng = makeRng(31337);

const TITLES = [
  "Exactly what I needed", "Great value for the price", "Solid build quality",
  "Does the job well", "Better than expected", "Good, with one caveat",
  "Would buy again", "Impressive for the money", "Decent but not perfect",
  "Arrived quickly, works great",
];

const BODIES = [
  "Used it daily for three weeks now. Build quality is genuinely good and it has held up to travel without any issues. Packaging was solid too.",
  "Does what it claims. Setup took under five minutes. The only nitpick is that the documentation is a bit thin, but the product itself is fine.",
  "Bought this after comparing four options in the same range. This one won on build and warranty. No regrets so far.",
  "Good product overall. Delivery was fast and the merchant packed it carefully. Would order from them again.",
  "Works well for my use case. Slightly heavier than I expected from the listing photos, but that is on me for not checking specs.",
  "Excellent. I have already recommended it to two colleagues. The finish feels far more premium than the price suggests.",
  "Solid, but the accessories included are basic. Plan on buying a better cable separately.",
  "Three months in and still going strong. Battery life matches what was advertised, which is rare.",
];

export const reviews: Review[] = [];

let n = 0;
for (const product of activeProducts) {
  const count = Math.min(product.review_count, rng.int(0, 9));
  for (let i = 0; i < count; i++) {
    n += 1;
    const author = rng.pick(customers);
    const rating = rng.chance(0.68) ? rng.int(4, 5) : rng.int(2, 4);
    reviews.push({
      id: `rvw_${String(n).padStart(4, "0")}`,
      product_id: product.id,
      user_id: author.id,
      author_name: `${author.first_name} ${author.last_name[0]}.`,
      author_hue: author.avatar_hue,
      rating,
      title: rng.pick(TITLES),
      body: rng.pick(BODIES),
      verified_purchase: rng.chance(0.78),
      media: rng.chance(0.3)
        ? Array.from({ length: rng.int(1, 3) }, (_, k) => {
            const isVideo = k === 0 && rng.chance(0.18);
            return {
              id: `med_rvw_${n}_${k}`,
              kind: isVideo ? ("video" as const) : ("image" as const),
              filename: isVideo ? `review_clip_${n}.mp4` : `review_photo_${n}_${k}.jpg`,
              mime: isVideo ? "video/mp4" : "image/jpeg",
              size_bytes: rng.int(180000, 4200000),
              hue: (n * 31 + k * 60) % 360,
              duration_s: isVideo ? rng.int(8, 45) : null,
              pages: null,
              alt: "Customer photo",
              uploaded_by: `${author.first_name} ${author.last_name[0]}.`,
              uploaded_at: daysAgo(rng.int(1, 180)),
            };
          })
        : [],
      helpful_count: rng.int(0, 64),
      created_at: daysAgo(rng.int(1, 180)),
    });
  }
}

reviews.sort((a, b) => b.created_at.localeCompare(a.created_at));

export const reviewsForProduct = (productId: string) =>
  reviews.filter((r) => r.product_id === productId);

export function ratingBreakdown(productId: string): RatingBreakdown {
  const rows = reviewsForProduct(productId);
  const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of rows) counts[r.rating - 1] = (counts[r.rating - 1] ?? 0) + 1;
  const total = rows.length;
  const average = total
    ? Number((rows.reduce((s, r) => s + r.rating, 0) / total).toFixed(2))
    : 0;
  return { average, total, counts };
}
