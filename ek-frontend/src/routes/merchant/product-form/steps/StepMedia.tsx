import type { Errors, ProductDraft } from "../useProductForm";
import { MediaUploader } from "../../../../components/media/MediaUploader";
import { Icon } from "../../../../components/ui/Icon";
import s from "../ProductFormPage.module.css";

export function StepMedia({ draft, set, errors, merchantName }: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => void;
  errors: Errors;
  merchantName: string;
}) {
  const images = draft.media.filter((m) => m.kind === "image");
  const videos = draft.media.filter((m) => m.kind === "video");
  const docs = draft.media.filter((m) => m.kind === "document");

  return (
    <div className={s.fields}>
      <MediaUploader
        label="Product media"
        value={draft.media}
        uploadedBy={merchantName}
        max={10}
        accept={["image", "video", "document"]}
        primaryId={draft.primary_media_id}
        onPrimary={(id) => set("primary_media_id", id)}
        onChange={(next) => {
          set("media", next);
          // First image uploaded becomes the cover automatically.
          const firstImage = next.find((m) => m.kind === "image");
          if (firstImage && !next.some((m) => m.id === draft.primary_media_id)) {
            set("primary_media_id", firstImage.id);
          }
        }}
        hint="Hover a tile to set the cover image or remove it. The cover is what shoppers see in search."
      />

      {errors.media && <div className={s.err}>{errors.media}</div>}
      {errors.primary_media_id && <div className={s.err}>{errors.primary_media_id}</div>}

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "var(--sp-3)", marginTop: "var(--sp-2)",
      }}>
        {[
          { icon: "image", n: images.length, need: "1 required, 3+ recommended", label: "Images" },
          { icon: "camera", n: videos.length, need: "Optional — lifts conversion", label: "Video" },
          { icon: "file", n: docs.length, need: "Optional — manual or spec sheet", label: "PDF documents" },
        ].map((row) => (
          <div key={row.label} style={{
            display: "flex", gap: 10, alignItems: "center", padding: "12px 14px",
            border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)",
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center",
              background: "var(--surface-sunken)", color: "var(--text-secondary)",
            }}>
              <Icon name={row.icon} size={16} />
            </span>
            <div>
              <div style={{ fontWeight: 650, fontSize: "var(--fs-md)" }}>
                {row.n} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{row.label}</span>
              </div>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-muted)" }}>{row.need}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6,
        padding: "12px 14px", background: "var(--surface-sunken)", borderRadius: "var(--r-lg)",
      }}>
        <strong>What the backend does here:</strong> the browser requests a pre-signed upload
        URL, uploads straight to object storage, then posts the returned key to
        <span className="mono"> POST /merchant/products/:id/media</span>. Files never pass
        through the API server. MIME type and size are validated again server-side — the
        client checks are a convenience, not a control.
      </div>
    </div>
  );
}
