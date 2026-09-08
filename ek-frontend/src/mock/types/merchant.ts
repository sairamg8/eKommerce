export type MerchantStatus = "pending" | "active" | "suspended" | "rejected";

export type Merchant = {
  id: string;
  business_name: string;
  slug: string;
  owner_user_id: string;
  owner_name: string;
  email: string;
  phone: string;
  status: MerchantStatus;
  /** Platform's cut, percent of item subtotal. Negotiated per merchant. */
  commission_pct: number;
  rating: number;
  rating_count: number;
  product_count: number;
  orders_count: number;
  /** All money in paise. */
  gross_sales: number;
  platform_fees: number;
  net_earnings: number;
  pending_payout: number;
  fulfilment_sla_hrs: number;
  on_time_rate: number;
  cancellation_rate: number;
  logo_hue: number;
  gstin: string;
  city: string;
  state: string;
  joined_at: string;
  approved_at: string | null;
};

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export type Payout = {
  id: string;
  merchant_id: string;
  merchant_name: string;
  /** gross - commission - refunds, in paise */
  gross: number;
  commission: number;
  refunds: number;
  net: number;
  status: PayoutStatus;
  period_start: string;
  period_end: string;
  orders_count: number;
  utr: string | null;
  initiated_at: string;
  settled_at: string | null;
};
