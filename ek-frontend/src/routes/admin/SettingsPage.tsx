import { useState } from "react";
import { date } from "../../lib/format";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Input, Textarea } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { TabBar } from "../../components/ui/TabBar";
import { Thumb } from "../../components/ui/Thumb";
import { useToast } from "../../store/ToastContext";
import { adminUser, categories, couriers } from "../../mock/db";
import s from "../merchant/SettingsPage.module.css";

const TABS = [
  { key: "profile", label: "My profile", icon: "user" },
  { key: "platform", label: "Platform", icon: "settings" },
  { key: "commission", label: "Commission & payouts", icon: "wallet" },
  { key: "policies", label: "Policies", icon: "shield" },
  { key: "catalogue", label: "Categories", icon: "grid" },
  { key: "couriers", label: "Couriers", icon: "truck" },
  { key: "staff", label: "Staff & roles", icon: "users" },
];

const STAFF = [
  { name: "Sairam Gudiputi", email: "admin@ekommerce.in", role: "Super admin", hue: 250, mfa: true },
  { name: "Nisha Raman", email: "nisha@ekommerce.in", role: "Support lead", hue: 190, mfa: true },
  { name: "Vikas Menon", email: "vikas@ekommerce.in", role: "Support agent", hue: 275, mfa: false },
  { name: "Priya Kulkarni", email: "priya@ekommerce.in", role: "Finance", hue: 45, mfa: true },
];

