import type { ProductDraft } from "./useProductForm";
import { money } from "../../../lib/format";
import { Badge } from "../../../components/ui/Badge";
import { Icon } from "../../../components/ui/Icon";
import { Rating } from "../../../components/ui/Rating";

/** Shows the merchant exactly what a shopper sees on the catalogue card. */
export function LivePreview({ draft, merchantName }: { draft: ProductDraft; merchantName: string }) {
  const price = Number(draft.price) * 100;
  const compare = Number(draft.compare_at_price) * 100;
  const off = compare > price && price > 0 ? Math.round((1 - price / compare) * 100) : 0;
  const cover = draft.media.find((m) => m.id === draft.primary_media_id)
    ?? draft.media.find((m) => m.kind === "image");
  const hue = cover?.hue ?? 220;

  return (
    <div style={{
      border: "1px solid var(--border-subtle)", borderRadius: "var(--r-xl)",
      overflow: "hidden", background: "var(--surface-card)",
    }}>
      <div style={{
        aspectRatio: "4 / 3", display: "grid", placeItems: "center", position: "relative",
        background: `linear-gradient(145deg, hsl(${hue} 60% 93%), hsl(${(hue + 45) % 360} 55% 85%))`,
        color: `hsl(${hue} 45% 34%)`,
      }}>
        {cover
          ? <Icon name="image" size={30} />
          : <span style={{ fontSize: "var(--fs-xs)", opacity: 0.7 }}>No image yet</span>}
        {off > 0 && (
          <span style={{ position: "absolute", top: 8, left: 8 }}>
            <Badge tone="danger">{off}% off</Badge>
          </span>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px", display: "grid", gap: 5 }}>
        <span style={{
          fontSize: "var(--fs-2xs)", color: "var(--text-muted)", fontWeight: 500,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          {merchantName}
        </span>
        <span style={{ fontSize: "var(--fs-md)", fontWeight: 550, lineHeight: 1.35 }}>
          {draft.name.trim() || "Your product title appears here"}
        </span>
        <Rating value={0} count={0} size={12} showValue={false} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span className="tabular" style={{ fontSize: "var(--fs-lg)", fontWeight: 650 }}>
            {price > 0 ? money(price) : "₹—"}
          </span>
          {off > 0 && (
            <span className="tabular" style={{
              fontSize: "var(--fs-xs)", color: "var(--text-muted)", textDecoration: "line-through",
            }}>
              {money(compare)}
            </span>
          )}
        </div>
        <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-muted)" }}>
          {draft.stock ? `${draft.stock} in stock` : "Stock not set"}
        </span>
      </div>
    </div>
  );
}
