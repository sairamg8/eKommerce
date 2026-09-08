import { ConsoleShell } from "./ConsoleShell";
import type { NavGroup } from "./ConsoleShell";
import { merchants, fulfilments, products, payouts, returnsForMerchant } from "../../mock/db";

/** The signed-in merchant in the prototype. */
export const CURRENT_MERCHANT = merchants[0]!;

export function MerchantLayout() {
  const m = CURRENT_MERCHANT;
  const toPack = fulfilments.filter((f) => f.merchant_id === m.id && f.status === "paid").length;
  const lowStock = products.filter(
    (p) => p.merchant_id === m.id && p.status === "active" && p.stock <= p.low_stock_threshold,
  ).length;
  const duePayouts = payouts.filter((p) => p.merchant_id === m.id && p.status === "pending").length;
  const openReturns = returnsForMerchant(m.id).filter((r) => r.status === "requested").length;

  const groups: NavGroup[] = [
    { items: [{ to: "/merchant", label: "Dashboard", icon: "chart", end: true }] },
    {
      heading: "Sell",
      items: [
        { to: "/merchant/products", label: "My products", icon: "package" },
        { to: "/merchant/orders", label: "Orders", icon: "list", badge: toPack },
        { to: "/merchant/inventory", label: "Inventory", icon: "boxOpen", badge: lowStock },
        { to: "/merchant/returns", label: "Returns", icon: "refresh", badge: openReturns },
      ],
    },
    {
      heading: "Talk",
      items: [{ to: "/merchant/messages", label: "Messages", icon: "bell", badge: 2 }],
    },
    {
      heading: "Money",
      items: [{ to: "/merchant/payouts", label: "Payouts", icon: "wallet", badge: duePayouts, badgeMuted: true }],
    },
    {
      heading: "Account",
      items: [{ to: "/merchant/settings", label: "Settings", icon: "settings" }],
    },
  ];

  return (
    <ConsoleShell
      title={m.business_name}
      role="Merchant console"
      accent={`linear-gradient(135deg, hsl(${m.logo_hue} 65% 52%), hsl(${(m.logo_hue + 35) % 360} 60% 40%))`}
      groups={groups}
      user={{ name: m.owner_name, sub: `${m.commission_pct}% commission`, hue: m.logo_hue }}
    />
  );
}
