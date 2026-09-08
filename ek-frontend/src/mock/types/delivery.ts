export type AttachmentKind =
  | "pod_photo"
  | "signature"
  | "invoice"
  | "damage_photo"
  | "id_proof"
  | "label";

/** Uploaded against a tracking event. Stored as object-storage keys server-side. */
export type Attachment = {
  id: string;
  kind: AttachmentKind;
  filename: string;
  mime: string;
  size_bytes: number;
  /** Placeholder hue — a real build stores an S3/MinIO key here. */
  hue: number;
  uploaded_by: string;
  uploaded_at: string;
};

export type DeliveryStatus =
  | "awaiting_pickup"
  | "picked_up"
  | "in_transit"
  | "at_hub"
  | "out_for_delivery"
  | "delivered"
  | "failed_attempt"
  | "returned";

export type TrackingEvent = {
  id: string;
  shipment_id: string;
  status: DeliveryStatus;
  location: string;
  description: string;
  at: string;
  actor: string;
  actor_role: "system" | "merchant" | "courier" | "agent" | "customer";
  attachments: Attachment[];
};

export type Courier = {
  id: string;
  name: string;
  code: string;
  logo_hue: number;
  sla_days: number;
  rating: number;
  on_time_rate: number;
  cod_supported: boolean;
  base_rate: number;
  per_kg_rate: number;
  active_shipments: number;
  serviceable_states: string[];
};

export type AgentStatus = "available" | "on_route" | "offline";

/** The delivery partner on the ground — gets their own portal. */
export type DeliveryAgent = {
  id: string;
  name: string;
  phone: string;
  courier_id: string;
  courier_name: string;
  hue: number;
  zone: string;
  city: string;
  vehicle: "bike" | "van" | "cycle";
  status: AgentStatus;
  active_tasks: number;
  deliveries_today: number;
  deliveries_total: number;
  rating: number;
  success_rate: number;
};

export type Shipment = {
  id: string;
  awb: string;
  order_id: string;
  order_number: string;
  fulfilment_id: string;
  merchant_id: string;
  merchant_name: string;
  courier_id: string;
  courier_name: string;
  agent_id: string | null;
  agent_name: string | null;
  status: DeliveryStatus;
  customer_name: string;
  customer_phone: string;
  destination: string;
  pincode: string;
  weight_g: number;
  is_cod: boolean;
  cod_amount: number;
  attempts: number;
  events: TrackingEvent[];
  eta: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

/** The agent's work item — what the delivery portal lists. */
export type DeliveryTask = {
  id: string;
  shipment_id: string;
  awb: string;
  agent_id: string;
  type: "pickup" | "delivery";
  status: "assigned" | "in_progress" | "completed" | "failed";
  address: string;
  pincode: string;
  contact_name: string;
  contact_phone: string;
  is_cod: boolean;
  cod_amount: number;
  slot: string;
  sequence: number;
  distance_km: number;
};
