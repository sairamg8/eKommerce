import { useState } from "react";
import { date } from "../../lib/format";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Thumb } from "../../components/ui/Thumb";
import { useToast } from "../../store/ToastContext";
import { customers } from "../../mock/db";
import s from "./ProfilePage.module.css";

export function ProfilePage() {
  const me = customers[0]!;
  const { push } = useToast();
  const [form, setForm] = useState({
    first_name: me.first_name,
    last_name: me.last_name,
    email: me.email,
    phone: "+91 98450 11223",
  });
  const [prefs, setPrefs] = useState(me.preferences);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    Object.assign(me, form, { preferences: prefs });
    setSaving(false);
    push("Profile updated", "success");
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your personal details and account preferences" />

      <div className={s.grid}>
        <form onSubmit={save} style={{ display: "grid", gap: "var(--sp-4)" }}>
          <Card>
            <CardHeader title="Personal details" subtitle="Shown to merchants on your orders" />
            <CardBody>
              <div className={s.two}>
                <Input label="First name" value={form.first_name} onChange={set("first_name")} required />
                <Input label="Last name" value={form.last_name} onChange={set("last_name")} required />
              </div>
              <div style={{ marginTop: 14 }}>
                <Input label="Email address" type="email" value={form.email} onChange={set("email")}
                       required hint="Used for order confirmations and delivery updates" />
              </div>
              <div style={{ marginTop: 14 }}>
                <Input label="Phone" value={form.phone} onChange={set("phone")}
                       hint="Delivery agents call this number" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Preferences" subtitle="Stored as a jsonb column on the users table" />
            <CardBody>
              <div className={s.two}>
                <Select label="Currency" value={prefs.currency}
                        onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
                        options={[{ value: "INR", label: "₹ Indian Rupee" }, { value: "USD", label: "$ US Dollar" }]} />
                <Select label="Theme" value={prefs.theme}
                        onChange={(e) => setPrefs({ ...prefs, theme: e.target.value as "light" | "dark" })}
                        options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
              </div>
              <label className={s.check} style={{ marginTop: 14 }}>
                <input type="checkbox" checked={prefs.newsletter}
                       onChange={(e) => setPrefs({ ...prefs, newsletter: e.target.checked })} />
                <span>
                  <span className={s.ct}>Email me about offers</span>
                  <span className={s.cd}>Weekly digest of deals from merchants you follow</span>
                </span>
              </label>
            </CardBody>
          </Card>

          <div style={{ display: "flex", gap: 8 }}>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="secondary"
                    onClick={() => { setForm({ first_name: me.first_name, last_name: me.last_name, email: me.email, phone: "+91 98450 11223" }); setPrefs(me.preferences); }}>
              Reset
            </Button>
          </div>
        </form>

        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          <Card>
            <CardBody>
              <div className={s.avatarRow}>
                <Thumb hue={me.avatar_hue} size={64} radius={999} label={`${me.first_name} ${me.last_name}`} />
                <div>
                  <div className={s.aName}>{me.first_name} {me.last_name}</div>
                  <Badge tone="brand">{me.role}</Badge>
                </div>
              </div>
              <Button variant="secondary" size="sm" block style={{ marginTop: 14 }}>
                <Icon name="upload" size={14} /> Change photo
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" />
            <CardBody>
              <div className={s.meta}><span>Member since</span><span>{date(me.created_at)}</span></div>
              <div className={s.meta}><span>Orders placed</span><span>{me.orders_count}</span></div>
              <div className={s.meta}><span>Account ID</span><span className="mono">{me.id}</span></div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Security" />
            <CardBody>
              <Button variant="secondary" size="sm" block>
                <Icon name="shield" size={14} /> Change password
              </Button>
              <Button variant="ghost" size="sm" block style={{ marginTop: 8, color: "var(--danger-fg)" }}>
                <Icon name="trash" size={14} /> Delete account
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
