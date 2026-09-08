import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Merchant, MerchantStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { compactMoney, date, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as adminApi from "../../mock/api/admin";
import { Badge } from "../../components/ui/Badge";
import type { Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Rating } from "../../components/ui/Rating";
import { Thumb } from "../../components/ui/Thumb";
import { useToast } from "../../store/ToastContext";
import f from "./Filters.module.css";

const TONE: Record<MerchantStatus, Tone> = {
  active: "success", pending: "warning", suspended: "danger", rejected: "neutral",
};

const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
];

export function AdminMerchantsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const t = useTableQuery({ sort: "gross_sales", dir: "desc", perPage: 10 });
  const [target, setTarget] = useState<{ m: Merchant; to: MerchantStatus } | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const { data, loading, refetch } = useApi(
    () => adminApi.listMerchants({
      page: t.page, per_page: t.perPage, q: t.q, sort: t.sort, dir: t.dir,
      ...(status ? { status: status as MerchantStatus } : {}),
    }),
    [status, t.q, t.page, t.sort, t.dir],
  );

  const act = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await adminApi.setMerchantStatus(target.m.id, target.to);
      push(`${target.m.business_name} is now ${target.to}`, "success");
      setTarget(null);
      refetch();
    } catch (e) {
      push(e instanceof Error ? e.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Merchant>[] = [
    {
      key: "business_name", header: "Merchant", sortable: true,
      render: (m) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Thumb hue={m.logo_hue} size={34} label={m.business_name} />
          <div>
            <div style={{ fontWeight: 600 }}>{m.business_name}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
              {m.owner_name} · {m.city}
            </div>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (m) => <Badge tone={TONE[m.status]} dot>{m.status}</Badge> },
    {
      key: "rating", header: "Rating",
      render: (m) => (m.rating ? <Rating value={m.rating} count={m.rating_count} size={12} /> : <span style={{ color: "var(--text-disabled)" }}>—</span>),
    },
    { key: "product_count", header: "Products", numeric: true, sortable: true, render: (m) => num(m.product_count) },
    { key: "gross_sales", header: "Gross sales", numeric: true, sortable: true, render: (m) => compactMoney(m.gross_sales) },
    { key: "commission_pct", header: "Commission", numeric: true, render: (m) => `${m.commission_pct}%` },
    {
      key: "on_time_rate", header: "On-time", numeric: true,
      render: (m) => (m.on_time_rate
        ? <span style={{ color: m.on_time_rate > 0.9 ? "var(--success-fg)" : "var(--warning-fg)", fontWeight: 600 }}>
            {(m.on_time_rate * 100).toFixed(1)}%
          </span>
        : "—"),
    },
    { key: "joined_at", header: "Joined", sortable: true, render: (m) => date(m.joined_at) },
    {
      key: "actions", header: "", width: 170,
      render: (m) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {m.status === "pending" && (
            <>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); setTarget({ m, to: "active" }); }}>
                Approve
              </Button>
              <Button size="sm" variant="secondary"
                      onClick={(e) => { e.stopPropagation(); setTarget({ m, to: "rejected" }); }}>
                Reject
              </Button>
            </>
          )}
          {m.status === "active" && (
            <Button size="sm" variant="secondary"
                    onClick={(e) => { e.stopPropagation(); setTarget({ m, to: "suspended" }); }}>
              Suspend
            </Button>
          )}
          {m.status === "suspended" && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); setTarget({ m, to: "active" }); }}>
              Reinstate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Merchants"
        subtitle="Onboard, approve and monitor every seller on the platform"
        actions={<Button size="sm"><Icon name="plus" size={14} /> Invite merchant</Button>}
      />

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((tab) => (
            <button key={tab.key} className={cn(f.tab, status === tab.key && f.tabOn)}
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      if (tab.key) p.set("status", tab.key); else p.delete("status");
                      setParams(p); t.resetPage();
                    }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={t.q} onChange={(e) => t.setQ(e.target.value)}
                 placeholder="Search merchants…" icon={<Icon name="search" size={15} />}
                 aria-label="Search merchants" />
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          loading={loading}
          meta={data?.meta}
          onPage={t.setPage}
          sort={t.sort}
          dir={t.dir}
          onSort={t.onSort}
          rowKey={(m) => m.id}
          unit="merchants"
          emptyTitle="No merchants match"
          emptyDescription="Try a different status filter or search term."
        />
      </Card>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={
          target?.to === "active" ? "Approve merchant"
          : target?.to === "rejected" ? "Reject application"
          : "Suspend merchant"
        }
        subtitle={target?.m.business_name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
            <Button variant={target?.to === "active" ? "primary" : "danger"}
                    disabled={busy} onClick={() => void act()}>
              {busy ? "Working…" : target?.to === "active" ? "Approve" : target?.to === "rejected" ? "Reject" : "Suspend"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: "var(--fs-md)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {target?.to === "active" && "This merchant will be able to list products and receive orders immediately. Their commission rate stays at "}
          {target?.to === "active" && <strong>{target.m.commission_pct}%</strong>}
          {target?.to === "active" && "."}
          {target?.to === "rejected" && "The application will be declined. The applicant keeps their account but cannot sell."}
          {target?.to === "suspended" && "Their listings are hidden immediately and no new orders can be placed. Existing orders must still be fulfilled."}
        </p>
      </Modal>
    </div>
  );
}
