import { useState } from "react";
import { Link } from "react-router-dom";
import type { ReturnStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { dateTime } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as returnsApi from "../../mock/api/returns";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { ReturnCard } from "../../components/returns/ReturnCard";
import { customers } from "../../mock/db";
import f from "../admin/Filters.module.css";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "requested", label: "Awaiting merchant" },
  { key: "approved", label: "Approved" },
  { key: "picked_up", label: "Collected" },
  { key: "refunded", label: "Refunded" },
  { key: "rejected", label: "Declined" },
];

export function ReturnsPage() {
  const me = customers[0]!;
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading } = useApi(
    () => returnsApi.listReturns({
      user_id: me.id, page, per_page: 8,
      status: (status || undefined) as ReturnStatus,
    }),
    [status, page],
  );

  return (
    <div>
      <PageHeader title="Returns & refunds"
        subtitle="Track anything you have sent back, and see where the refund is" />

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((t) => (
            <button key={t.key} className={cn(f.tab, status === t.key && f.tabOn)}
                    onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading && Array.from({ length: 3 }, (_, i) => (
        <div key={i} style={{ marginBottom: 12 }}><Skeleton h={190} radius={12} /></div>
      ))}

      {!loading && data?.data.length === 0 && (
        <Card>
          <EmptyState icon={<Icon name="refresh" size={20} />} title="No returns here"
            description="Open a delivered order and choose 'Return or reject' to start one."
            action={<Link to="/account/orders"><Button size="sm">Go to my orders</Button></Link>} />
        </Card>
      )}

      {!loading && data?.data.map((r) => (
        <ReturnCard key={r.id} request={r}
          footer={
            <>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                <Icon name="clock" size={12} /> Last update {dateTime(r.timeline[r.timeline.length - 1]!.at)}
              </span>
              <span style={{ flex: 1 }} />
              <Link to={`/account/orders/${r.order_id}`}>
                <Button size="sm" variant="secondary">View order</Button>
              </Link>
              <Link to="/account/messages">
                <Button size="sm" variant="ghost">
                  <Icon name="bell" size={13} /> Message merchant
                </Button>
              </Link>
            </>
          }
        />
      ))}
    </div>
  );
}
