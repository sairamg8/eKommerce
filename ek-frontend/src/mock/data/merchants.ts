import type { Merchant } from "../types";
import { daysAgo, makeRng, slugify } from "../core/rng";

const rng = makeRng(20260831);

type Seed = {
  name: string;
  owner: string;
  city: string;
  state: string;
  status: Merchant["status"];
  commission: number;
};

const SEED: Seed[] = [
  { name: "Aurora Audio Labs",  owner: "Rhea Kapoor",  city: "Bengaluru", state: "Karnataka",   status: "active",    commission: 12 },
  { name: "Meridian Computing", owner: "Arjun Nair",   city: "Pune",      state: "Maharashtra", status: "active",    commission: 8  },
  { name: "Hearth & Co.",       owner: "Meera Iyer",   city: "Chennai",   state: "Tamil Nadu",  status: "active",    commission: 15 },
  { name: "Northline Apparel",  owner: "Devika Rao",   city: "Mumbai",    state: "Maharashtra", status: "active",    commission: 18 },
  { name: "IronPeak Fitness",   owner: "Sameer Ghosh", city: "Delhi",     state: "Delhi",       status: "active",    commission: 14 },
  { name: "Foliopress Books",   owner: "Kabir Menon",  city: "Kochi",     state: "Kerala",      status: "active",    commission: 10 },
  { name: "Lumen Optics",       owner: "Tara Bhatt",   city: "Hyderabad", state: "Telangana",   status: "suspended", commission: 12 },
  { name: "Vantage Gear Co.",   owner: "Nikhil Sethi", city: "Jaipur",    state: "Rajasthan",   status: "pending",   commission: 15 },
  { name: "Terra Living",       owner: "Ananya Verma", city: "Ahmedabad", state: "Gujarat",     status: "pending",   commission: 15 },
  { name: "Clockwork Supply",   owner: "Rohan Pillai", city: "Kolkata",   state: "West Bengal", status: "rejected",  commission: 15 },
];

export const merchants: Merchant[] = SEED.map((s, i) => {
  const id = `mch_${String(i + 1).padStart(3, "0")}`;
  const live = s.status === "active";
  const gross = live ? rng.int(800000, 9200000) * 100 : 0;
  const fees = Math.round((gross * s.commission) / 100);
  const joined = 260 - i * 18;
  const [first = "", last = ""] = s.owner.split(" ");
  return {
    id,
    business_name: s.name,
    slug: slugify(s.name),
    owner_user_id: `usr_m${String(i + 1).padStart(2, "0")}`,
    owner_name: s.owner,
    email: `${first.toLowerCase()}@${slugify(s.name).replace(/-/g, "")}.in`,
    phone: `+91 ${rng.int(70, 99)}${rng.int(10000000, 99999999)}`,
    status: s.status,
    commission_pct: s.commission,
    rating: live ? Number(rng.float(3.6, 4.9).toFixed(2)) : 0,
    rating_count: live ? rng.int(120, 3400) : 0,
    product_count: 0,
    orders_count: live ? rng.int(40, 480) : 0,
    gross_sales: gross,
    platform_fees: fees,
    net_earnings: gross - fees,
    pending_payout: live ? rng.int(20000, 480000) * 100 : 0,
    fulfilment_sla_hrs: rng.pick([24, 24, 48, 72]),
    on_time_rate: live ? Number(rng.float(0.82, 0.995).toFixed(3)) : 0,
    cancellation_rate: live ? Number(rng.float(0.004, 0.06).toFixed(3)) : 0,
    logo_hue: (i * 47 + 15) % 360,
    gstin: `${rng.int(10, 36)}${last.toUpperCase().padEnd(5, "X").slice(0, 5)}${rng.int(1000, 9999)}${rng.pick("ABCDEFGHJKLMNPQR".split(""))}1Z${rng.int(0, 9)}`,
    city: s.city,
    state: s.state,
    joined_at: daysAgo(joined),
    approved_at: live || s.status === "suspended" ? daysAgo(joined - 3) : null,
  };
});

export const activeMerchants = merchants.filter((m) => m.status === "active");
export const merchantById = (id: string) => merchants.find((m) => m.id === id);
export const merchantBySlug = (slug: string) => merchants.find((m) => m.slug === slug);
