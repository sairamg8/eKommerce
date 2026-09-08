import { useState } from "react";
import { DOCUMENTS } from "../auth/useMerchantSignup";
import { compactMoney, date } from "../../lib/format";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Input, Textarea } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { TabBar } from "../../components/ui/TabBar";
import { Thumb } from "../../components/ui/Thumb";
import { MediaUploader } from "../../components/media/MediaUploader";
import { useToast } from "../../store/ToastContext";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import type { MediaAsset } from "../../mock/types";
import { payoutsForMerchant } from "../../mock/db";
import s from "./SettingsPage.module.css";

const TABS = [
  { key: "store", label: "Store profile", icon: "store" },
  { key: "bank", label: "Bank & payouts", icon: "wallet" },
  { key: "documents", label: "Documents", icon: "file" },
  { key: "shipping", label: "Shipping", icon: "truck" },
  { key: "notifications", label: "Notifications", icon: "bell" },
  { key: "team", label: "Team", icon: "users" },
];

const TEAM = [
  { name: "Rhea Kapoor", email: "rhea@auroraaudiolabs.in", role: "Owner", hue: 15 },
  { name: "Dev Prakash", email: "dev@auroraaudiolabs.in", role: "Catalogue manager", hue: 140 },
  { name: "Anita Rao", email: "anita@auroraaudiolabs.in", role: "Fulfilment", hue: 260 },
];

