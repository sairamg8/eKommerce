export type TrendPoint = { label: string; value: number };

export type Kpi = {
  key: string;
  label: string;
  value: number;
  format: "money" | "number" | "percent";
  delta_pct: number;
  spark: number[];
};

export type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
  units: number;
};

export type TopProduct = {
  product_id: string;
  name: string;
  sku: string;
  units: number;
  revenue: number;
  margin_pct: number;
};

export type StatusBreakdown = { status: string; count: number; value: number };

export type CategoryRevenue = { category: string; revenue: number; units: number };
