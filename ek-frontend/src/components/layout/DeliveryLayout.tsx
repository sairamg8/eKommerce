import { ConsoleShell } from "./ConsoleShell";
import type { NavGroup } from "./ConsoleShell";
import { currentAgent, deliveryTasks } from "../../mock/db";

export const CURRENT_AGENT = currentAgent;

export function DeliveryLayout() {
  const a = CURRENT_AGENT;
  const open = deliveryTasks.filter(
    (t) => t.agent_id === a.id && t.status !== "completed" && t.status !== "failed",
  ).length;

  const groups: NavGroup[] = [
    {
      items: [
        { to: "/delivery", label: "My route", icon: "list", end: true, badge: open },
        { to: "/delivery/shipments", label: "All shipments", icon: "truck" },
        { to: "/delivery/performance", label: "Performance", icon: "chart" },
      ],
    },
  ];

  return (
    <ConsoleShell
      title={a.courier_name}
      role="Delivery partner"
      accent={`linear-gradient(135deg, hsl(${a.hue} 62% 48%), hsl(${(a.hue + 30) % 360} 58% 36%))`}
      groups={groups}
      user={{ name: a.name, sub: a.zone, hue: a.hue }}
    />
  );
}
