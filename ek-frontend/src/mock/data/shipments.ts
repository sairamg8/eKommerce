import type { Attachment, DeliveryStatus, Shipment, TrackingEvent } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { couriers } from "./couriers";
import { agents } from "./agents";
import { fulfilments, orderById } from "./orders";

const rng = makeRng(90210);

const HUBS = ["Bengaluru Hub", "Mumbai Sortation", "Delhi NCR Hub", "Chennai Gateway", "Hyderabad Hub", "Kolkata Hub", "Pune Facility"];

/** Which delivery statuses precede a given one, in order. */
const CHAIN: DeliveryStatus[] = [
  "awaiting_pickup", "picked_up", "in_transit", "at_hub", "out_for_delivery", "delivered",
];

const DESCRIPTIONS: Record<DeliveryStatus, string> = {
  awaiting_pickup: "Shipment manifested. Awaiting merchant pickup.",
  picked_up: "Picked up from merchant warehouse.",
  in_transit: "In transit to destination hub.",
  at_hub: "Arrived at destination hub. Sorted for delivery.",
  out_for_delivery: "Out for delivery with the assigned agent.",
  delivered: "Delivered. Proof of delivery captured.",
  failed_attempt: "Delivery attempt failed — recipient unavailable.",
  returned: "Returned to origin after failed attempts.",
};

let attN = 0;
function attachment(kind: Attachment["kind"], by: string, at: string): Attachment {
  attN += 1;
  const ext = kind === "invoice" ? "pdf" : "jpg";
  return {
    id: `att_${String(attN).padStart(4, "0")}`,
    kind,
    filename: `${kind}_${String(attN).padStart(4, "0")}.${ext}`,
    mime: ext === "pdf" ? "application/pdf" : "image/jpeg",
    size_bytes: rng.int(80_000, 2_400_000),
    hue: (attN * 53 + 30) % 360,
    uploaded_by: by,
    uploaded_at: at,
  };
}

export const shipments: Shipment[] = [];

function build() {
  const shippable = fulfilments.filter((f) => f.shipment_id);

  shippable.forEach((f, i) => {
    const order = orderById(f.order_id);
    if (!order) return;

    const courier = couriers[i % couriers.length]!;
    const agent = agents[i % agents.length]!;
    const pincode = order.shipping_address.match(/(\d{6})/)?.[1] ?? "560001";
    const city = order.shipping_address.split(",").slice(-2, -1)[0]?.trim() ?? "Bengaluru";
    const isCod = order.payment_method === "Cash on Delivery";

    let status: DeliveryStatus;
    if (f.status === "delivered") status = "delivered";
    else if (f.status === "shipped") status = rng.pick(["in_transit", "at_hub", "out_for_delivery", "failed_attempt"] as const);
    else status = "awaiting_pickup";

    const awb = `${courier.code}${rng.int(100000000, 999999999)}`;
    f.courier = courier.name;
    f.awb = awb;

    const placedDay = Math.round(
      (Date.now() - new Date(order.placed_at).getTime()) / 86_400_000,
    );

    // Build the event chain up to the current status.
    const endIdx =
      status === "failed_attempt"
        ? CHAIN.indexOf("out_for_delivery")
        : CHAIN.indexOf(status);

    const events: TrackingEvent[] = [];
    for (let k = 0; k <= endIdx; k++) {
      const s = CHAIN[k]!;
      const at = daysAgo(Math.max(placedDay - 2 - k, 0), 8 + k * 2);
      const atts: Attachment[] = [];
      if (s === "picked_up") atts.push(attachment("label", f.merchant_name, at));
      if (s === "picked_up") atts.push(attachment("invoice", f.merchant_name, at));
      if (s === "delivered") {
        atts.push(attachment("pod_photo", agent.name, at));
        atts.push(attachment("signature", agent.name, at));
      }
      events.push({
        id: `trk_${f.id}_${k}`,
        shipment_id: f.shipment_id!,
        status: s,
        location: k <= 1 ? `${f.merchant_name} Warehouse` : k >= 4 ? city : rng.pick(HUBS),
        description: DESCRIPTIONS[s],
        at,
        actor: k === 0 ? "System" : k === 1 ? agent.name : k >= 4 ? agent.name : courier.name,
        actor_role: k === 0 ? "system" : k === 1 || k >= 4 ? "agent" : "courier",
        attachments: atts,
      });
    }

    if (status === "failed_attempt") {
      const at = daysAgo(Math.max(placedDay - 7, 0), 18);
      events.push({
        id: `trk_${f.id}_fail`,
        shipment_id: f.shipment_id!,
        status: "failed_attempt",
        location: city,
        description: DESCRIPTIONS.failed_attempt,
        at,
        actor: agent.name,
        actor_role: "agent",
        attachments: [attachment("damage_photo", agent.name, at)],
      });
    }

    shipments.push({
      id: f.shipment_id!,
      awb,
      order_id: f.order_id,
      order_number: f.order_number,
      fulfilment_id: f.id,
      merchant_id: f.merchant_id,
      merchant_name: f.merchant_name,
      courier_id: courier.id,
      courier_name: courier.name,
      agent_id: endIdx >= 4 || status === "failed_attempt" ? agent.id : null,
      agent_name: endIdx >= 4 || status === "failed_attempt" ? agent.name : null,
      status,
      customer_name: order.customer_name,
      customer_phone: `+91 ${rng.int(70, 99)}${rng.int(10000000, 99999999)}`,
      destination: order.shipping_address,
      pincode,
      weight_g: rng.int(220, 8400),
      is_cod: isCod,
      cod_amount: isCod ? order.total : 0,
      attempts: status === "failed_attempt" ? rng.int(1, 2) : status === "delivered" ? 1 : 0,
      events: events.reverse(),
      eta: daysAgo(Math.max(placedDay - 2 - courier.sla_days, -3), 18),
      picked_up_at: endIdx >= 1 ? events[events.length - 2]?.at ?? null : null,
      delivered_at: status === "delivered" ? events[0]!.at : null,
      created_at: daysAgo(Math.max(placedDay - 2, 0), 8),
    });
  });
}

build();

export const shipmentById = (id: string) => shipments.find((s) => s.id === id);
export const shipmentByAwb = (awb: string) =>
  shipments.find((s) => s.awb.toLowerCase() === awb.toLowerCase());
export const shipmentsForOrder = (orderId: string) =>
  shipments.filter((s) => s.order_id === orderId);
export const shipmentsForAgent = (agentId: string) =>
  shipments.filter((s) => s.agent_id === agentId);
