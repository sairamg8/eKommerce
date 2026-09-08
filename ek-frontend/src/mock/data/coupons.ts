import type { Coupon } from "../types";
import { daysAgo } from "../core/rng";

export const coupons: Coupon[] = [
  {
    id: "cpn_001", code: "WELCOME10",
    description: "10% off your first order, capped at ₹500",
    discount_type: "percentage", discount_value: 10,
    min_order_value: 99900, max_discount: 50000,
    usage_limit: null, usage_count: 1284, per_user_limit: 1,
    starts_at: daysAgo(200), expires_at: daysAgo(-120), is_active: true,
  },
  {
    id: "cpn_002", code: "FEST20",
    description: "Festive sale — 20% off, capped at ₹2,000",
    discount_type: "percentage", discount_value: 20,
    min_order_value: 249900, max_discount: 200000,
    usage_limit: 5000, usage_count: 3891, per_user_limit: 2,
    starts_at: daysAgo(30), expires_at: daysAgo(-14), is_active: true,
  },
  {
    id: "cpn_003", code: "FREESHIP",
    description: "Free shipping on any order",
    discount_type: "fixed", discount_value: 4900,
    min_order_value: 0, max_discount: null,
    usage_limit: null, usage_count: 7420, per_user_limit: 5,
    starts_at: daysAgo(120), expires_at: daysAgo(-60), is_active: true,
  },
  {
    id: "cpn_004", code: "BIGSAVE15",
    description: "15% off orders above ₹10,000",
    discount_type: "percentage", discount_value: 15,
    min_order_value: 1000000, max_discount: 300000,
    usage_limit: 2000, usage_count: 640, per_user_limit: 1,
    starts_at: daysAgo(45), expires_at: daysAgo(-30), is_active: true,
  },
  {
    id: "cpn_005", code: "FLAT500",
    description: "Flat ₹500 off orders above ₹3,000",
    discount_type: "fixed", discount_value: 50000,
    min_order_value: 300000, max_discount: null,
    usage_limit: 1000, usage_count: 1000, per_user_limit: 1,
    starts_at: daysAgo(90), expires_at: daysAgo(10), is_active: false,
  },
  {
    id: "cpn_006", code: "SUMMER25",
    description: "Expired summer promotion — 25% off",
    discount_type: "percentage", discount_value: 25,
    min_order_value: 199900, max_discount: 150000,
    usage_limit: 3000, usage_count: 2140, per_user_limit: 1,
    starts_at: daysAgo(150), expires_at: daysAgo(60), is_active: false,
  },
];

export const couponByCode = (code: string) =>
  coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
