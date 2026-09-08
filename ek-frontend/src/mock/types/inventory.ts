export type MovementReason =
  | "restock"
  | "sale"
  | "adjustment"
  | "return"
  | "damage";

/** Append-only ledger. Current stock = SUM(quantity) for a product. */
export type StockMovement = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  /** Positive = stock in, negative = stock out. Never updated or deleted. */
  quantity: number;
  reason: MovementReason;
  reference: string | null;
  note: string | null;
  balance_after: number;
  actor: string;
  created_at: string;
};

export type LowStockAlert = {
  product_id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  units_sold_30d: number;
  /** stock / (units_sold_30d / 30) — null when nothing has sold. */
  days_of_cover: number | null;
};
