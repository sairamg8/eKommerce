import type { ProductDraft, StepId } from "../useProductForm";
import { STEPS, validateStep } from "../useProductForm";
import { money } from "../../../../lib/format";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Icon } from "../../../../components/ui/Icon";
import { categories } from "../../../../mock/db";
import s from "../ProductFormPage.module.css";

export function StepReview({ draft, goTo }: {
  draft: ProductDraft;
  goTo: (id: StepId) => void;
}) {
  const category = categories.find((c) => c.id === draft.category_id);
  const problems = STEPS
    .filter((st) => st.id !== "review")
    .map((st) => ({ step: st, errs: Object.values(validateStep(st.id, draft)) }))
    .filter((x) => x.errs.length > 0);

  const images = draft.media.filter((m) => m.kind === "image").length;
  const videos = draft.media.filter((m) => m.kind === "video").length;
  const docs = draft.media.filter((m) => m.kind === "document").length;
  const specs = draft.specs.filter((x) => x.key.trim() && x.value.trim());

  return (
    <div className={s.review}>
      {problems.length > 0 && (
        <div style={{
          padding: "var(--sp-4)", background: "var(--danger-bg)",
          border: "1px solid var(--danger-border)", borderRadius: "var(--r-lg)",
          display: "grid", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--danger-fg)", fontWeight: 600 }}>
            <Icon name="alert" size={16} /> {problems.length} section{problems.length > 1 ? "s" : ""} still need attention
          </div>
          {problems.map((p) => (
            <div key={p.step.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--danger-fg)" }}>
                <strong>{p.step.label}:</strong> {p.errs[0]}
              </span>
              <Button size="sm" variant="secondary" onClick={() => goTo(p.step.id)}>Fix</Button>
            </div>
          ))}
        </div>
      )}

      <div className={s.rGroup}>
        <div className={s.rTitle}>Product details</div>
        <div className={s.rRow}><span className={s.rk}>Title</span><span className={s.rv}>{draft.name || "—"}</span></div>
        <div className={s.rRow}><span className={s.rk}>Brand</span><span className={s.rv}>{draft.brand || "—"}</span></div>
        <div className={s.rRow}><span className={s.rk}>Category</span><span className={s.rv}>{category?.name ?? "—"}</span></div>
        <div className={s.rRow}><span className={s.rk}>Key features</span><span className={s.rv}>{draft.highlights.filter((h) => h.trim()).length}</span></div>
        <div className={s.rRow}><span className={s.rk}>Description</span><span className={s.rv}>{draft.description.length} characters</span></div>
      </div>

      <div className={s.rGroup}>
        <div className={s.rTitle}>Media</div>
        <div className={s.rRow}><span className={s.rk}>Images</span><span className={s.rv}>{images}</span></div>
        <div className={s.rRow}><span className={s.rk}>Video</span><span className={s.rv}>{videos || "None"}</span></div>
        <div className={s.rRow}><span className={s.rk}>Documents</span><span className={s.rv}>{docs || "None"}</span></div>
      </div>

      <div className={s.rGroup}>
        <div className={s.rTitle}>Pricing &amp; stock</div>
        <div className={s.rRow}><span className={s.rk}>Selling price</span><span className={s.rv}>{draft.price ? money(Number(draft.price) * 100) : "—"}</span></div>
        <div className={s.rRow}><span className={s.rk}>MRP</span><span className={s.rv}>{draft.compare_at_price ? money(Number(draft.compare_at_price) * 100) : "Not set"}</span></div>
        <div className={s.rRow}><span className={s.rk}>SKU</span><span className={`${s.rv} mono`}>{draft.sku || "—"}</span></div>
        <div className={s.rRow}><span className={s.rk}>Opening stock</span><span className={s.rv}>{draft.stock || "—"}</span></div>
      </div>

      <div className={s.rGroup}>
        <div className={s.rTitle}>Specifications ({specs.length})</div>
        {specs.length === 0
          ? <div className={s.rRow}><span className={s.rk}>None added</span></div>
          : specs.map((x) => (
              <div key={x.key} className={s.rRow}>
                <span className={s.rk} style={{ textTransform: "capitalize" }}>{x.key}</span>
                <span className={s.rv}>{x.value}</span>
              </div>
            ))}
      </div>

      <div className={s.rGroup}>
        <div className={s.rTitle}>Shipping</div>
        <div className={s.rRow}><span className={s.rk}>Weight</span><span className={s.rv}>{draft.weight_g ? `${draft.weight_g} g` : "—"}</span></div>
        <div className={s.rRow}>
          <span className={s.rk}>Dimensions</span>
          <span className={s.rv}>
            {draft.length_cm && draft.width_cm && draft.height_cm
              ? `${draft.length_cm} × ${draft.width_cm} × ${draft.height_cm} cm` : "—"}
          </span>
        </div>
        <div className={s.rRow}><span className={s.rk}>Handling time</span><span className={s.rv}>{draft.handling_days} day(s)</span></div>
        <div className={s.rRow}>
          <span className={s.rk}>Flags</span>
          <span className={s.rv} style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            {draft.is_fragile && <Badge tone="warning">Fragile</Badge>}
            {draft.cod_allowed ? <Badge tone="success">COD allowed</Badge> : <Badge tone="neutral">Prepaid only</Badge>}
          </span>
        </div>
      </div>
    </div>
  );
}
