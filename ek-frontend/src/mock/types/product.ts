export type ProductStatus = "draft" | "active" | "archived";

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_name: string;
  merchant_id: string;
  merchant_name: string;
  /** paise — integer money, never a float */
  price: number;
  compare_at_price: number | null;
  /** paise — admin-only, drives margin reporting */
  cost: number;
  status: ProductStatus;
  /** Derived: SUM(stock_movements.quantity). Never a mutable column. */
  stock: number;
  low_stock_threshold: number;
  /** jsonb — category-specific fields, per the Category Schema decision */
  attributes: Record<string, string | number | boolean>;
  image_hue: number;
  avg_rating: number;
  review_count: number;
  units_sold: number;
  created_at: string;
  updated_at: string;
};

export type ProductFilters = {
  category?: string;
  min_price?: number;
  max_price?: number;
  status?: ProductStatus;
  merchant?: string;
  in_stock_only?: boolean;
  min_rating?: number;
};
