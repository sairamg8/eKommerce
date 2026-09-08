import type { Payout } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { merchants } from "./merchants";

const rng = makeRng(77123);

export const payouts: Payout[] = [];

let n = 0;
for (const m of merchants.filter((x) => x.status === "active" || x.status === "suspended")) {
  // Weekly settlement cycles, most recent first.
  for (let week = 0; week < 8; week++) {
    n += 1;
    const gross = rng.int(40000, 620000) * 100;
    const commission = Math.round((gross * m.commission_pct) / 100);
    const refunds = rng.chance(0.35) ? rng.int(1000, 22000) * 100 : 0;
    const status: Payout["status"] =
      week === 0 ? "pending" : week === 1 ? rng.pick(["processing", "paid"] as const)
      : rng.chance(0.06) ? "failed" : "paid";
    const start = 7 * (week + 1);

    payouts.push({
      id: `pay_${String(n).padStart(4, "0")}`,
      merchant_id: m.id,
      merchant_name: m.business_name,
      gross,
      commission,
      refunds,
      net: gross - commission - refunds,
      status,
      period_start: daysAgo(start),
      period_end: daysAgo(start - 6),
      orders_count: rng.int(8, 96),
      utr: status === "paid" ? `UTR${rng.int(100000000000, 999999999999)}` : null,
      initiated_at: daysAgo(start - 7),
      settled_at: status === "paid" ? daysAgo(start - 9) : null,
    });
  }
}

payouts.sort((a, b) => b.period_end.localeCompare(a.period_end));

export const payoutsForMerchant = (merchantId: string) =>
  payouts.filter((p) => p.merchant_id === merchantId);
export const payoutById = (id: string) => payouts.find((p) => p.id === id);
