import type { Courier } from "../types";
import { makeRng } from "../core/rng";

const rng = makeRng(5150);

const SOUTH = ["Karnataka", "Tamil Nadu", "Kerala", "Telangana", "Andhra Pradesh"];
const WEST = ["Maharashtra", "Gujarat", "Rajasthan", "Goa"];
const NORTH = ["Delhi", "Punjab", "Haryana", "Uttar Pradesh", "Uttarakhand"];
const EAST = ["West Bengal", "Odisha", "Bihar", "Assam"];
const ALL = [...SOUTH, ...WEST, ...NORTH, ...EAST];

type Seed = { name: string; code: string; sla: number; cod: boolean; states: string[] };

const SEED: Seed[] = [
  { name: "SwiftShip Logistics", code: "SWFT", sla: 2, cod: true,  states: ALL },
  { name: "BlueDart Express",    code: "BLDT", sla: 1, cod: true,  states: ALL },
  { name: "Kaveri Couriers",     code: "KVRI", sla: 3, cod: true,  states: [...SOUTH, ...WEST] },
  { name: "Northline Freight",   code: "NLFR", sla: 4, cod: false, states: [...NORTH, ...EAST] },
  { name: "Metro Same-Day",      code: "MTSD", sla: 1, cod: false, states: ["Karnataka", "Maharashtra", "Delhi"] },
];

export const couriers: Courier[] = SEED.map((s, i) => ({
  id: `cur_${String(i + 1).padStart(3, "0")}`,
  name: s.name,
  code: s.code,
  logo_hue: (i * 67 + 200) % 360,
  sla_days: s.sla,
  rating: Number(rng.float(3.5, 4.8).toFixed(2)),
  on_time_rate: Number(rng.float(0.79, 0.98).toFixed(3)),
  cod_supported: s.cod,
  base_rate: rng.int(40, 90) * 100,
  per_kg_rate: rng.int(18, 45) * 100,
  active_shipments: rng.int(12, 340),
  serviceable_states: s.states,
}));

export const courierById = (id: string) => couriers.find((c) => c.id === id);
