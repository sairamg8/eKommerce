import { useState } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../store/ToastContext";
import s from "./AddressesPage.module.css";

type Addr = {
  id: string; label: string; recipient: string; phone: string;
  line1: string; line2: string; city: string; state: string;
  pincode: string; is_default: boolean;
};

const SEED: Addr[] = [
  { id: "adr_1", label: "Home", recipient: "Aditya Sharma", phone: "+91 98450 11223",
    line1: "12 Brigade Road", line2: "Ashok Nagar", city: "Bengaluru",
    state: "Karnataka", pincode: "560001", is_default: true },
  { id: "adr_2", label: "Office", recipient: "Aditya Sharma", phone: "+91 98450 11223",
    line1: "Prestige Tech Park, Tower B", line2: "Marathahalli", city: "Bengaluru",
    state: "Karnataka", pincode: "560103", is_default: false },
  { id: "adr_3", label: "Parents", recipient: "Ramesh Sharma", phone: "+91 94220 55110",
    line1: "44 Civil Lines", line2: "", city: "Nagpur",
    state: "Maharashtra", pincode: "440001", is_default: false },
];

const EMPTY: Addr = {
  id: "", label: "", recipient: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", is_default: false,
};

export function AddressesPage() {
  const [addresses, setAddresses] = useState<Addr[]>(SEED);
  const [editing, setEditing] = useState<Addr | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { push } = useToast();

  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditing((a) => (a ? { ...a, [k]: e.target.value } : a));

  const save = () => {
    if (!editing) return;
    const errs: Record<string, string> = {};
    if (!editing.label.trim()) errs.label = "Give this address a name";
    if (!editing.recipient.trim()) errs.recipient = "Recipient name is required";
    if (!/^\d{6}$/.test(editing.pincode)) errs.pincode = "PIN code must be 6 digits";
    if (!editing.line1.trim()) errs.line1 = "Street address is required";
    if (!editing.city.trim()) errs.city = "City is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setAddresses((list) =>
      editing.id
        ? list.map((a) => (a.id === editing.id ? editing : a))
        : [...list, { ...editing, id: `adr_${list.length + 1}` }]);
    push(editing.id ? "Address updated" : "Address added", "success");
    setEditing(null);
  };

  const makeDefault = (id: string) => {
    setAddresses((list) => list.map((a) => ({ ...a, is_default: a.id === id })));
    push("Default delivery address changed", "success");
  };

  const remove = (id: string) => {
    setAddresses((list) => list.filter((a) => a.id !== id));
    push("Address removed", "info");
  };

  return (
    <div>
      <PageHeader title="Addresses" subtitle="Where your orders can be delivered"
        actions={<Button size="sm" onClick={() => { setEditing({ ...EMPTY }); setErrors({}); }}>
          <Icon name="plus" size={14} /> Add address
        </Button>} />

      <div className={s.grid}>
        {addresses.map((a) => (
          <div key={a.id} className={cn(s.card, a.is_default && s.default)}>
            <div className={s.top}>
              <Icon name="mapPin" size={15} />
              <span className={s.label}>{a.label}</span>
              {a.is_default && <Badge tone="brand">Default</Badge>}
            </div>
            <div className={s.text}>
              {a.recipient}<br />
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}, {a.state} {a.pincode}
            </div>
            <div className={s.phone}>{a.phone}</div>
            <div className={s.actions}>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setErrors({}); }}>
                <Icon name="edit" size={13} /> Edit
              </Button>
              {!a.is_default && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => makeDefault(a.id)}>
                    Set default
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}
                          style={{ color: "var(--danger-fg)", marginLeft: "auto" }}>
                    <Icon name="trash" size={13} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        <button className={s.add} onClick={() => { setEditing({ ...EMPTY }); setErrors({}); }}>
          <Icon name="plus" size={22} />
          Add a new address
        </button>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)}
             title={editing?.id ? "Edit address" : "Add address"}
             subtitle="Used at checkout and printed on the shipping label"
             footer={
               <>
                 <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                 <Button onClick={save}>{editing?.id ? "Save changes" : "Add address"}</Button>
               </>
             }>
        {editing && (
          <div className={s.form}>
            <div className={s.two}>
              <Input label="Label" value={editing.label} onChange={set("label")}
                     error={errors.label} placeholder="Home, Office…" required />
              <Input label="Recipient" value={editing.recipient} onChange={set("recipient")}
                     error={errors.recipient} required />
            </div>
            <Input label="Phone" value={editing.phone} onChange={set("phone")}
                   placeholder="+91 …" hint="The delivery agent calls this number" />
            <Input label="Street address" value={editing.line1} onChange={set("line1")}
                   error={errors.line1} placeholder="Flat / house no, building, street" required />
            <Input label="Area / landmark" value={editing.line2} onChange={set("line2")} />
            <div className={s.two}>
              <Input label="City" value={editing.city} onChange={set("city")}
                     error={errors.city} required />
              <Input label="State" value={editing.state} onChange={set("state")} />
            </div>
            <Input label="PIN code" value={editing.pincode} onChange={set("pincode")}
                   error={errors.pincode} inputMode="numeric" maxLength={6} required
                   hint="Serviceability is checked against this" />
          </div>
        )}
      </Modal>
    </div>
  );
}
