export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  slug: string;
  image_hue: number;
  /** Live price — a cart re-reads it, unlike an order which snapshots. */
  unit_price: number;
  quantity: number;
  line_total: number;
  available_stock: number;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
};

export type Cart = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  items: CartItem[];
  coupon_code: string | null;
  totals: CartTotals;
  updated_at: string;
};
