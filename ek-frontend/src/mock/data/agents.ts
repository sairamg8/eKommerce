import type { DeliveryAgent } from "../types";
import { makeRng } from "../core/rng";
import { couriers } from "./couriers";

const rng = makeRng(88231);

type Seed = { name: string; city: string; zone: string };

const SEED: Seed[] = [
  { name: "Manoj Kumar",    city: "Bengaluru", zone: "BLR-South / Koramangala" },
  { name: "Suresh Babu",    city: "Bengaluru", zone: "BLR-East / Whitefield" },
  { name: "Ravi Teja",      city: "Hyderabad", zone: "HYD-West / Gachibowli" },
  { name: "Amit Yadav",     city: "Delhi",     zone: "DEL-South / Saket" },
  { name: "Prakash Jadhav", city: "Mumbai",    zone: "MUM-West / Andheri" },
  { name: "Selvam R",       city: "Chennai",   zone: "CHN-Central / T Nagar" },
  { name: "Deepak Shaw",    city: "Kolkata",   zone: "CCU-North / Salt Lake" },
  { name: "Harpreet Singh", city: "Pune",      zone: "PNQ-East / Kharadi" },
];

export const agents: DeliveryAgent[] = SEED.map((s, i) => {
  const courier = couriers[i % couriers.length]!;
  const [first = ""] = s.name.split(" ");
  return {
    id: `agt_${String(i + 1).padStart(3, "0")}`,
    name: s.name,
    phone: `+91 ${rng.int(70, 99)}${rng.int(10000000, 99999999)}`,
    courier_id: courier.id,
    courier_name: courier.name,
    hue: (i * 43 + 90) % 360,
    zone: s.zone,
    city: s.city,
    vehicle: rng.pick(["bike", "bike", "bike", "van", "cycle"] as const),
    status: i === 0 ? "on_route" : rng.pick(["available", "on_route", "offline"] as const),
    active_tasks: 0,
    deliveries_today: rng.int(0, 18),
    deliveries_total: rng.int(180, 4200),
    rating: Number(rng.float(3.8, 5).toFixed(2)),
    success_rate: Number(rng.float(0.88, 0.995).toFixed(3)),
    /** first name kept for the portal greeting */
    ...(first ? {} : {}),
  };
});

/** The agent whose portal you sign into in the prototype. */
export const currentAgent = agents[0]!;

export const agentById = (id: string) => agents.find((a) => a.id === id);
export const agentsByCourier = (courierId: string) =>
  agents.filter((a) => a.courier_id === courierId);
