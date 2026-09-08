import type { Errors, ProductDraft } from "../useProductForm";
import { Input } from "../../../../components/ui/Input";
import { money } from "../../../../lib/format";
import s from "../ProductFormPage.module.css";

export function StepPricing({ draft, set, errors, commissionPct }: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => void;
  errors: Errors;
  commissionPct: number;
}) {
  const price = Number(draft.price) * 100;
  const cost = Number(draft.cost) * 100;
  const commission = Math.round((price * commissionPct) / 100);
  const net = price - commission;
  const profit = net - cost;
  const marginPct = price > 0 ? (profit / price) * 100 : 0;

  return (
    <div className={s.fields}>
      <div className={s.two}>
        <Input label="Selling price (₹)" required inputMode="decimal"
               value={draft.price} error={errors.price}
               onChange={(e) => set("price", e.target.value)}
               placeholder="18999"
               hint="Stored as paise server-side — integer money, never a float" />
        <Input label="MRP / compare-at price (₹)" inputMode="decimal"
               value={draft.compare_at_price} error={errors.compare_at_price}
               onChange={(e) => set("compare_at_price", e.target.value)}
               placeholder="24999"
               hint="Shown struck through. Must be above the selling price." />
      </div>

      <Input label="Your cost price (₹)" required inputMode="decimal"
             value={draft.cost} error={errors.cost}
             onChange={(e) => set("cost", e.target.value)}
             placeholder="9500"
             hint="Private to you — powers margin reporting. Never sent to shoppers." />

      {price > 0 && (
        <div style={{
          padding: "var(--sp-4)", background: "var(--surface-sunken)",
          borderRadius: "var(--r-lg)", display: "grid", gap: 7,
        }}>
          <div className={s.rTitle}>What you actually earn per unit</div>
          <div className={s.rRow}>
            <span className={s.rk}>Customer pays</span>
            <span className="tabular">{money(price)}</span>
          </div>
          <div className={s.rRow}>
            <span className={s.rk}>Platform commission ({commissionPct}%)</span>
            <span className="tabular">−{money(commission)}</span>
          </div>
          <div className={s.rRow}>
            <span className={s.rk}>Your cost</span>
            <span className="tabular">−{money(cost)}</span>
          </div>
          <div className={s.rRow} style={{ borderBottom: "none", fontWeight: 700 }}>
            <span>Profit per unit</span>
            <span className="tabular" style={{
              color: profit > 0 ? "var(--success-fg)" : "var(--danger-fg)",
            }}>
              {money(profit)} ({marginPct.toFixed(1)}% margin)
            </span>
          </div>
        </div>
      )}

      <div className={s.two}>
        <Input label="SKU" required value={draft.sku} error={errors.sku}
               onChange={(e) => set("sku", e.target.value.toUpperCase())}
               placeholder="AUR-0042"
               hint="Your own stock code. Must be unique within your catalogue." />
        <Input label="Opening stock" required inputMode="numeric"
               value={draft.stock} error={errors.stock}
               onChange={(e) => set("stock", e.target.value)}
               placeholder="120"
               hint="Written as the first stock_movements row, not a stock column" />
      </div>

      <Input label="Low-stock alert threshold" inputMode="numeric"
             value={draft.low_stock_threshold}
             onChange={(e) => set("low_stock_threshold", e.target.value)}
             hint="You get an alert once stock falls to this level" />
    </div>
  );
}
