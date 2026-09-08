import { useState } from "react";
import type { User } from "../../mock/types";
import { cn } from "../../lib/cn";
import { date, initials, money, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { useTableQuery } from "../../lib/useTableQuery";
import * as adminApi from "../../mock/api/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Thumb } from "../../components/ui/Thumb";
import { useToast } from "../../store/ToastContext";
import f from "./Filters.module.css";

const TABS = [
  { key: "", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "merchant", label: "Merchants" },
  { key: "admin", label: "Admins" },
];

export function AdminUsersPage() {
  const [role, setRole] = useState("");
  const t = useTableQuery({ sort: "lifetime_value", dir: "desc", perPage: 12 });
  const { push } = useToast();

  const { data, loading, refetch } = useApi(
    () => adminApi.listUsers({
      page: t.page, per_page: t.perPage, q: t.q, sort: t.sort, dir: t.dir,
      role: role || undefined,
    }),
    [role, t.q, t.page, t.sort, t.dir],
  );

  const toggle = async (u: User) => {
    try {
      const next = await adminApi.toggleUserActive(u.id);
      push(`${next.first_name} ${next.last_name} ${next.is_active ? "reactivated" : "deactivated"}`,
           next.is_active ? "success" : "info");
      refetch();
    } catch (e) {
      push(e instanceof Error ? e.message : "Action failed", "error");
    }
  };

  const columns: Column<User>[] = [
    { key: "name", header: "User",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Thumb hue={u.avatar_hue} size={32} radius={999} label={initials(u.first_name, u.last_name)} />
          <div>
            <div style={{ fontWeight: 550 }}>{u.first_name} {u.last_name}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{u.email}</div>
          </div>
        </div>
      ) },
    { key: "role", header: "Role",
      render: (u) => (
        <Badge tone={u.role === "admin" ? "brand" : u.role === "merchant" ? "info" : "neutral"}>
          {u.role}
        </Badge>
      ) },
    { key: "is_active", header: "Status",
      render: (u) => <Badge tone={u.is_active ? "success" : "danger"} dot>{u.is_active ? "active" : "disabled"}</Badge> },
    { key: "orders_count", header: "Orders", numeric: true, sortable: true, render: (u) => num(u.orders_count) },
    { key: "lifetime_value", header: "Lifetime value", numeric: true, sortable: true,
      render: (u) => <span style={{ fontWeight: 600 }}>{u.lifetime_value ? money(u.lifetime_value) : "—"}</span> },
    { key: "created_at", header: "Joined", sortable: true, render: (u) => date(u.created_at) },
    { key: "actions", header: "", width: 120,
      render: (u) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="sm" variant={u.is_active ? "secondary" : "primary"}
                  disabled={u.role === "admin"}
                  onClick={(e) => { e.stopPropagation(); void toggle(u); }}>
            {u.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="Customers, merchant owners and platform staff" />
      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((tab) => (
            <button key={tab.key} className={cn(f.tab, role === tab.key && f.tabOn)}
                    onClick={() => { setRole(tab.key); t.resetPage(); }}>{tab.label}</button>
          ))}
        </div>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={t.q} onChange={(e) => t.setQ(e.target.value)}
                 placeholder="Name or email…" icon={<Icon name="search" size={15} />}
                 aria-label="Search users" />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} rows={data?.data ?? []} loading={loading}
                   meta={data?.meta} onPage={t.setPage} rowKey={(u) => u.id} unit="users"
                   sort={t.sort} dir={t.dir} onSort={t.onSort}
                   emptyTitle="No users match" />
      </Card>
    </div>
  );
}
