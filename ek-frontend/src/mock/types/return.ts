import type { MediaAsset } from "./media";

export type ReturnReason =
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "missing_parts"
  | "changed_mind"
  | "late_delivery"
  | "quality_issue";

export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "picked_up"
  | "refunded";

export type ReturnResolution = "refund" | "replacement" | "none";

export type ReturnItem = {
  order_item_id: string;
  product_id: string;
  name: string;
  sku: string;
  image_hue: number;
  quantity: number;
  unit_price: number;
};

export type ReturnEvent = {
  at: string;
  status: ReturnStatus;
  note: string;
  actor: string;
  actor_role: "customer" | "merchant" | "admin" | "agent";
};

/**
 * A rejection at the door or a post-delivery return. Both funnel here so
 * the merchant, admin and courier see one record.
 */
export type ReturnRequest = {
  id: string;
  rma_number: string;
  order_id: string;
  order_number: string;
  fulfilment_id: string;
  user_id: string;
  customer_name: string;
  merchant_id: string;
  merchant_name: string;
  /** True when the customer refused the parcel at the doorstep. */
  rejected_at_door: boolean;
  reason: ReturnReason;
  comment: string;
  /** Photos or video the customer attached as evidence. */
  evidence: MediaAsset[];
  items: ReturnItem[];
  refund_amount: number;
  status: ReturnStatus;
  resolution: ReturnResolution;
  /** Merchant's or admin's reply to the customer. */
  merchant_response: string | null;
  timeline: ReturnEvent[];
  created_at: string;
  resolved_at: string | null;
};

export const RETURN_REASONS: { value: ReturnReason; label: string; needsEvidence: boolean }[] = [
  { value: "damaged", label: "Arrived damaged or broken", needsEvidence: true },
  { value: "wrong_item", label: "Wrong item was sent", needsEvidence: true },
  { value: "not_as_described", label: "Not as described on the listing", needsEvidence: true },
  { value: "missing_parts", label: "Parts or accessories missing", needsEvidence: true },
  { value: "quality_issue", label: "Quality is not acceptable", needsEvidence: true },
  { value: "late_delivery", label: "Arrived too late to be useful", needsEvidence: false },
  { value: "changed_mind", label: "Changed my mind", needsEvidence: false },
];
