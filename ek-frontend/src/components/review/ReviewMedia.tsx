import { useState } from "react";
import type { MediaAsset } from "../../mock/types";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import s from "./ReviewComposer.module.css";

/** Customer photo strip under a review, with a lightbox. */
export function ReviewMedia({ media }: { media: MediaAsset[] }) {
  const [open, setOpen] = useState<MediaAsset | null>(null);
  if (!media.length) return null;

  return (
    <>
      <div className={s.gallery}>
        {media.map((m) => (
          <button key={m.id} className={s.shot} onClick={() => setOpen(m)}
                  aria-label={`View ${m.kind}`}
                  style={{
                    background: `linear-gradient(145deg, hsl(${m.hue} 60% 92%), hsl(${(m.hue + 40) % 360} 55% 84%))`,
                    color: `hsl(${m.hue} 45% 32%)`,
                  }}>
            <Icon name={m.kind === "video" ? "camera" : "image"} size={17} />
            {m.kind === "video" && (
              <span className={s.play}><Icon name="chevronRight" size={16} /></span>
            )}
          </button>
        ))}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)}
             title={open?.kind === "video" ? "Customer video" : "Customer photo"}
             subtitle={open ? `Uploaded by ${open.uploaded_by}` : ""}>
        {open && (
          <div style={{
            aspectRatio: "4 / 3", borderRadius: "var(--r-xl)", display: "grid",
            placeItems: "center", gap: 8,
            background: `linear-gradient(145deg, hsl(${open.hue} 60% 92%), hsl(${(open.hue + 40) % 360} 55% 84%))`,
            color: `hsl(${open.hue} 45% 30%)`,
          }}>
            <Icon name={open.kind === "video" ? "camera" : "image"} size={42} />
            <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{open.filename}</span>
            {open.duration_s != null && (
              <span style={{ fontSize: "var(--fs-xs)", opacity: 0.8 }}>
                {Math.floor(open.duration_s / 60)}:{String(open.duration_s % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
