import type { MediaAsset } from "./media";

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  author_hue: number;
  rating: number;
  title: string;
  body: string;
  /** Only true when an order links this user to this product. */
  verified_purchase: boolean;
  /** Buyer-uploaded photos and video, like Amazon's customer images. */
  media: MediaAsset[];
  helpful_count: number;
  created_at: string;
};

export type RatingBreakdown = {
  average: number;
  total: number;
  /** Index 0 = 1 star … index 4 = 5 stars */
  counts: [number, number, number, number, number];
};
