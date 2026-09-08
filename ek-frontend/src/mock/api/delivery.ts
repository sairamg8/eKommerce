import type {
  ApiPaged, Attachment, AttachmentKind, DeliveryStatus, DeliveryTask,
  ListQuery, Shipment, TrackingEvent,
} from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search } from "../core/paginate";
import {
  shipments, shipmentById, deliveryTasks, tasksForAgent, taskForShipment,
  agentById, fulfilments, orderById, nextId,
} from "../db";

/** GET /delivery/tasks — the agent's route for today. */
export const listTasks = (agentId: string): Promise<DeliveryTask[]> =>
  respond(() => tasksForAgent(agentId).slice().sort((a, b) => {
    const rank = (t: DeliveryTask) => (t.status === "completed" || t.status === "failed" ? 1 : 0);
    return rank(a) - rank(b) || a.sequence - b.sequence;
  }), DELAY.normal);

export const listAgentShipments = (agentId: string, query: ListQuery = {}): Promise<ApiPaged<Shipment>> =>
  respond(() => {
    const rows = search(
      shipments.filter((s) => s.agent_id === agentId),
      query.q, ["awb", "customer_name", "order_number"],
    );
    return paginate(rows, query);
  }, DELAY.normal);

export const getShipment = (id: string): Promise<Shipment> =>
  respond(() => {
    const s = shipmentById(id);
    if (!s) throw new MockApiError(404, "Shipment not found");
    return s;
  }, DELAY.fast);

const DESCRIPTIONS: Record<DeliveryStatus, string> = {
  awaiting_pickup: "Shipment manifested. Awaiting merchant pickup.",
  picked_up: "Picked up from merchant warehouse.",
  in_transit: "In transit to destination hub.",
  at_hub: "Arrived at destination hub.",
  out_for_delivery: "Out for delivery with the assigned agent.",
  delivered: "Delivered. Proof of delivery captured.",
  failed_attempt: "Delivery attempt failed — recipient unavailable.",
  returned: "Returned to origin after failed attempts.",
};

/** Which transitions the backend must allow, and nothing else. */
const ALLOWED: Record<DeliveryStatus, DeliveryStatus[]> = {
  awaiting_pickup: ["picked_up"],
  picked_up: ["in_transit"],
  in_transit: ["at_hub", "out_for_delivery"],
  at_hub: ["out_for_delivery"],
  out_for_delivery: ["delivered", "failed_attempt"],
  failed_attempt: ["out_for_delivery", "returned"],
  delivered: [],
  returned: [],
};

export const allowedTransitions = (from: DeliveryStatus) => ALLOWED[from];

let attSeq = 5000;

export function makeAttachment(kind: AttachmentKind, by: string, filename?: string): Attachment {
  attSeq += 1;
  const ext = kind === "invoice" ? "pdf" : "jpg";
  return {
    id: `att_${attSeq}`,
    kind,
    filename: filename ?? `${kind}_${attSeq}.${ext}`,
    mime: ext === "pdf" ? "application/pdf" : "image/jpeg",
    size_bytes: 120_000 + ((attSeq * 7919) % 1_800_000),
    hue: (attSeq * 53) % 360,
    uploaded_by: by,
    uploaded_at: new Date().toISOString(),
  };
}

/**
 * POST /delivery/shipments/:id/events
 * The agent scans a status and optionally attaches proof. This is the
 * endpoint the delivery app hits; it must validate the transition.
 */
export function addTrackingEvent(input: {
  shipmentId: string;
  status: DeliveryStatus;
  note?: string;
  location?: string;
  attachments?: Attachment[];
  actor: string;
}): Promise<Shipment> {
  return respond(() => {
    const s = shipmentById(input.shipmentId);
    if (!s) throw new MockApiError(404, "Shipment not found");

    if (!ALLOWED[s.status].includes(input.status)) {
      throw new MockApiError(409,
        `Cannot move from "${s.status.replace(/_/g, " ")}" to "${input.status.replace(/_/g, " ")}"`);
    }
    if (input.status === "delivered" && !(input.attachments ?? []).some((a) => a.kind === "pod_photo")) {
      throw new MockApiError(422, "A proof-of-delivery photo is required to mark this delivered");
    }

    const now = new Date().toISOString();
    const event: TrackingEvent = {
      id: nextId("trk"),
      shipment_id: s.id,
      status: input.status,
      location: input.location ?? s.destination.split(",").slice(-2, -1)[0]?.trim() ?? "In network",
      description: input.note?.trim() || DESCRIPTIONS[input.status],
      at: now,
      actor: input.actor,
      actor_role: "agent",
      attachments: input.attachments ?? [],
    };

    s.events.unshift(event);
    s.status = input.status;

    if (input.status === "picked_up") s.picked_up_at = now;
    if (input.status === "delivered") { s.delivered_at = now; s.attempts += 1; }
    if (input.status === "failed_attempt") s.attempts += 1;

    // Keep the task and the merchant's fulfilment in step.
    const task = taskForShipment(s.id);
    if (task) {
      task.status =
        input.status === "delivered" ? "completed"
        : input.status === "failed_attempt" ? "failed"
        : input.status === "out_for_delivery" ? "in_progress"
        : task.status;
    }
    const f = fulfilments.find((x) => x.id === s.fulfilment_id);
    if (f) {
      if (input.status === "picked_up") { f.status = "shipped"; f.shipped_at = now; }
      if (input.status === "delivered") { f.status = "delivered"; f.delivered_at = now; }
    }
    const order = orderById(s.order_id);
    if (order) {
      const all = fulfilments.filter((x) => x.order_id === order.id);
      if (all.every((x) => x.status === "delivered")) {
        order.status = "delivered";
        order.timeline.push({ at: now, status: "delivered", note: "All packages delivered", actor: input.actor });
      } else if (all.some((x) => x.status === "shipped")) {
        order.status = "shipped";
      }
    }

    if (s.agent_id) {
      const agent = agentById(s.agent_id);
      if (agent) {
        agent.active_tasks = deliveryTasks.filter(
          (t) => t.agent_id === agent.id && t.status !== "completed" && t.status !== "failed",
        ).length;
        if (input.status === "delivered") agent.deliveries_today += 1;
      }
    }

    return s;
  }, DELAY.normal);
}
