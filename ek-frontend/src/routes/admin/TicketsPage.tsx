import { useEffect, useState } from "react";
import type { TicketStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { dateTime, relative } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as supportApi from "../../mock/api/support";
import { Badge } from "../../components/ui/Badge";
import type { Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Input, Textarea } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../store/ToastContext";
import { tickets as allTickets } from "../../mock/db";
import f from "./Filters.module.css";
import s from "./TicketsPage.module.css";

const STATUS_TONE: Record<TicketStatus, Tone> = {
  open: "danger", pending: "warning", resolved: "success", closed: "neutral",
};
const PRIORITY_TONE: Record<string, Tone> = {
  urgent: "danger", high: "warning", normal: "info", low: "neutral",
};
const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

export function AdminTicketsPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);
  const { push } = useToast();

  const { data, loading } = useApi(
    () => supportApi.listTickets({ per_page: 50, q, status: (status || undefined) as TicketStatus }),
    [status, q, nonce],
  );

  useEffect(() => {
    if (data?.data.length && !data.data.some((t) => t.id === activeId)) {
      setActiveId(data.data[0]!.id);
    }
  }, [data, activeId]);

  const active = data?.data.find((t) => t.id === activeId) ?? null;

  const send = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await supportApi.replyToTicket({
        ticketId: active.id, body: reply,
        fromName: "Platform Support", fromEmail: "support@ekommerce.in", isStaff: true,
      });
      push("Reply sent by email", "success");
      setReply("");
      setNonce((n) => n + 1);
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not reply", "error");
    } finally {
      setBusy(false);
    }
  };

  const move = async (next: TicketStatus) => {
    if (!active) return;
    await supportApi.setTicketStatus(active.id, next);
    push(`Ticket marked ${next}`, next === "resolved" ? "success" : "info");
    setNonce((n) => n + 1);
  };

  const open = allTickets.filter((t) => t.status === "open").length;
  const urgent = allTickets.filter((t) => t.priority === "urgent" && t.status !== "closed").length;
  const unassigned = allTickets.filter((t) => !t.assigned_to).length;
  const breached = allTickets.filter((t) => !t.first_response_at && t.status === "open").length;

  return (
    <div>
      <PageHeader title="Support inbox"
        subtitle="Email tickets from customers and merchants — replies go out as email" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
        <StatCard label="Open tickets" value={String(open)} icon="file" tone="var(--chart-3)" />
        <StatCard label="Urgent" value={String(urgent)} icon="alert" tone="var(--chart-6)" />
        <StatCard label="Unassigned" value={String(unassigned)} icon="users" tone="var(--chart-4)" />
        <StatCard label="Awaiting first reply" value={String(breached)} note="SLA at risk"
                  icon="clock" tone="var(--chart-1)" />
      </div>

      <div className={f.bar}>
        <div className={f.tabs}>
          {TABS.map((t) => (
            <button key={t.key} className={cn(f.tab, status === t.key && f.tabOn)}
                    onClick={() => setStatus(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className={f.spacer} />
        <div className={f.search}>
          <Input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Subject, ticket no, email…" icon={<Icon name="search" size={15} />}
                 aria-label="Search tickets" />
        </div>
      </div>

      <div className={s.grid}>
        <Card>
          <div className={s.list}>
            {loading && Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ padding: 14 }}><Skeleton h={40} /></div>
            ))}
            {!loading && data?.data.length === 0 && (
              <EmptyState icon={<Icon name="file" size={18} />} title="No tickets match" />
            )}
            {!loading && data?.data.map((t) => (
              <button key={t.id} className={cn(s.row, activeId === t.id && s.rowOn)}
                      onClick={() => setActiveId(t.id)}>
                <div className={s.top}>
                  <span className={s.no}>{t.ticket_number}</span>
                  <Badge tone={PRIORITY_TONE[t.priority] ?? "neutral"}>{t.priority}</Badge>
                  <Badge tone={STATUS_TONE[t.status]} dot>{t.status}</Badge>
                </div>
                <div className={s.subj}>{t.subject}</div>
                <div className={s.meta}>
                  <span>{t.requester_name}</span>
                  <span>· {t.requester_role}</span>
                  <span>· {relative(t.updated_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {active ? (
          <Card>
            <CardHeader
              title={active.subject}
              subtitle={`${active.ticket_number} · ${active.requester_name} <${active.requester_email}>`}
              action={<Badge tone={STATUS_TONE[active.status]} dot>{active.status}</Badge>}
            />
            <CardBody>
              <div className={s.facts}>
                <div className={s.f}><span className={s.fk}>Category</span><span className={s.fv}>{active.category}</span></div>
                <div className={s.f}><span className={s.fk}>Priority</span><span className={s.fv}>{active.priority}</span></div>
                <div className={s.f}><span className={s.fk}>Assigned</span><span className={s.fv}>{active.assigned_to ?? "Unassigned"}</span></div>
                <div className={s.f}>
                  <span className={s.fk}>First reply</span>
                  <span className={s.fv} style={{ color: active.first_response_at ? "var(--success-fg)" : "var(--danger-fg)" }}>
                    {active.first_response_at ? relative(active.first_response_at) : "Pending"}
                  </span>
                </div>
                {active.order_number && (
                  <div className={s.f}><span className={s.fk}>Order</span><span className={cn(s.fv, "mono")}>{active.order_number}</span></div>
                )}
              </div>

              <div className={s.thread}>
                {active.messages.map((m) => (
                  <div key={m.id} className={cn(s.msg, m.is_staff && s.staff)}>
                    <div className={s.mHead}>
                      <span className={s.mName}>{m.from_name}</span>
                      {m.is_staff && <Badge tone="brand">Support</Badge>}
                      <span className={s.mMail}>{m.from_email}</span>
                      <span className={s.mTime}>{dateTime(m.sent_at)}</span>
                    </div>
                    <p className={s.mBody}>{m.body}</p>
                  </div>
                ))}
              </div>

              <div className={s.reply}>
                <Textarea label="Reply by email" rows={5} value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Write your reply — it is sent to the requester's email and threaded here." />
                <div className={s.actions}>
                  <Button disabled={busy || reply.trim().length < 2} onClick={() => void send()}>
                    {busy ? "Sending…" : "Send reply"}
                  </Button>
                  {active.status !== "resolved" && (
                    <Button variant="secondary" onClick={() => void move("resolved")}>
                      <Icon name="check" size={14} /> Mark resolved
                    </Button>
                  )}
                  {active.status !== "closed" && (
                    <Button variant="ghost" onClick={() => void move("closed")}>Close ticket</Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <EmptyState icon={<Icon name="file" size={20} />} title="Select a ticket"
                        description="Pick a ticket on the left to read the thread and reply." />
          </Card>
        )}
      </div>
    </div>
  );
}
