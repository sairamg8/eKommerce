import type { OrderItem, OrderStatus } from "./order";

/**
 * An order fans out into one fulfilment per merchant. This is the core
 * marketplace lesson: the customer sees ONE order, each merchant sees
 * only their slice, and money splits per slice.
 */
export type Fulfilment = {
  id: string;
  order_id: string;
  order_number: string;
  merchant_id: string;
  merchant_name: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  /** subtotal * merchant.commission_pct */
  commission: number;
  net_to_merchant: number;
  shipping: number;
  shipment_id: string | null;
  courier: string | null;
  awb: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  sla_due_at: string;
  is_breaching_sla: boolean;
};