export function MerchantSettingsPage() {
  const m = CURRENT_MERCHANT;
  const { push } = useToast();
  const [tab, setTab] = useState("store");
  const [logo, setLogo] = useState<MediaAsset[]>([]);
  const [saving, setSaving] = useState(false);

  const [store, setStore] = useState({
    display_name: m.business_name,
    tagline: "Audio gear engineered for people who actually listen.",
    about: `${m.business_name} has been building and curating audio equipment since ${new Date(m.joined_at).getFullYear() - 4}. Every product is bench-tested before it ships.`,
    email: m.email, phone: m.phone, city: m.city, state: m.state, gstin: m.gstin,
  });

  const [bank, setBank] = useState({
    holder: m.business_name, account: "••••••••4821",
    ifsc: "HDFC0001234", bankName: "HDFC Bank", branch: `${m.city} Main`,
  });

  const [shipping, setShipping] = useState({
    sla: String(m.fulfilment_sla_hrs), free_above: "999",
    pickup_address: `Warehouse 4, ${m.city}, ${m.state}`, cod: true, returns_days: "14",
  });

  const [notify, setNotify] = useState({
    new_order: true, low_stock: true, return_request: true,
    payout_settled: true, customer_message: true, weekly_digest: false,
  });

  const save = async (what: string) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    push(`${what} saved`, "success");
  };

  const pending = payoutsForMerchant(m.id).filter((p) => p.status === "pending");

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your store profile, payout details and preferences" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "store" && (
        <div className={s.grid}>
          <div className={s.stack}>
            <Card>
              <CardHeader title="Store profile" subtitle="What shoppers see on your listings" />
              <CardBody>
                <div className={s.fields}>
                  <Input label="Store display name" value={store.display_name}
                         onChange={(e) => setStore({ ...store, display_name: e.target.value })} />
                  <Input label="Tagline" value={store.tagline}
                         onChange={(e) => setStore({ ...store, tagline: e.target.value })}
                         hint="One line, shown under your store name" />
                  <Textarea label="About your store" rows={5} value={store.about}
                            onChange={(e) => setStore({ ...store, about: e.target.value })} />
                  <MediaUploader label="Store logo" value={logo} onChange={setLogo}
                                 accept={["image"]} max={1} uploadedBy={m.owner_name} compact />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Contact & legal" subtitle="Used on invoices and for compliance" />
              <CardBody>
                <div className={s.fields}>
                  <div className={s.two}>
                    <Input label="Business email" value={store.email}
                           onChange={(e) => setStore({ ...store, email: e.target.value })} />
                    <Input label="Phone" value={store.phone}
                           onChange={(e) => setStore({ ...store, phone: e.target.value })} />
                  </div>
                  <div className={s.two}>
                    <Input label="City" value={store.city}
                           onChange={(e) => setStore({ ...store, city: e.target.value })} />
                    <Input label="State" value={store.state}
                           onChange={(e) => setStore({ ...store, state: e.target.value })} />
                  </div>
                  <Input label="GSTIN" value={store.gstin} disabled
                         hint="Locked after verification — contact support to change it" />
                </div>
              </CardBody>
            </Card>

            <div>
              <Button disabled={saving} onClick={() => void save("Store profile")}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>

          <div className={s.stack}>
            <Card>
              <CardBody>
                <div className={s.brandRow}>
                  <Thumb hue={m.logo_hue} size={56} label={m.business_name} />
                  <div>
                    <div className={s.bName}>{m.business_name}</div>
                    <Badge tone="success" dot>Verified merchant</Badge>
                  </div>
                </div>
                <div className={s.meta}><span>Member since</span><span>{date(m.joined_at)}</span></div>
                <div className={s.meta}><span>Merchant ID</span><span className="mono">{m.id}</span></div>
                <div className={s.meta}><span>Commission</span><span>{m.commission_pct}%</span></div>
                <div className={s.meta}><span>On-time rate</span><span>{(m.on_time_rate * 100).toFixed(1)}%</span></div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Rate card" subtitle="Set by the platform" />
              <CardBody>
                <div className={s.meta}><span>Commission</span><span>{m.commission_pct}% of item subtotal</span></div>
                <div className={s.meta}><span>Settlement</span><span>Weekly, every Friday</span></div>
                <div className={s.meta}><span>Payment gateway fee</span><span>Absorbed by platform</span></div>
                <div className={s.meta}><span>Return shipping</span><span>Platform pays</span></div>
                <p className={s.note}>
                  Commission is negotiated with your account manager. Raise a support
                  thread to request a review once you cross a volume tier.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {tab === "bank" && (
        <div className={s.grid}>
          <Card>
            <CardHeader title="Settlement account" subtitle="Where weekly payouts are deposited" />
            <CardBody>
              <div className={s.fields}>
                <Input label="Account holder name" value={bank.holder}
                       onChange={(e) => setBank({ ...bank, holder: e.target.value })}
                       hint="Must match your registered legal name" />
                <div className={s.two}>
                  <Input label="Account number" value={bank.account} disabled
                         hint="Masked for security — re-verify to change" />
                  <Input label="IFSC" value={bank.ifsc}
                         onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} />
                </div>
                <div className={s.two}>
                  <Input label="Bank" value={bank.bankName}
                         onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
                  <Input label="Branch" value={bank.branch}
                         onChange={(e) => setBank({ ...bank, branch: e.target.value })} />
                </div>
                <div className={s.warn}>
                  <Icon name="alert" size={16} />
                  <span>
                    Changing the account pauses payouts until a new cancelled cheque is
                    verified. Any pending settlement stays on hold meanwhile.
                  </span>
                </div>
                <div>
                  <Button disabled={saving} onClick={() => void save("Bank details")}>
                    {saving ? "Saving…" : "Update account"}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payout status" />
            <CardBody>
              <div className={s.meta}>
                <span>Pending settlement</span>
                <span>{compactMoney(pending.reduce((t, p) => t + p.net, 0))}</span>
              </div>
              <div className={s.meta}><span>Cycles pending</span><span>{pending.length}</span></div>
              <div className={s.meta}><span>Next settlement</span><span>Friday</span></div>
              <p className={s.note}>
                Payouts release once the return window closes on every order in the cycle.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "documents" && (
        <Card>
          <CardHeader title="Verification documents"
                      subtitle="Submitted during onboarding — re-upload if any expire" />
          <CardBody>
            <div className={s.docs}>
              {DOCUMENTS.map((doc, i) => (
                <div key={doc.key} className={s.doc}>
                  <span className={s.docIco}><Icon name="check" size={15} /></span>
                  <div style={{ flex: 1 }}>
                    <div className={s.docT}>{doc.label}</div>
                    <div className={s.docD}>
                      Verified {date(m.approved_at ?? m.joined_at)} ·
                      {" "}{doc.required ? "Required" : "Optional"}
                    </div>
                  </div>
                  <Badge tone={i < 4 ? "success" : "neutral"} dot>
                    {i < 4 ? "verified" : "not provided"}
                  </Badge>
                  <Button size="sm" variant="secondary">
                    <Icon name="upload" size={13} /> Replace
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "shipping" && (
        <Card>
          <CardHeader title="Fulfilment settings" subtitle="How fast you promise to dispatch" />
          <CardBody>
            <div className={s.fields} style={{ maxWidth: 560 }}>
              <Select label="Fulfilment SLA" value={shipping.sla}
                      onChange={(e) => setShipping({ ...shipping, sla: e.target.value })}
                      hint="Breaching this lowers your search ranking"
                      options={[
                        { value: "24", label: "Dispatch within 24 hours" },
                        { value: "48", label: "Dispatch within 48 hours" },
                        { value: "72", label: "Dispatch within 72 hours" },
                      ]} />
              <Input label="Pickup address" value={shipping.pickup_address}
                     onChange={(e) => setShipping({ ...shipping, pickup_address: e.target.value })}
                     hint="Where couriers collect your parcels" />
              <div className={s.two}>
                <Input label="Free shipping above (₹)" value={shipping.free_above}
                       onChange={(e) => setShipping({ ...shipping, free_above: e.target.value })} />
                <Select label="Return window" value={shipping.returns_days}
                        onChange={(e) => setShipping({ ...shipping, returns_days: e.target.value })}
                        options={[
                          { value: "7", label: "7 days" },
                          { value: "14", label: "14 days (platform default)" },
                          { value: "30", label: "30 days" },
                        ]} />
              </div>
              <label className={s.check}>
                <input type="checkbox" checked={shipping.cod}
                       onChange={(e) => setShipping({ ...shipping, cod: e.target.checked })} />
                <span>
                  <strong>Accept cash on delivery</strong>
                  <span className={s.checkD}>Lifts conversion, but raises the return rate</span>
                </span>
              </label>
              <div>
                <Button disabled={saving} onClick={() => void save("Shipping settings")}>
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "notifications" && (
        <Card>
          <CardHeader title="Notifications" subtitle="Email and in-app alerts for your team" />
          <CardBody>
            <div className={s.fields} style={{ maxWidth: 620 }}>
              {[
                { k: "new_order", t: "New order received", d: "Sent the moment a customer pays" },
                { k: "low_stock", t: "Low stock alert", d: "When a product falls to its threshold" },
                { k: "return_request", t: "Return requested", d: "You have 48 hours to respond" },
                { k: "payout_settled", t: "Payout settled", d: "With the UTR reference" },
                { k: "customer_message", t: "Customer message", d: "New chat from a shopper" },
                { k: "weekly_digest", t: "Weekly performance digest", d: "Sales, returns and ranking summary" },
              ].map((row) => (
                <label key={row.k} className={s.check}>
                  <input type="checkbox"
                         checked={notify[row.k as keyof typeof notify]}
                         onChange={(e) => setNotify({ ...notify, [row.k]: e.target.checked })} />
                  <span>
                    <strong>{row.t}</strong>
                    <span className={s.checkD}>{row.d}</span>
                  </span>
                </label>
              ))}
              <div>
                <Button disabled={saving} onClick={() => void save("Notification preferences")}>
                  {saving ? "Saving…" : "Save preferences"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "team" && (
        <Card>
          <CardHeader title="Team members" subtitle="People who can access this store"
                      action={<Button size="sm"><Icon name="plus" size={14} /> Invite member</Button>} />
          <CardBody>
            <div className={s.docs}>
              {TEAM.map((t) => (
                <div key={t.email} className={s.doc}>
                  <Thumb hue={t.hue} size={36} radius={999} label={t.name} />
                  <div style={{ flex: 1 }}>
                    <div className={s.docT}>{t.name}</div>
                    <div className={s.docD}>{t.email}</div>
                  </div>
                  <Badge tone={t.role === "Owner" ? "brand" : "neutral"}>{t.role}</Badge>
                  {t.role !== "Owner" && (
                    <Button size="sm" variant="ghost" style={{ color: "var(--danger-fg)" }}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
