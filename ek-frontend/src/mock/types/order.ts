export type OrderStatus =
  | "pending"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "authorized" | "captured" | "failed" | "refunded";

export type OrderItem = {
  id: string;
  product_id: string;
  merchant_id: string;
  merchant_name: string;
  /** Snapshotted at purchase — never re-read from products. */
  name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  image_hue: number;
  quantity: number;
  line_total: number;
};

export type OrderEvent = {
  at: string;
  status: OrderStatus;
  note: string;
  actor: string;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  items: OrderItem[];
  /** One per merchant in the order — the marketplace split. */
  fulfilment_ids: string[];
  merchant_count: number;
  item_count: number;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  tax: number;
  shipping: number;
  total: number;
  shipping_address: string;
  timeline: OrderEvent[];
  placed_at: string;
};
