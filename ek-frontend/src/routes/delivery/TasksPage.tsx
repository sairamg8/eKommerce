import { useState } from "react";
import type { DeliveryTask } from "../../mock/types";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as deliveryApi from "../../mock/api/delivery";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { Thumb } from "../../components/ui/Thumb";
import { CURRENT_AGENT } from "../../components/layout/DeliveryLayout";
import { ScanDrawer } from "./ScanDrawer";
import s from "./TasksPage.module.css";

export function DeliveryTasksPage() {
  const a = CURRENT_AGENT;
  const [nonce, setNonce] = useState(0);
  const [active, setActive] = useState<DeliveryTask | null>(null);

  const { data: tasks, loading } = useApi(() => deliveryApi.listTasks(a.id), [a.id, nonce]);

  const open = (tasks ?? []).filter((t) => t.status === "assigned" || t.status === "in_progress");
  const done = (tasks ?? []).filter((t) => t.status === "completed" || t.status === "failed");
  const codTotal = open.filter((t) => t.is_cod).reduce((sum, t) => sum + t.cod_amount, 0);

  return (
    <div>
      <PageHeader title="My route" subtitle="Stops assigned to you, in delivery order" />

      <Card className={s.agent}>
        <Thumb hue={a.hue} size={48} radius={999} label={a.name} />
        <div>
          <div className={s.aname}>{a.name}</div>
          <div className={s.azone}>
            {a.zone} · {a.vehicle} · {a.courier_name}
          </div>
        </div>
        <div className={s.astats}>
          <div className={s.astat}>
            <span className={`${s.av} tabular`}>{open.length}</span>
            <span className={s.al}>Stops left</span>
          </div>
          <div className={s.astat}>
            <span className={`${s.av} tabular`}>{a.deliveries_today}</span>
            <span className={s.al}>Delivered today</span>
          </div>
          <div className={s.astat}>
            <span className={`${s.av} tabular`}>{money(codTotal)}</span>
            <span className={s.al}>COD to collect</span>
          </div>
          <div className={s.astat}>
            <span className={`${s.av} tabular`}>{(a.success_rate * 100).toFixed(1)}%</span>
            <span className={s.al}>Success rate</span>
          </div>
        </div>
      </Card>

      {loading && (
        <div className={s.tasks}>
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} h={120} radius={12} />)}
        </div>
      )}

      {!loading && open.length === 0 && done.length === 0 && (
        <Card>
          <EmptyState icon={<Icon name="truck" size={20} />} title="No stops assigned"
            description="Your route is clear. New shipments appear here once dispatch assigns them." />
        </Card>
      )}

      {!loading && open.length > 0 && (
        <>
          <h2 style={{ fontSize: "var(--fs-lg)", margin: "var(--sp-5) 0 var(--sp-3)" }}>
            Pending stops ({open.length})
          </h2>
          <div className={s.tasks}>
            {open.map((t) => <TaskRow key={t.id} task={t} onScan={() => setActive(t)} />)}
          </div>
        </>
      )}

      {!loading && done.length > 0 && (
        <>
          <h2 style={{ fontSize: "var(--fs-lg)", margin: "var(--sp-6) 0 var(--sp-3)" }}>
            Completed ({done.length})
          </h2>
          <div className={s.tasks}>
            {done.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} onScan={() => setActive(t)} />)}
          </div>
        </>
      )}

      <ScanDrawer
        task={active}
        onClose={() => setActive(null)}
        onDone={() => { setActive(null); setNonce((n) => n + 1); }}
      />
    </div>
  );
}

function TaskRow({ task, onScan }: { task: DeliveryTask; onScan: () => void }) {
  const finished = task.status === "completed" || task.status === "failed";
  return (
    <Card className={s.task}>
      <span className={cn(s.seq,
        task.status === "completed" && s.seqDone,
        task.status === "failed" && s.seqFail)}>
        {task.status === "completed" ? <Icon name="check" size={15} strokeWidth={2.6} />
          : task.status === "failed" ? <Icon name="x" size={15} strokeWidth={2.6} />
          : task.sequence}
      </span>

      <div className={s.body}>
        <div className={s.top}>
          <span className={cn(s.awb, "mono")}>{task.awb}</span>
          {task.is_cod && <Badge tone="warning">COD {money(task.cod_amount)}</Badge>}
          {task.status === "in_progress" && <Badge tone="brand" dot>Out for delivery</Badge>}
          {task.status === "completed" && <Badge tone="success" dot>Delivered</Badge>}
          {task.status === "failed" && <Badge tone="danger" dot>Failed</Badge>}
        </div>
        <div className={s.name}>{task.contact_name}</div>
        <div className={s.addr}>{task.address}</div>
        <div className={s.meta}>
          <span className={s.metaItem}><Icon name="mapPin" size={12} /> {task.distance_km} km</span>
          <span className={s.metaItem}><Icon name="clock" size={12} /> {task.slot}</span>
          <span className={s.metaItem}><Icon name="phone" size={12} /> {task.contact_phone}</span>
        </div>
      </div>

      <div className={s.actions}>
        <Button size="sm" variant={finished ? "secondary" : "primary"} onClick={onScan}>
          <Icon name={finished ? "eye" : "camera"} size={14} />
          {finished ? "View" : "Update status"}
        </Button>
        {!finished && (
          <Button size="sm" variant="ghost">
            <Icon name="phone" size={13} /> Call
          </Button>
        )}
      </div>
    </Card>
  );
}
