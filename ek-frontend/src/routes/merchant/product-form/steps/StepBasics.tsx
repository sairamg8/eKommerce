import type { Errors, ProductDraft } from "../useProductForm";
import { Input, Textarea } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Icon } from "../../../../components/ui/Icon";
import { cn } from "../../../../lib/cn";
import { categories } from "../../../../mock/db";
import s from "../ProductFormPage.module.css";

const LEAVES = categories.filter((c) => c.depth === 1);

export function StepBasics({ draft, set, errors }: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => void;
  errors: Errors;
}) {
  const parentOf = (id: string) =>
    categories.find((c) => c.id === categories.find((x) => x.id === id)?.parent_id)?.name ?? "";

  const setHighlight = (i: number, value: string) => {
    const next = [...draft.highlights];
    next[i] = value;
    set("highlights", next);
  };

  return (
    <div className={s.fields}>
      <Select
        label="Category" required
        value={draft.category_id}
        error={errors.category_id}
        onChange={(e) => set("category_id", e.target.value)}
        hint="Buyers browse and filter by this. It also decides which specifications apply."
        options={[
          { value: "", label: "Select a category…" },
          ...LEAVES.map((c) => ({ value: c.id, label: `${parentOf(c.id)} › ${c.name}` })),
        ]}
      />

      <div>
        <Input
          label="Product title" required
          value={draft.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Aurora ANC Over-Ear Headphones — 40h Battery, Bluetooth 5.3"
          maxLength={160}
        />
        <div className={cn(s.counter, draft.name.length > 150 && s.overLimit)}>
          {draft.name.length} / 150 · include brand, model and a key feature
        </div>
      </div>

      <Input
        label="Brand" required
        value={draft.brand}
        error={errors.brand}
        onChange={(e) => set("brand", e.target.value)}
        placeholder="e.g. Aurora"
        hint="Use 'Generic' if the product is unbranded"
      />

      <div>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
          Key features <span style={{ color: "var(--danger-solid)" }}>*</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {draft.highlights.map((h, i) => (
            <div key={i} className={s.bullet}>
              <span className={s.bulletNo}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <Input value={h} onChange={(e) => setHighlight(i, e.target.value)}
                       placeholder={i === 0 ? "40-hour battery with fast charge"
                         : i === 1 ? "Hybrid active noise cancellation"
                         : "Memory-foam earcups for all-day comfort"}
                       maxLength={120} aria-label={`Key feature ${i + 1}`} />
              </div>
              {draft.highlights.length > 1 && (
                <button type="button" className={s.rowBtn} aria-label="Remove feature"
                        onClick={() => set("highlights", draft.highlights.filter((_, j) => j !== i))}>
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.highlights && <div className={s.err} style={{ marginTop: 6 }}>{errors.highlights}</div>}
        {draft.highlights.length < 6 && (
          <div className={s.suggest}>
            <button type="button" className={s.chip}
                    onClick={() => set("highlights", [...draft.highlights, ""])}>
              <Icon name="plus" size={11} /> Add another feature
            </button>
          </div>
        )}
      </div>

      <div>
        <Textarea
          label="Description" required rows={7}
          value={draft.description}
          error={errors.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe what the product is, who it is for, what is in the box, and how it is different from alternatives."
        />
        <div className={s.counter}>
          {draft.description.length} characters · listings with 150+ characters convert better
        </div>
      </div>
    </div>
  );
}
