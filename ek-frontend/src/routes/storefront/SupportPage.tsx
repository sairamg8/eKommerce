import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { MediaAsset, SupportTicket } from "../../mock/types";
import * as supportApi from "../../mock/api/support";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Input, Textarea } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { MediaUploader } from "../../components/media/MediaUploader";
import { useToast } from "../../store/ToastContext";
import { customers } from "../../mock/db";
import s from "./SupportPage.module.css";

const CATEGORIES = [
  { value: "order", label: "An order I placed" },
  { value: "delivery", label: "Delivery or tracking" },
  { value: "return", label: "Return or refund" },
  { value: "payment", label: "Payment or billing" },
  { value: "account", label: "My account" },
  { value: "other", label: "Something else" },
];

const FAQ = [
  { q: "How long do refunds take?", a: "Once the merchant confirms they have received the return, the refund is initiated the same day. Banks then take 5–7 working days to post it. You will get the ARN by email so you can trace it." },
  { q: "Can I change my delivery address after ordering?", a: "Yes, until the merchant marks the order packed. Open the order and choose Change address. After it is packed the courier controls the parcel and it can only be redirected by the delivery agent." },
  { q: "Why did my order split into several packages?", a: "This is a marketplace, so each merchant ships their own items. One order can become several packages, each with its own AWB and tracking." },
  { q: "What if I am not home for the delivery?", a: "The agent makes up to three attempts. You can also reject the parcel at the door and it returns to the merchant automatically, with a refund once received." },
];

export function SupportPage() {
  const me = customers[0]!;
  const navigate = useNavigate();
  const { push } = useToast();
  const [params] = useSearchParams();

  // Deep-linked from an order: /support?order=EK-26041&category=delivery
  const linkedOrder = params.get("order") ?? "";
  const linkedCategory = params.get("category") ?? "order";

  const [form, setForm] = useState({
    name: `${me.first_name} ${me.last_name}`,
    email: me.email,
    category: linkedCategory,
    subject: linkedOrder ? `Help with order ${linkedOrder}` : "",
    orderNumber: linkedOrder,
    body: "",
  });
  const [files, setFiles] = useState<MediaAsset[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<SupportTicket | null>(null);
  const [openQ, setOpenQ] = useState<number | null>(0);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const ticket = await supportApi.createTicket({
        subject: form.subject,
        category: form.category as SupportTicket["category"],
        body: form.body,
        name: form.name,
        email: form.email,
        role: "customer",
        orderNumber: form.orderNumber || null,
        attachments: files,
      });
      setSent(ticket);
      push(`Ticket ${ticket.ticket_number} created`, "success");
    } catch (err) {
      const withErrors = err as { errors?: Record<string, string[]>; message?: string };
      setErrors(withErrors.errors ?? {});
      push(withErrors.message ?? "Could not submit", "error");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={s.wrap}>
        <Card>
          <div className={s.sent}>
            <span className={s.sIco}><Icon name="check" size={26} strokeWidth={2.6} /></span>
            <h1 style={{ fontSize: "var(--fs-2xl)" }}>Request received</h1>
            <p className={s.sub}>
              We have emailed a confirmation to <strong>{sent.requester_email}</strong>.
              Replies to that email land straight on this ticket.
            </p>
            <div className={s.ticketNo}>{sent.ticket_number}</div>
            <p className={s.cD}>
              Target first response: {sent.sla_minutes >= 1440
                ? `${sent.sla_minutes / 1440} business day(s)` : `${sent.sla_minutes / 60} hours`}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => { setSent(null); setForm((f) => ({ ...f, subject: "", body: "" })); setFiles([]); }}>
                Raise another
              </Button>
              <Button onClick={() => navigate("/account/messages")}>
                <Icon name="bell" size={15} /> Chat with an agent instead
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.hero}>
        <h1 className={s.h1}>How can we help?</h1>
        <p className={s.sub}>
          Search the answers below, email us, or start a live chat with an agent.
        </p>
      </div>

      <div className={s.channels}>
        <Card className={s.channel}>
          <span className={s.cIco} style={{ background: "var(--accent-subtle)", color: "var(--text-brand)" }}>
            <Icon name="bell" size={18} />
          </span>
          <span className={s.cT}>Live chat</span>
          <span className={s.cD}>Talk to a support agent now. Share photos and files in the chat.</span>
          <span className={s.cMeta}>Agents online · replies in minutes</span>
          <Button size="sm" variant="secondary" style={{ marginTop: 8 }}
                  onClick={() => navigate("/account/messages")}>
            Start chat
          </Button>
        </Card>

        <Card className={s.channel}>
          <span className={s.cIco} style={{ background: "var(--info-bg)", color: "var(--info-fg)" }}>
            <Icon name="file" size={18} />
          </span>
          <span className={s.cT}>Email support</span>
          <span className={s.cD}>Raise a ticket with attachments. You get a reference number and email updates.</span>
          <span className={s.cMeta}>support@ekommerce.in · within 1 business day</span>
        </Card>

        <Card className={s.channel}>
          <span className={s.cIco} style={{ background: "var(--success-bg)", color: "var(--success-fg)" }}>
            <Icon name="store" size={18} />
          </span>
          <span className={s.cD} style={{ order: 3 }}>
            Questions about a specific item are answered fastest by the seller.
          </span>
          <span className={s.cT} style={{ order: 2 }}>Message the merchant</span>
          <Button size="sm" variant="secondary" style={{ marginTop: 8, order: 4 }}
                  onClick={() => navigate("/account/messages")}>
            Open messages
          </Button>
        </Card>
      </div>

      <div className={s.grid}>
        <Card>
          <CardHeader title="Email us" subtitle="We reply to the address you give here" />
          <CardBody>
            <form className={s.form} onSubmit={submit}>
              <div className={s.two}>
                <Input label="Your name" required value={form.name} onChange={set("name")} />
                <Input label="Email" required type="email" value={form.email}
                       onChange={set("email")} error={errors.email?.[0]} />
              </div>
              <div className={s.two}>
                <Select label="What is this about?" value={form.category}
                        onChange={set("category")} options={CATEGORIES} />
                <Input label="Order number" value={form.orderNumber} onChange={set("orderNumber")}
                       placeholder="EK-26041" hint="Optional, but it speeds things up" />
              </div>
              <Input label="Subject" required value={form.subject} onChange={set("subject")}
                     error={errors.subject?.[0]} placeholder="Briefly, what went wrong?" />
              <Textarea label="Describe the issue" required rows={6} value={form.body}
                        onChange={set("body")} error={errors.body?.[0]}
                        placeholder="Include anything relevant — what you expected, what happened, and when."
                        hint={`${form.body.length} characters — minimum 20`} />
              <MediaUploader label="Attach screenshots or documents" value={files}
                             onChange={setFiles} accept={["image", "document", "video"]}
                             max={5} uploadedBy={form.name} compact />
              <div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Submit request"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Common questions" />
          <CardBody>
            <div className={s.faq}>
              {FAQ.map((item, i) => (
                <div key={item.q} className={s.q}>
                  <button className={s.qT} onClick={() => setOpenQ(openQ === i ? null : i)}
                          aria-expanded={openQ === i}>
                    {item.q}
                    <Icon name={openQ === i ? "chevronDown" : "chevronRight"} size={14} />
                  </button>
                  {openQ === i && <p className={s.qA}>{item.a}</p>}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
