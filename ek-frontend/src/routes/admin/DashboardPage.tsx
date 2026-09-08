import { Link, useNavigate } from "react-router-dom";
import { compactMoney, money, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as reportsApi from "../../mock/api/reports";
import { AreaChart } from "../../components/charts/AreaChart";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import s from "./DashboardPage.module.css";

const KPI_META: Record<string, { icon: string; tone: string }> = {
  gmv: { icon: "rupee", tone: "var(--chart-1)" },
  commission: { icon: "wallet", tone: "var(--chart-2)" },
  orders: { icon: "package", tone: "var(--chart-3)" },
  aov: { icon: "chart", tone: "var(--chart-4)" },
};

export function AdminDashboardPage() {
  const { data, loading } = useApi(() => reportsApi.adminOverview(), []);
  const navigate = useNavigate();

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Overview" subtitle="Loading marketplace metrics…" />
        <div className={s.kpis}>
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} h={112} radius={12} />)}
        </div>
        <Skeleton h={300} radius={12} />
      </div>
    );
  }

  const { kpis, trend, topProducts, statusBreakdown, categoryRevenue, counts } = data;

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Marketplace performance across every merchant, last 30 days"
        actions={
          <>
            <Button variant="secondary" size="sm"><Icon name="download" size={14} /> Export CSV</Button>
            <Button size="sm" onClick={() => navigate("/admin/merchants?status=pending")}>
              <Icon name="store" size={14} /> Review merchants
            </Button>
          </>
        }
      />

      {counts.pendingMerchants > 0 && (
        <div className={s.alert}>
          <Icon name="alert" size={18} />
          <div style={{ flex: 1 }}>
            <div className={s.at}>{counts.pendingMerchants} merchants awaiting approval</div>
            <div className={s.ad}>New sellers cannot list products until you approve them.</div>
          </div>
          <Link to="/admin/merchants?status=pending">
            <Button size="sm" variant="secondary">Review now</Button>
          </Link>
        </div>
      )}

      <div className={s.kpis}>
        {kpis.map((k) => (
          <StatCard
            key={k.key}
            label={k.label}
            value={k.format === "money" ? compactMoney(k.value) : num(k.value)}
            delta={k.delta_pct}
            note="vs prior period"
            icon={KPI_META[k.key]?.icon}
            tone={KPI_META[k.key]?.tone}
            spark={k.spark}
          />
        ))}
      </div>

      <div className={s.row}>
        <Card>
          <CardHeader title="Revenue trend" subtitle="Gross merchandise value per day" />
          <CardBody>
            <AreaChart
              data={trend.map((p) => ({
                label: p.date.slice(8) + "/" + p.date.slice(5, 7),
                value: p.revenue,
                hint: `${money(p.revenue)} · ${p.orders} orders`,
              }))}
              format={(n) => compactMoney(n)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Order status" subtitle="Where the order book sits right now" />
          <CardBody>
            <DonutChart
              data={statusBreakdown.map((x) => ({ label: x.status, value: x.count }))}
              centerLabel="Orders"
            />
          </CardBody>
        </Card>
      </div>

      <div className={s.row3}>
        <Card>
          <CardHeader title="Top products" subtitle="By revenue, all merchants"
                      action={<Link to="/admin/products"><Button size="sm" variant="ghost">View all</Button></Link>} />
          <CardBody>
            <BarChart
              data={topProducts.map((p) => ({
                label: p.name,
                value: p.revenue,
                meta: `${num(p.units)} units · ${p.margin_pct}% margin`,
              }))}
              format={compactMoney}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue by category" subtitle="Which departments carry the platform" />
          <CardBody>
            <BarChart
              data={categoryRevenue.slice(0, 6).map((c) => ({
                label: c.category, value: c.revenue, meta: `${num(c.units)} units`,
              }))}
              format={compactMoney}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Platform at a glance" subtitle="Counts across the whole marketplace" />
        <CardBody>
          <div className={s.tiles}>
            {[
              { v: num(counts.activeMerchants), l: "Active merchants" },
              { v: num(counts.pendingMerchants), l: "Pending approval" },
              { v: num(counts.customers), l: "Customers" },
              { v: num(counts.products), l: "Products listed" },
              { v: num(counts.inTransit), l: "Shipments in transit" },
              { v: compactMoney(counts.payoutValue), l: `Payouts due (${counts.pendingPayouts})` },
            ].map((t) => (
              <div key={t.l} className={s.tile}>
                <span className={`${s.tv} tabular`}>{t.v}</span>
                <span className={s.tl}>{t.l}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
