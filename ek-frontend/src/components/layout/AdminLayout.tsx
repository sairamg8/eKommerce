import { ConsoleShell } from "./ConsoleShell";
import type { NavGroup } from "./ConsoleShell";
import { merchants, payouts, adminUser, shipments, tickets } from "../../mock/db";

export function AdminLayout() {
  const pending = merchants.filter((m) => m.status === "pending").length;
  const pendingPayouts = payouts.filter((p) => p.status === "pending").length;
  const failedShipments = shipments.filter((s) => s.status === "failed_attempt").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;

  const groups: NavGroup[] = [
    { items: [{ to: "/admin", label: "Overview", icon: "chart", end: true }] },
    {
      heading: "Marketplace",
      items: [
        { to: "/admin/merchants", label: "Merchants", icon: "store", badge: pending },
        { to: "/admin/products", label: "Catalogue", icon: "package" },
        { to: "/admin/orders", label: "Orders", icon: "list" },
        { to: "/admin/shipments", label: "Shipments", icon: "truck", badge: failedShipments },
      ],
    },
    {
      heading: "Money",
      items: [
        { to: "/admin/payouts", label: "Payouts", icon: "wallet", badge: pendingPayouts, badgeMuted: true },
        { to: "/admin/coupons", label: "Coupons", icon: "tag" },
      ],
    },
    {
      heading: "Support",
      items: [
        { to: "/admin/tickets", label: "Email tickets", icon: "file", badge: openTickets },
        { to: "/admin/chat", label: "Live chat", icon: "bell" },
      ],
    },
    {
      heading: "People",
      items: [
        { to: "/admin/users", label: "Users", icon: "users" },
        { to: "/admin/settings", label: "Settings", icon: "settings" },
      ],
    },
  ];

  return (
    <ConsoleShell
      title="eKommerce"
      role="Admin console"
      accent="linear-gradient(135deg, #4f46e5, #3730a3)"
      groups={groups}
      user={{
        name: `${adminUser.first_name} ${adminUser.last_name}`,
        sub: "Platform admin",
        hue: adminUser.avatar_hue,
      }}
    />
  );
}
