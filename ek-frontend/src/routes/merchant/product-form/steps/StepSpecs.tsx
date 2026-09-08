import type { Errors, ProductDraft, SpecRow } from "../useProductForm";
import { Input } from "../../../../components/ui/Input";
import { Icon } from "../../../../components/ui/Icon";
import { categories } from "../../../../mock/db";
import s from "../ProductFormPage.module.css";

/** Category-aware suggestions — what a real build drives from a spec template table. */
const SUGGESTIONS: Record<string, string[]> = {
  Audio: ["Driver size", "Battery life", "Bluetooth version", "Noise cancellation", "Weight", "Warranty"],
  Wearables: ["Display type", "Battery life", "Water resistance", "GPS", "Strap material"],
  Cameras: ["Sensor", "Megapixels", "Video resolution", "Mount", "Stabilisation"],
  Laptops: ["Processor", "RAM", "Storage", "Display size", "Graphics", "Battery life"],
  Peripherals: ["Connectivity", "Switch type", "DPI", "Layout", "Warranty"],
  Storage: ["Capacity", "Interface", "Read speed", "Write speed", "Form factor"],
  Cookware: ["Material", "Diameter", "Induction safe", "Dishwasher safe", "Warranty"],
  Appliances: ["Power", "Capacity", "Voltage", "Warranty", "Noise level"],
  Decor: ["Material", "Dimensions", "Colour", "Care instructions"],
  Men: ["Fabric", "Fit", "Care", "Country of origin", "Sleeve"],
  Women: ["Fabric", "Fit", "Length", "Care", "Country of origin"],
  Accessories: ["Material", "Dimensions", "Colour", "Warranty"],
  Equipment: ["Material", "Weight", "Dimensions", "Max load", "Warranty"],
  Supplements: ["Serving size", "Servings per pack", "Flavour", "Vegetarian", "Shelf life"],
  Technology: ["Author", "Pages", "Publisher", "Edition", "Language"],
  Business: ["Author", "Pages", "Publisher", "Edition", "Language"],
};

export function StepSpecs({ draft, set, errors }: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => void;
  errors: Errors;
}) {
  const catName = categories.find((c) => c.id === draft.category_id)?.name ?? "";
  const used = new Set(draft.specs.map((x) => x.key.toLowerCase()));
  const suggestions = (SUGGESTIONS[catName] ?? ["Material", "Dimensions", "Weight", "Warranty"])
    .filter((x) => !used.has(x.toLowerCase()));

  const update = (i: number, patch: Partial<SpecRow>) => {
    const next = draft.specs.map((row, j) => (j === i ? { ...row, ...patch } : row));
    set("specs", next);
  };

  const addRow = (key = "") => set("specs", [...draft.specs, { key, value: "" }]);

  return (
    <div className={s.fields}>
      <div>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>
          Specifications {catName && <span style={{ color: "var(--text-muted)" }}>· {catName}</span>}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {draft.specs.map((row, i) => (
            <div key={i} className={s.specRow}>
              <Input value={row.key} onChange={(e) => update(i, { key: e.target.value })}
                     placeholder="Attribute" aria-label={`Specification ${i + 1} name`} />
              <Input value={row.value} onChange={(e) => update(i, { value: e.target.value })}
                     placeholder="Value" aria-label={`Specification ${i + 1} value`} />
              <button type="button" className={s.rowBtn} aria-label="Remove specification"
                      onClick={() => set("specs", draft.specs.filter((_, j) => j !== i))}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
        {errors.specs && <div className={s.err} style={{ marginTop: 8 }}>{errors.specs}</div>}

        <div className={s.suggest}>
          <button type="button" className={s.chip} onClick={() => addRow()}>
            <Icon name="plus" size={11} /> Add row
          </button>
          {suggestions.map((k) => (
            <button key={k} type="button" className={s.chip} onClick={() => addRow(k)}>
              + {k}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6,
        padding: "12px 14px", background: "var(--surface-sunken)", borderRadius: "var(--r-lg)",
      }}>
        These land in the <span className="mono">products.attributes</span> jsonb column, which
        is what your Category Schema decision was for. A GIN index over that column lets
        shoppers filter on any attribute without a table per category.
      </div>
    </div>
  );
}
