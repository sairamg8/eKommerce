import type { Errors, ProductDraft } from "../useProductForm";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import s from "../ProductFormPage.module.css";

export function StepShipping({ draft, set, errors, slaHours }: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => void;
  errors: Errors;
  slaHours: number;
}) {
  const l = Number(draft.length_cm), w = Number(draft.width_cm), h = Number(draft.height_cm);
  // Couriers bill on whichever is greater: actual or volumetric weight.
  const volumetric = l && w && h ? Math.round((l * w * h) / 5) : 0;
  const actual = Number(draft.weight_g);
  const billable = Math.max(actual, volumetric);

  return (
    <div className={s.fields}>
      <Input label="Shipping weight (grams)" required inputMode="numeric"
             value={draft.weight_g} error={errors.weight_g}
             onChange={(e) => set("weight_g", e.target.value)}
             placeholder="850"
             hint="Weigh the packed parcel, not the bare product" />

      <div>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
          Package dimensions (cm) <span style={{ color: "var(--danger-solid)" }}>*</span>
        </div>
        <div className={s.three}>
          <Input value={draft.length_cm} onChange={(e) => set("length_cm", e.target.value)}
                 placeholder="Length" inputMode="decimal" aria-label="Length in cm" />
          <Input value={draft.width_cm} onChange={(e) => set("width_cm", e.target.value)}
                 placeholder="Width" inputMode="decimal" aria-label="Width in cm" />
          <Input value={draft.height_cm} onChange={(e) => set("height_cm", e.target.value)}
                 placeholder="Height" inputMode="decimal" aria-label="Height in cm" />
        </div>
        {errors.length_cm && <div className={s.err} style={{ marginTop: 6 }}>{errors.length_cm}</div>}
      </div>

      {billable > 0 && (
        <div style={{
          padding: "var(--sp-4)", background: "var(--surface-sunken)",
          borderRadius: "var(--r-lg)", display: "grid", gap: 7,
        }}>
          <div className={s.rTitle}>Courier billing weight</div>
          <div className={s.rRow}>
            <span className={s.rk}>Actual weight</span>
            <span className="tabular">{actual || 0} g</span>
          </div>
          <div className={s.rRow}>
            <span className={s.rk}>Volumetric (L×W×H ÷ 5)</span>
            <span className="tabular">{volumetric} g</span>
          </div>
          <div className={s.rRow} style={{ borderBottom: "none", fontWeight: 700 }}>
            <span>Billable weight</span>
            <span className="tabular">{billable} g</span>
          </div>
        </div>
      )}

      <Select label="Handling time" value={draft.handling_days}
              onChange={(e) => set("handling_days", e.target.value)}
              hint={`Your agreed fulfilment SLA is ${slaHours} hours. Longer handling times rank lower in search.`}
              options={[
                { value: "1", label: "Same or next day" },
                { value: "2", label: "2 business days" },
                { value: "3", label: "3 business days" },
                { value: "5", label: "5 business days (made to order)" },
              ]} />

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" checked={draft.is_fragile}
               onChange={(e) => set("is_fragile", e.target.checked)} />
        <span>
          <span style={{ display: "block", fontSize: "var(--fs-md)", fontWeight: 500 }}>Fragile item</span>
          <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
            Adds a fragile label and restricts which couriers can carry it
          </span>
        </span>
      </label>

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" checked={draft.cod_allowed}
               onChange={(e) => set("cod_allowed", e.target.checked)} />
        <span>
          <span style={{ display: "block", fontSize: "var(--fs-md)", fontWeight: 500 }}>Allow cash on delivery</span>
          <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
            COD lifts conversion but raises the return rate
          </span>
        </span>
      </label>
    </div>
  );
}
