import { Link } from "react-router-dom";
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
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import s from "../admin/DashboardPage.module.css";

const META: Record<string, { icon: string; tone: string }> = {
  gross: { icon: "rupee", tone: "var(--chart-1)" },
  net: { icon: "wallet", tone: "var(--chart-2)" },
  orders: { icon: "package", tone: "var(--chart-3)" },
  units: { icon: "boxOpen", tone: "var(--chart-4)" },
};

export function MerchantDashboardPage() {
  const m = CURRENT_MERCHANT;
  const { data, loading } = useApi(() => reportsApi.merchantOverview(m.id), [m.id]);

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Loading your store metrics…" />
        <div className={s.kpis}>
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} h={112} radius={12} />)}
        </div>
      </div>
    );
  }

  const { kpis, trend, topProducts, statusBreakdown, counts } = data;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${m.owner_name.split(" ")[0]}`}
        subtitle={`${m.business_name} · ${m.city}, ${m.state} · GSTIN ${m.gstin}`}
        actions={
          <Link to="/merchant/products/new">
            <Button size="sm"><Icon name="plus" size={14} /> Add product</Button>
          </Link>
        }
      />

      {counts.awaitingAction > 0 && (
        <div className={s.alert}>
          <Icon name="alert" size={18} />
          <div style={{ flex: 1 }}>
            <div className={s.at}>{counts.awaitingAction} orders waiting to be packed</div>
            <div className={s.ad}>
              Your fulfilment SLA is {m.fulfilment_sla_hrs} hours — late packing hurts your on-time rate.
            </div>
          </div>
          <Link to="/merchant/orders"><Button size="sm" variant="secondary">Pack now</Button></Link>
        </div>
      )}

      <div className={s.kpis}>
        {kpis.map((k) => (
          <StatCard key={k.key} label={k.label}
                    value={k.format === "money" ? compactMoney(k.value) : num(k.value)}
                    delta={k.delta_pct} note="vs prior period"
                    icon={META[k.key]?.icon} tone={META[k.key]?.tone} spark={k.spark} />
        ))}
      </div>

      <div className={s.row}>
        <Card>
          <CardHeader title="Sales trend" subtitle="Your gross sales per day, last 30 days" />
          <CardBody>
            <AreaChart
              data={trend.map((p) => ({
                label: p.date.slice(8) + "/" + p.date.slice(5, 7),
                value: p.revenue,
                hint: `${money(p.revenue)} · ${p.units} units`,
              }))}
              format={compactMoney}
              tone="var(--chart-2)"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fulfilment status" subtitle="Your slice of each order" />
          <CardBody>
            <DonutChart data={statusBreakdown.map((x) => ({ label: x.status, value: x.count }))}
                        centerLabel="Packages" />
          </CardBody>
        </Card>
      </div>

      <div className={s.row3}>
        <Card>
          <CardHeader title="Your best sellers" subtitle="By revenue"
                      action={<Link to="/merchant/products"><Button size="sm" variant="ghost">Manage</Button></Link>} />
          <CardBody>
            <BarChart data={topProducts.map((p) => ({
              label: p.name, value: p.revenue,
              meta: `${num(p.units)} units · ${p.margin_pct}% margin`,
            }))} format={compactMoney} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Store health" subtitle="What needs your attention" />
          <CardBody>
            <div className={s.tiles}>
              {[
                { v: num(counts.products), l: "Products listed" },
                { v: num(counts.active), l: "Active listings" },
                { v: num(counts.lowStock), l: "Low on stock" },
                { v: num(counts.awaitingAction), l: "To pack" },
                { v: compactMoney(counts.commission), l: "Commission paid" },
                { v: compactMoney(counts.pendingPayout), l: "Payout pending" },
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
    </div>
  );
}
