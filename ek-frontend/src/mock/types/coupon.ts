export type DiscountType = "percentage" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  /** Percent (0-100) when percentage, paise when fixed. */
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};
