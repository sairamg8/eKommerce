import type { DeliveryTask } from "../types";
import { makeRng } from "../core/rng";
import { agents } from "./agents";
import { shipments } from "./shipments";

const rng = makeRng(19283);

const SLOTS = ["09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 21:00"];

export const deliveryTasks: DeliveryTask[] = [];

let n = 0;
for (const s of shipments) {
  if (!s.agent_id) continue;

  const isDone = s.status === "delivered";
  const isFailed = s.status === "failed_attempt";
  n += 1;

  deliveryTasks.push({
    id: `tsk_${String(n).padStart(4, "0")}`,
    shipment_id: s.id,
    awb: s.awb,
    agent_id: s.agent_id,
    type: "delivery",
    status: isDone ? "completed" : isFailed ? "failed" : s.status === "out_for_delivery" ? "in_progress" : "assigned",
    address: s.destination,
    pincode: s.pincode,
    contact_name: s.customer_name,
    contact_phone: s.customer_phone,
    is_cod: s.is_cod,
    cod_amount: s.cod_amount,
    slot: rng.pick(SLOTS),
    sequence: 0,
    distance_km: Number(rng.float(0.8, 18.4).toFixed(1)),
  });
}

// Number the open tasks per agent in route order.
for (const a of agents) {
  const open = deliveryTasks.filter(
    (t) => t.agent_id === a.id && t.status !== "completed",
  );
  open.sort((x, y) => x.distance_km - y.distance_km);
  open.forEach((t, i) => { t.sequence = i + 1; });
  a.active_tasks = open.length;
}

export const tasksForAgent = (agentId: string) =>
  deliveryTasks.filter((t) => t.agent_id === agentId);
export const taskById = (id: string) => deliveryTasks.find((t) => t.id === id);
export const taskForShipment = (shipmentId: string) =>
  deliveryTasks.find((t) => t.shipment_id === shipmentId);
