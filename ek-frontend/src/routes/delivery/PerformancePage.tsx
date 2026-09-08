import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { Rating } from "../../components/ui/Rating";
import { CURRENT_AGENT } from "../../components/layout/DeliveryLayout";
import { agents, shipments } from "../../mock/db";
import { num } from "../../lib/format";

export function DeliveryPerformancePage() {
  const a = CURRENT_AGENT;
  const mine = shipments.filter((s) => s.agent_id === a.id);
  const delivered = mine.filter((s) => s.status === "delivered").length;
  const failed = mine.filter((s) => s.status === "failed_attempt").length;
  const pending = mine.length - delivered - failed;

  const leaderboard = agents
    .slice()
    .sort((x, y) => y.deliveries_total - x.deliveries_total)
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Performance" subtitle={`${a.name} · ${a.zone}`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
        <StatCard label="Deliveries today" value={String(a.deliveries_today)} icon="check" tone="var(--chart-2)" />
        <StatCard label="Lifetime deliveries" value={num(a.deliveries_total)} icon="package" tone="var(--chart-1)" />
        <StatCard label="Success rate" value={`${(a.success_rate * 100).toFixed(1)}%`}
                  note="delivered vs attempted" icon="chart" tone="var(--chart-3)" />
        <StatCard label="Active stops" value={String(a.active_tasks)} icon="mapPin" tone="var(--chart-4)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
        <Card>
          <CardHeader title="Your shipment outcomes" subtitle="Across everything assigned to you" />
          <CardBody>
            <DonutChart
              data={[
                { label: "delivered", value: delivered },
                { label: "in progress", value: Math.max(pending, 0) },
                { label: "failed", value: failed },
              ]}
              centerLabel="Shipments"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Courier leaderboard" subtitle="Lifetime deliveries across all agents" />
          <CardBody>
            <BarChart
              data={leaderboard.map((x) => ({
                label: x.id === a.id ? `${x.name} (you)` : x.name,
                value: x.deliveries_total,
                meta: `${x.city} · ${(x.success_rate * 100).toFixed(0)}% success`,
                tone: x.id === a.id ? "var(--accent)" : undefined,
              }))}
              format={num}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Your rating" subtitle="Averaged from customer feedback after delivery" />
        <CardBody>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: "var(--fs-4xl)", fontWeight: 700, letterSpacing: "-0.03em" }}>
              {a.rating.toFixed(2)}
            </span>
            <div>
              <Rating value={a.rating} size={18} showValue={false} />
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: 4 }}>
                Based on {num(a.deliveries_total)} completed deliveries
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