export function AdminSettingsPage() {
  const { push } = useToast();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    first_name: adminUser.first_name, last_name: adminUser.last_name,
    email: adminUser.email, phone: "+91 98450 00000",
  });

  const [platform, setPlatform] = useState({
    name: "eKommerce", support_email: "support@ekommerce.in",
    currency: "INR", tax_rate: "18", timezone: "Asia/Kolkata",
    maintenance: false, guest_checkout: true, auto_approve_merchants: false,
  });

  const [money, setMoney] = useState({
    default_commission: "15", payout_day: "friday",
    hold_days: "14", min_payout: "1000", free_ship_above: "999",
  });

  const [policy, setPolicy] = useState({
    return_days: "14", cancel_window_hrs: "24",
    review_requires_purchase: true, merchant_sla_hrs: "48",
    support_sla_hrs: "24",
    terms: "Sellers must dispatch within their agreed SLA. Three consecutive breaches trigger an account review.",
  });

  const save = async (what: string) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    push(`${what} saved`, "success");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile and platform-wide configuration" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "profile" && (
        <div className={s.grid}>
          <div className={s.stack}>
            <Card>
              <CardHeader title="My profile" subtitle="Your admin account details" />
              <CardBody>
                <div className={s.fields}>
                  <div className={s.two}>
                    <Input label="First name" value={profile.first_name}
                           onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                    <Input label="Last name" value={profile.last_name}
                           onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                  </div>
                  <Input label="Email" type="email" value={profile.email}
                         onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  <Input label="Phone" value={profile.phone}
                         onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  <div>
                    <Button disabled={saving} onClick={() => void save("Profile")}>
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Security" subtitle="Admin accounts require MFA" />
              <CardBody>
                <div className={s.docs}>
                  <div className={s.doc}>
                    <span className={s.docIco}><Icon name="shield" size={15} /></span>
                    <div style={{ flex: 1 }}>
                      <div className={s.docT}>Two-factor authentication</div>
                      <div className={s.docD}>Authenticator app · enabled</div>
                    </div>
                    <Badge tone="success" dot>active</Badge>
                    <Button size="sm" variant="secondary">Reconfigure</Button>
                  </div>
                  <div className={s.doc}>
                    <span className={s.docIco} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}>
                      <Icon name="clock" size={15} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className={s.docT}>Active sessions</div>
                      <div className={s.docD}>2 devices · last sign-in {date(adminUser.last_login_at ?? adminUser.created_at)}</div>
                    </div>
                    <Button size="sm" variant="ghost" style={{ color: "var(--danger-fg)" }}>
                      Revoke all
                    </Button>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button variant="secondary" size="sm">
                    <Icon name="shield" size={14} /> Change password
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <div className={s.brandRow}>
                <Thumb hue={adminUser.avatar_hue} size={56} radius={999}
                       label={`${adminUser.first_name} ${adminUser.last_name}`} />
                <div>
                  <div className={s.bName}>{adminUser.first_name} {adminUser.last_name}</div>
                  <Badge tone="brand">Super admin</Badge>
                </div>
              </div>
              <div className={s.meta}><span>Account ID</span><span className="mono">{adminUser.id}</span></div>
              <div className={s.meta}><span>Member since</span><span>{date(adminUser.created_at)}</span></div>
              <div className={s.meta}><span>Permissions</span><span>Full access</span></div>
              <p className={s.note}>
                Super admins can change commission rates, settle payouts and suspend
                merchants. Every action is written to the audit log.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "platform" && (
        <Card>
          <CardHeader title="Platform settings" subtitle="Global configuration for the marketplace" />
          <CardBody>
            <div className={s.fields} style={{ maxWidth: 620 }}>
              <div className={s.two}>
                <Input label="Platform name" value={platform.name}
                       onChange={(e) => setPlatform({ ...platform, name: e.target.value })} />
                <Input label="Support email" value={platform.support_email}
                       onChange={(e) => setPlatform({ ...platform, support_email: e.target.value })} />
              </div>
              <div className={s.two}>
                <Select label="Currency" value={platform.currency}
                        onChange={(e) => setPlatform({ ...platform, currency: e.target.value })}
                        hint="Single currency in v1"
                        options={[{ value: "INR", label: "₹ Indian Rupee" }]} />
                <Input label="GST rate (%)" value={platform.tax_rate}
                       onChange={(e) => setPlatform({ ...platform, tax_rate: e.target.value })}
                       hint="Applied to the discounted subtotal" />
              </div>
              <Input label="Timezone" value={platform.timezone}
                     onChange={(e) => setPlatform({ ...platform, timezone: e.target.value })} />

              {[
                { k: "guest_checkout", t: "Allow guest checkout", d: "Shoppers can order without creating an account" },
                { k: "auto_approve_merchants", t: "Auto-approve merchants", d: "Skip manual KYC review — not recommended" },
                { k: "maintenance", t: "Maintenance mode", d: "Takes the storefront offline for everyone" },
              ].map((row) => (
                <label key={row.k} className={s.check}>
                  <input type="checkbox"
                         checked={platform[row.k as keyof typeof platform] as boolean}
                         onChange={(e) => setPlatform({ ...platform, [row.k]: e.target.checked })} />
                  <span>
                    <strong>{row.t}</strong>
                    <span className={s.checkD}>{row.d}</span>
                  </span>
                </label>
              ))}

              <div>
                <Button disabled={saving} onClick={() => void save("Platform settings")}>
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "commission" && (
        <Card>
          <CardHeader title="Commission & payouts" subtitle="Defaults applied to new merchants" />
          <CardBody>
            <div className={s.fields} style={{ maxWidth: 620 }}>
              <div className={s.two}>
                <Input label="Default commission (%)" value={money.default_commission}
                       onChange={(e) => setMoney({ ...money, default_commission: e.target.value })}
                       hint="Overridable per merchant" />
                <Input label="Minimum payout (₹)" value={money.min_payout}
                       onChange={(e) => setMoney({ ...money, min_payout: e.target.value })}
                       hint="Below this, the balance rolls to the next cycle" />
              </div>
              <div className={s.two}>
                <Select label="Settlement day" value={money.payout_day}
                        onChange={(e) => setMoney({ ...money, payout_day: e.target.value })}
                        options={[
                          { value: "monday", label: "Every Monday" },
                          { value: "friday", label: "Every Friday" },
                          { value: "fortnightly", label: "Fortnightly" },
                        ]} />
                <Input label="Payout hold (days)" value={money.hold_days}
                       onChange={(e) => setMoney({ ...money, hold_days: e.target.value })}
                       hint="Held until the return window closes" />
              </div>
              <Input label="Free shipping above (₹)" value={money.free_ship_above}
                     onChange={(e) => setMoney({ ...money, free_ship_above: e.target.value })} />
              <div className={s.warn}>
                <Icon name="alert" size={16} />
                <span>
                  Changing the default commission affects new merchants only. Existing
                  rates are per-merchant and must be updated from their profile.
                </span>
              </div>
              <div>
                <Button disabled={saving} onClick={() => void save("Commission settings")}>
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "policies" && (
        <Card>
          <CardHeader title="Marketplace policies" subtitle="Rules enforced across every merchant" />
          <CardBody>
            <div className={s.fields} style={{ maxWidth: 620 }}>
              <div className={s.two}>
                <Input label="Return window (days)" value={policy.return_days}
                       onChange={(e) => setPolicy({ ...policy, return_days: e.target.value })} />
                <Input label="Free cancellation window (hours)" value={policy.cancel_window_hrs}
                       onChange={(e) => setPolicy({ ...policy, cancel_window_hrs: e.target.value })} />
              </div>
              <div className={s.two}>
                <Input label="Merchant fulfilment SLA (hours)" value={policy.merchant_sla_hrs}
                       onChange={(e) => setPolicy({ ...policy, merchant_sla_hrs: e.target.value })} />
                <Input label="Support first-response SLA (hours)" value={policy.support_sla_hrs}
                       onChange={(e) => setPolicy({ ...policy, support_sla_hrs: e.target.value })} />
              </div>
              <label className={s.check}>
                <input type="checkbox" checked={policy.review_requires_purchase}
                       onChange={(e) => setPolicy({ ...policy, review_requires_purchase: e.target.checked })} />
                <span>
                  <strong>Reviews require a delivered order</strong>
                  <span className={s.checkD}>Blocks fake reviews — verified on the server</span>
                </span>
              </label>
              <Textarea label="Seller agreement summary" rows={4} value={policy.terms}
                        onChange={(e) => setPolicy({ ...policy, terms: e.target.value })} />
              <div>
                <Button disabled={saving} onClick={() => void save("Policies")}>
                  {saving ? "Saving…" : "Save policies"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "catalogue" && (
        <Card>
          <CardHeader title="Categories" subtitle="Self-referencing tree — parents and their children"
                      action={<Button size="sm"><Icon name="plus" size={14} /> Add category</Button>} />
          <CardBody>
            <div className={s.docs}>
              {categories.filter((c) => c.depth === 0).map((root) => (
                <div key={root.id} style={{ display: "grid", gap: 6 }}>
                  <div className={s.doc}>
                    <span className={s.docIco} style={{ background: "var(--accent-subtle)", color: "var(--text-brand)" }}>
                      <Icon name="grid" size={15} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className={s.docT}>{root.name}</div>
                      <div className={s.docD}>
                        <span className="mono">{root.slug}</span> · {root.product_count} products
                      </div>
                    </div>
                    <Badge tone={root.is_active ? "success" : "neutral"} dot>
                      {root.is_active ? "active" : "hidden"}
                    </Badge>
                    <Button size="sm" variant="ghost"><Icon name="edit" size={13} /></Button>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 44 }}>
                    {categories.filter((c) => c.parent_id === root.id).map((child) => (
                      <span key={child.id} style={{
                        fontSize: "var(--fs-xs)", padding: "3px 9px", borderRadius: "var(--r-full)",
                        background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}>
                        {child.name} · {child.product_count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "couriers" && (
        <Card>
          <CardHeader title="Courier partners" subtitle="Who can carry marketplace shipments"
                      action={<Button size="sm"><Icon name="plus" size={14} /> Add partner</Button>} />
          <CardBody>
            <div className={s.docs}>
              {couriers.map((c) => (
                <div key={c.id} className={s.doc}>
                  <Thumb hue={c.logo_hue} size={36} label={c.name} />
                  <div style={{ flex: 1 }}>
                    <div className={s.docT}>{c.name} <span className="mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{c.code}</span></div>
                    <div className={s.docD}>
                      {c.sla_days}-day SLA · {(c.on_time_rate * 100).toFixed(1)}% on time ·
                      {" "}{c.serviceable_states.length} states · {c.active_shipments} active
                    </div>
                  </div>
                  <Badge tone={c.cod_supported ? "success" : "neutral"}>
                    {c.cod_supported ? "COD supported" : "Prepaid only"}
                  </Badge>
                  <Button size="sm" variant="ghost"><Icon name="edit" size={13} /></Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "staff" && (
        <Card>
          <CardHeader title="Staff & roles" subtitle="Who can access the admin console"
                      action={<Button size="sm"><Icon name="plus" size={14} /> Invite staff</Button>} />
          <CardBody>
            <div className={s.docs}>
              {STAFF.map((p) => (
                <div key={p.email} className={s.doc}>
                  <Thumb hue={p.hue} size={36} radius={999} label={p.name} />
                  <div style={{ flex: 1 }}>
                    <div className={s.docT}>{p.name}</div>
                    <div className={s.docD}>{p.email}</div>
                  </div>
                  <Badge tone={p.mfa ? "success" : "warning"} dot>
                    {p.mfa ? "MFA on" : "MFA off"}
                  </Badge>
                  <Badge tone={p.role === "Super admin" ? "brand" : "neutral"}>{p.role}</Badge>
                  {p.role !== "Super admin" && (
                    <Button size="sm" variant="ghost" style={{ color: "var(--danger-fg)" }}>
                      Revoke
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
